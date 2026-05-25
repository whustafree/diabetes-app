const STORAGE_KEY = 'diabetes-app-notif-preferences';

export type NotifType = 'glucose' | 'medication' | 'meal' | 'exercise' | 'water' | 'custom';

export const NOTIF_TYPES: { key: NotifType; icon: string; label: string; description: string }[] = [
  { key: 'glucose', icon: '🩸', label: 'Glucosa', description: 'Recordatorios para medir glucosa' },
  { key: 'medication', icon: '💊', label: 'Medicación', description: 'Alertas de medicamentos y dosis' },
  { key: 'meal', icon: '🍽️', label: 'Comidas', description: 'Recordatorios de comidas y planes de dieta' },
  { key: 'exercise', icon: '🏃', label: 'Ejercicio', description: 'Recordatorios de actividad física' },
  { key: 'water', icon: '💧', label: 'Agua', description: 'Recordatorios para tomar agua' },
  { key: 'custom', icon: '⏰', label: 'Personalizado', description: 'Recordatorios personalizados' },
];

function getDefaults(): Record<NotifType, boolean> {
  return {
    glucose: true,
    medication: true,
    meal: true,
    exercise: true,
    water: true,
    custom: true,
  };
}

function loadPreferences(): Record<NotifType, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to handle new types
      return { ...getDefaults(), ...parsed };
    }
  } catch {}
  return getDefaults();
}

function savePreferences(prefs: Record<NotifType, boolean>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function getNotifPreferences(): Record<NotifType, boolean> {
  return loadPreferences();
}

export function setNotifPreference(type: NotifType, enabled: boolean): void {
  const prefs = loadPreferences();
  prefs[type] = enabled;
  savePreferences(prefs);
}

export function setAllNotifPreferences(enabled: boolean): void {
  const prefs = getDefaults();
  if (!enabled) {
    for (const key of Object.keys(prefs) as NotifType[]) {
      prefs[key] = false;
    }
  }
  savePreferences(prefs);
}

export function isNotifTypeEnabled(type?: string): boolean {
  if (!type) return true;
  const prefs = loadPreferences();
  return prefs[type as NotifType] ?? true;
}
