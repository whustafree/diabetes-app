import type { Reminder } from '../types';
import { saveToCloud, loadFromCloud, mergeData } from './cloudSync';

const COLLECTION = 'reminders';

export async function saveRemindersToCloud(
  uid: string,
  reminders: Reminder[]
): Promise<boolean> {
  return saveToCloud(uid, COLLECTION, reminders);
}

export async function loadRemindersFromCloud(uid: string): Promise<{ items: Reminder[]; updatedAt: string } | null> {
  return loadFromCloud<Reminder>(uid, COLLECTION);
}

export function mergeReminders(
  local: Reminder[],
  cloud: { items: Reminder[]; updatedAt: string } | null
): { reminders: Reminder[]; fromCloud: boolean } {
  const { items, fromCloud } = mergeData(local, cloud, r => r.createdAt);
  return { reminders: items, fromCloud };
}
