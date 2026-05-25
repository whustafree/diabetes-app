import type { GlucoseEntry, DailyStats } from '../types';

const STORAGE_KEY = 'diabetes-app-entries';

export function loadEntries(): GlucoseEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: GlucoseEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(entry: GlucoseEntry): GlucoseEntry[] {
  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);
  return entries;
}

export function deleteEntry(id: string): GlucoseEntry[] {
  const entries = loadEntries().filter(e => e.id !== id);
  saveEntries(entries);
  return entries;
}

export function getDailyStats(entries: GlucoseEntry[]): DailyStats {
  if (entries.length === 0) {
    return { date: new Date().toISOString().split('T')[0], average: 0, min: 0, max: 0, entries: 0 };
  }

  const values = entries.map(e => e.value);
  return {
    date: new Date().toISOString().split('T')[0],
    average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
    entries: entries.length,
  };
}

export function getLast7DaysEntries(entries: GlucoseEntry[]): GlucoseEntry[] {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return entries.filter(e => new Date(e.date) >= weekAgo);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getGlucoseStatus(value: number): { label: string; color: string; emoji: string } {
  if (value < 70) return { label: 'Bajo', color: 'text-blue-500', emoji: '⚠️' };
  if (value <= 100) return { label: 'Normal', color: 'text-green-500', emoji: '✅' };
  if (value <= 140) return { label: 'Elevado', color: 'text-yellow-500', emoji: '📈' };
  if (value <= 200) return { label: 'Alto', color: 'text-orange-500', emoji: '🔴' };
  return { label: 'Peligroso', color: 'text-red-600', emoji: '🚨' };
}
