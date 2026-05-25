import type { UserProfile } from '../types';
import { saveToCloud, loadFromCloud } from './cloudSync';

const COLLECTION = 'profile';

export async function saveProfileToCloud(
  uid: string,
  profile: UserProfile
): Promise<boolean> {
  return saveToCloud(uid, COLLECTION, [profile]);
}

export async function loadProfileFromCloud(uid: string): Promise<UserProfile | null> {
  const data = await loadFromCloud<UserProfile>(uid, COLLECTION);
  if (!data || !data.items || data.items.length === 0) return null;
  return data.items[0];
}
