const STORAGE_KEY = 'diabetes-app-activity-log';
const MAX_ENTRIES = 50;

export interface ActivityEntry {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'profile_update' | 'account_delete' | 'settings_change' | 'register';
  label: string;
  detail?: string;
  timestamp: string; // ISO string
}

export function getActivityLog(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addActivity(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): void {
  const log = getActivityLog();
  log.unshift({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(0, MAX_ENTRIES)));
}

export function clearActivityLog(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getActivityCounts(): Record<string, number> {
  const log = getActivityLog();
  const counts: Record<string, number> = {};
  for (const entry of log) {
    counts[entry.type] = (counts[entry.type] || 0) + 1;
  }
  return counts;
}

export function getRecentActivity(days: number = 7): ActivityEntry[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return getActivityLog().filter(e => new Date(e.timestamp).getTime() > cutoff);
}
