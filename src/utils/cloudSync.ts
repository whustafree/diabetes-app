import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirestoreDB } from '../firebase/config';

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
  try {
    const db = getFirestoreDB();
    const ref = doc(db, 'users', uid, collectionName, 'all');
    await setDoc(ref, {
      items: JSON.parse(JSON.stringify(items)),
      updatedAt: new Date().toISOString(),
    } satisfies CloudData<T>);
    return true;
  } catch (err) {
    console.error(`Error guardando ${collectionName} en la nube:`, err);
    return false;
  }
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
  const db = getFirestoreDB();
  const ref = doc(db, 'users', uid, collectionName, 'all');
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return snapshot.data() as CloudData<T>;
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
