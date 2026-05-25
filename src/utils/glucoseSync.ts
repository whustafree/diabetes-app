import type { GlucoseEntry } from '../types';
import { saveToCloud, loadFromCloud, mergeData } from './cloudSync';

const COLLECTION = 'glucose';

export async function saveGlucoseToCloud(
  uid: string,
  entries: GlucoseEntry[]
): Promise<boolean> {
  return saveToCloud(uid, COLLECTION, entries);
}

export async function loadGlucoseFromCloud(uid: string): Promise<{ items: GlucoseEntry[]; updatedAt: string } | null> {
  return loadFromCloud<GlucoseEntry>(uid, COLLECTION);
}

export function mergeGlucose(
  local: GlucoseEntry[],
  cloud: { items: GlucoseEntry[]; updatedAt: string } | null
): { entries: GlucoseEntry[]; fromCloud: boolean } {
  const { items, fromCloud } = mergeData(local, cloud, e => e.createdAt);
  return { entries: items, fromCloud };
}
