// ─── Offline Change Queue ───
// Stores changes made while offline and syncs them when connection is restored.

const QUEUE_KEY = 'diabetes-app-offline-queue';

export interface QueueItem {
  id: string;
  type: 'glucose' | 'profile' | 'medication' | 'reminder' | 'foodlog';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  synced: boolean;
}

export function getOfflineQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToQueue(item: Omit<QueueItem, 'id' | 'timestamp' | 'synced'>): QueueItem[] {
  const queue = getOfflineQueue();
  const newItem: QueueItem = {
    ...item,
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    synced: false,
  };
  queue.push(newItem);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queue;
}

export function markAsSynced(id: string): QueueItem[] {
  const queue = getOfflineQueue().map(item =>
    item.id === id ? { ...item, synced: true } : item
  );
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queue;
}

export function clearSyncedItems(): QueueItem[] {
  const queue = getOfflineQueue().filter(item => !item.synced);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queue;
}

export function getPendingCount(): number {
  return getOfflineQueue().filter(item => !item.synced).length;
}

export function clearAllQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}
