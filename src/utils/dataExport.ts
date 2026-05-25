const STORAGE_KEYS = [
  'diabetes-app-entries',        // Glucosa
  'diabetes-app-profile',         // Perfil de usuario
  'diabetes-app-medications',     // Medicamentos
  'diabetes-app-reminders',       // Recordatorios
  'diabetes-app-theme',           // Tema (claro/oscuro)
  'diabetes-app-notifications',   // Notificaciones
  'diabetes-app-activity-log',    // Registro de actividad
  'diabetes-app-user-role',       // Rol de usuario
  'diabetes-app-role-changed',    // Último cambio de rol
  'diabetes-app-fcm-token',       // Token FCM
  'fcm-push-enabled',             // Push habilitado
  'diabetes-app-notif-preferences', // Preferencias de notificación
] as const;

export interface ExportData {
  version: string;
  exportedAt: string;
  userEmail: string | null;
  data: Record<string, unknown>;
}

export function collectAllData(userEmail?: string | null): ExportData {
  const data: Record<string, unknown> = {};

  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
    } catch {
      // skip keys that fail
    }
  }

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    userEmail: userEmail || null,
    data,
  };
}

export function downloadJson(data: ExportData, filename?: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `diabetes-control-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getExportStats(): { key: string; size: number }[] {
  return STORAGE_KEYS.map(key => {
    try {
      const raw = localStorage.getItem(key);
      return { key, size: raw ? new Blob([raw]).size : 0 };
    } catch {
      return { key, size: 0 };
    }
  }).filter(s => s.size > 0);
}
