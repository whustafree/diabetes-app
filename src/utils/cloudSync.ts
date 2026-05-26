import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirestoreDB, isFirestoreAvailable, markFirestoreFailed } from '../firebase/config';
import {
  saveToCloudViaRest,
  loadFromCloudViaRest,
} from './cloudSyncRest';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

/**
 * Caché de promesas para evitar llamadas simultáneas al mismo documento.
 * Soluciona el error "Target ID already exists" que ocurre cuando múltiples
 * componentes llaman getDoc() sobre el mismo documento al mismo tiempo.
 */
const pendingDocReads = new Map<string, Promise<any>>();

function getDocCacheKey(uid: string, collectionName: string): string {
  return `${uid}:${collectionName}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Detecta el error FIRESTORE INTERNAL ASSERTION FAILED.
 * Este error indica una falla interna del SDK de Firestore que hace
 * que el SDK entre en un bucle infinito. Cuando ocurre, debemos
 * marcar Firestore como no disponible y usar solo REST API.
 */
function isInternalAssertionError(err: any): boolean {
  return (
    err?.message?.includes?.('INTERNAL ASSERTION FAILED') ||
    err?.message?.includes?.('Unexpected state') ||
    false
  );
}

/**
 * Detecta si un error de Firestore es por estar offline.
 */
function isOfflineError(err: any): boolean {
  return (
    err?.message?.includes?.('client is offline') ||
    err?.message?.includes?.('offline') ||
    err?.code === 'unavailable'
  );
}

/**
 * Detecta el error "Target ID already exists" del SDK de Firestore v11.
 * Este error ocurre cuando el SDK interno de gRPC recibe una solicitud
 * para crear un watch target que ya existe. Es un bug conocido del SDK.
 * Cuando ocurre, debemos irnos inmediatamente a REST API.
 */
function isTargetIdExistsError(err: any): boolean {
  return (
    err?.message?.includes?.('Target ID already exists') ||
    err?.code === 'firestore/target-id-exists'
  );
}

export interface CloudData<T> {
  items: T[];
  updatedAt: string;
}

/**
 * Guarda datos en Firestore.
 *
 * Estrategia:
 *   1. Intentar con el SDK de Firestore (con reintentos)
 *   2. Si falla por "offline", hacer fallback a REST API (fetch estándar)
 *
 * @param uid - ID del usuario
 * @param collectionName - Nombre de la subcolección (e.g., 'medications', 'reminders')
 * @param items - Array de items a guardar
 */
export async function saveToCloud<T>(
  uid: string,
  collectionName: string,
  items: T[]
): Promise<boolean> {
  // ── Verificar si Firestore SDK está disponible ──
  if (!isFirestoreAvailable()) {
    console.info('[SDK] Firestore no disponible, yendo directo a REST API');
    return saveToCloudViaRest(uid, collectionName, items);
  }

  // ── Intento 1: SDK de Firestore ──
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const db = getFirestoreDB();
      const ref = doc(db, 'users', uid, collectionName, 'all');
      await setDoc(ref, {
        items: JSON.parse(JSON.stringify(items)),
        updatedAt: new Date().toISOString(),
      } satisfies CloudData<T>);
      return true;
    } catch (err: any) {
      // Error de aserción interna — Firestore SDK no es confiable, marcar como fallido
      if (isInternalAssertionError(err)) {
        console.error('[SDK] Error interno de Firestore SDK, deshabilitando SDK y usando REST API');
        markFirestoreFailed();
        break;
      }
      if (isOfflineError(err) && attempt < MAX_RETRIES) {
        console.warn(`[SDK] Intento ${attempt}/${MAX_RETRIES} offline, reintentando...`);
        await delay(RETRY_DELAY_MS);
        continue;
      }
      if (isOfflineError(err)) {
        console.warn('[SDK] Firestore offline, usando REST API como fallback');
      } else {
        console.error(`[SDK] Error guardando ${collectionName}:`, err);
      }
    }
  }

  // ── Fallback: REST API ──
  console.info('[REST] Guardando usando REST API...');
  return saveToCloudViaRest(uid, collectionName, items);
}

/**
 * Carga datos desde Firestore.
 *
 * Estrategia:
 *   1. Intentar con el SDK de Firestore (con reintentos)
 *   2. Si falla por "offline", hacer fallback a REST API
 *
 * @param uid - ID del usuario
 * @param collectionName - Nombre de la subcolección
 * @returns Los datos o null si no existen
 */
export async function loadFromCloud<T>(
  uid: string,
  collectionName: string
): Promise<CloudData<T> | null> {
  const cacheKey = getDocCacheKey(uid, collectionName);

  // Si ya hay una lectura en curso para este mismo documento, reutilizar la promesa
  // Esto evita el error "Target ID already exists" del SDK de Firestore
  const existing = pendingDocReads.get(cacheKey);
  if (existing) {
    return existing as Promise<CloudData<T> | null>;
  }

  // ── Verificar si Firestore SDK está disponible ──
  if (!isFirestoreAvailable()) {
    console.info('[SDK] Firestore no disponible, yendo directo a REST API');
    const result = await loadFromCloudViaRest<T>(uid, collectionName);
    pendingDocReads.delete(cacheKey);
    return result;
  }

  // ── Intento 1: SDK de Firestore ──
  const promise = (async () => {
    try {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const db = getFirestoreDB();
          const ref = doc(db, 'users', uid, collectionName, 'all');
          const snapshot = await getDoc(ref);
          if (!snapshot.exists()) return null;
          return snapshot.data() as CloudData<T>;
        } catch (err: any) {
          // Error de aserción interna — Firestore SDK no es confiable
          if (isInternalAssertionError(err)) {
            console.error('[SDK] Error interno de Firestore SDK, deshabilitando SDK y usando REST API');
            markFirestoreFailed();
            break;
          }
          // Error "Target ID already exists" — bug conocido del SDK v11.
          // No reintentar con SDK, ir directamente a REST API.
          if (isTargetIdExistsError(err)) {
            console.warn(`[SDK] Target ID conflict en ${collectionName}, usando REST API como fallback`);
            break;
          }
          if (isOfflineError(err) && attempt < MAX_RETRIES) {
            console.warn(`[SDK] Intento ${attempt}/${MAX_RETRIES} offline, reintentando...`);
            await delay(RETRY_DELAY_MS);
            continue;
          }
          if (isOfflineError(err)) {
            console.warn('[SDK] Firestore offline, usando REST API como fallback');
          } else {
            console.error(`[SDK] Error cargando ${collectionName}:`, err);
          }
        }
      }

      // ── Fallback: REST API ──
      console.info('[REST] Cargando usando REST API...');
      return loadFromCloudViaRest<T>(uid, collectionName);
    } finally {
      // Limpiar la caché una vez que la promesa se resuelva (éxito o error)
      pendingDocReads.delete(cacheKey);
    }
  })();

  // Guardar la promesa en la caché
  pendingDocReads.set(cacheKey, promise);

  return promise;
}

/**
 * Combina datos locales con los de la nube.
 * Estrategia: el que tenga el updatedAt más reciente gana.
 * @param local - Array de items locales
 * @param cloud - Datos de la nube (o null)
 * @param getCreatedAt - Función para extraer el timestamp createdAt de cada item
 */
export function mergeData<T>(
  local: T[],
  cloud: CloudData<T> | null,
  getCreatedAt: (item: T) => string
): { items: T[]; fromCloud: boolean } {
  if (!cloud || !cloud.items || cloud.items.length === 0) {
    return { items: local, fromCloud: false };
  }

  const localUpdatedAt = local.length > 0
    ? Math.max(...local.map(m => new Date(getCreatedAt(m)).getTime()))
    : 0;
  const cloudUpdatedAt = new Date(cloud.updatedAt).getTime();

  if (localUpdatedAt > cloudUpdatedAt) {
    return { items: local, fromCloud: false };
  }

  return { items: cloud.items, fromCloud: true };
}
