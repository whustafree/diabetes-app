/**
 * Sistema de programación de notificaciones locales y enlace a Firestore
 * para potenciales notificaciones push desde servidor (Firebase Functions).
 *
 * ## Para notificaciones push desde servidor:
 * Una Firebase Function puede leer la subcolección
 *   users/{uid}/scheduledNotifications/{id}
 * y enviar notificaciones FCM a los tokens guardados en
 *   users/{uid}/fcmTokens/{token}
 */

// ─── Tipos ───

export interface ScheduledNotification {
  id: string;
  type: 'glucose' | 'medication' | 'meal' | 'exercise' | 'water' | 'custom';
  title: string;
  body?: string;
  /** Formato HH:mm */
  time: string;
  /** Días de la semana: 0=Dom, 1=Lun ... 6=Sáb */
  days: number[];
  /** Última vez que se disparó (para evitar duplicados) */
  lastFiredDate?: string; // ISO date string YYYY-MM-DD
  enabled: boolean;
  /** Enlace a un recordatorios/medicación existente */
  sourceId?: string;
  /** Para sincronizar con Firestore */
  synced?: boolean;
}

const STORAGE_KEY = 'diabetes-app-scheduled-notifications';

// ─── Persistencia local ───

export function loadScheduledNotifications(): ScheduledNotification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveScheduledNotifications(items: ScheduledNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addScheduledNotification(notif: ScheduledNotification) {
  const items = loadScheduledNotifications();
  items.push(notif);
  saveScheduledNotifications(items);
}

export function removeScheduledNotification(id: string) {
  const items = loadScheduledNotifications().filter(n => n.id !== id);
  saveScheduledNotifications(items);
}

export function clearScheduledNotifications() {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Verificador ───

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Inicia el scheduler que revisa cada 30s si hay notificaciones pendientes.
 * @returns Función para detener el scheduler.
 */
export function initNotificationScheduler(): () => void {
  if (intervalId) return () => {};

  const check = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay();
    const todayStr = now.toISOString().split('T')[0];

    const items = loadScheduledNotifications();
    let changed = false;

    for (const item of items) {
      if (!item.enabled) continue;
      if (!item.days.includes(currentDay)) continue;
      if (item.time !== currentTime) continue;
      if (item.lastFiredDate === todayStr) continue; // ya se disparó hoy

      // Disparar notificación
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(item.title, {
          body: item.body || 'Recordatorio de Diabetes Control',
          icon: '/vite.svg',
          tag: `scheduled-${item.id}`,
        });
      }

      item.lastFiredDate = todayStr;
      changed = true;
    }

    if (changed) saveScheduledNotifications(items);
  };

  // Primera ejecución inmediata
  check();
  intervalId = setInterval(check, 30000);

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

// ─── Firestore structure (para uso futuro con Firebase Functions) ───

/**
 * Estructura de documento para Firestore.
 * Una Firebase Function leería documentos con esta forma:
 *
 * Colección: users/{uid}/scheduledNotifications/{docId}
 * {
 *   type: "medication",
 *   title: "Tomar metformina",
 *   body: "500 mg después del desayuno",
 *   time: "08:30",
 *   days: [1, 2, 3, 4, 5],
 *   timezone: "America/Mexico_City",
 *   enabled: true,
 *   createdAt: "2025-01-01T00:00:00.000Z",
 *   sourceId: "med-123"
 * }
 *
 * La Function usaría admin.messaging().sendEachForMulticast()
 * contra los tokens en users/{uid}/fcmTokens/{token}.
 */
