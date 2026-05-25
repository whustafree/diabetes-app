import { doc, getDoc, setDoc, enableNetwork } from 'firebase/firestore';
import { getFirestoreDB } from '../firebase/config';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Intenta habilitar la red de Firestore y espera hasta 5s a que esté disponible.
 * Esto soluciona el error "Failed to get document because the client is offline".
 */
async function ensureNetwork(db: ReturnType<typeof getFirestoreDB>): Promise<void> {
  try {
    await enableNetwork(db);
  } catch {
    // enableNetwork puede fallar si ya está online; lo ignoramos
  }
}

export interface CloudData<T> {
  items: T[];
  updatedAt: string;
}

/**
 * Guarda datos genéricos en Firestore como un solo documento.
 * @param uid - ID del usuario
 * @param collectionName - Nombre de la subcolección (e.g., 'medications', 'reminders')
 * @param items - Array de items a guardar
 */
export async function saveToCloud<T>(
  uid: string,
  collectionName: string,
  items: T[]
): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const db = getFirestoreDB();
      await ensureNetwork(db);
      const ref = doc(db, 'users', uid, collectionName, 'all');
      await setDoc(ref, {
        items: JSON.parse(JSON.stringify(items)),
        updatedAt: new Date().toISOString(),
      } satisfies CloudData<T>);
      return true;
    } catch (err: any) {
      const isOffline = err?.message?.includes?.('client is offline') || err?.message?.includes?.('offline');
      if (isOffline && attempt < MAX_RETRIES) {
        console.warn(`Intento ${attempt}/${MAX_RETRIES} — Firestore offline, reintentando en ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
        continue;
      }
      console.error(`Error guardando ${collectionName} en la nube:`, err);
      return false;
    }
  }
  return false;
}

/**
 * Carga datos genéricos desde Firestore.
 * @param uid - ID del usuario
 * @param collectionName - Nombre de la subcolección
 * @returns Los datos o null si no existen
 */
export async function loadFromCloud<T>(
  uid: string,
  collectionName: string
): Promise<CloudData<T> | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const db = getFirestoreDB();
      await ensureNetwork(db);
      const ref = doc(db, 'users', uid, collectionName, 'all');
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      return snapshot.data() as CloudData<T>;
    } catch (err: any) {
      const isOffline = err?.message?.includes?.('client is offline') || err?.message?.includes?.('offline');
      if (isOffline && attempt < MAX_RETRIES) {
        console.warn(`Intento ${attempt}/${MAX_RETRIES} — Firestore offline, reintentando en ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
        continue;
      }
      // Si no es offline o ya no hay más reintentos, propagar el error
      throw err;
    }
  }
  return null;
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
