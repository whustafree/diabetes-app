import type { Medication } from '../types';
import { saveToCloud, loadFromCloud, mergeData } from './cloudSync';

const COLLECTION = 'medications';

export async function saveMedicationsToCloud(
  uid: string,
  medications: Medication[]
): Promise<boolean> {
  return saveToCloud(uid, COLLECTION, medications);
}

export async function loadMedicationsFromCloud(uid: string): Promise<{ items: Medication[]; updatedAt: string } | null> {
  return loadFromCloud<Medication>(uid, COLLECTION);
}

export function mergeMedications(
  local: Medication[],
  cloud: { items: Medication[]; updatedAt: string } | null
): { medications: Medication[]; fromCloud: boolean } {
  const { items, fromCloud } = mergeData(local, cloud, m => m.createdAt);
  return { medications: items, fromCloud };
}
