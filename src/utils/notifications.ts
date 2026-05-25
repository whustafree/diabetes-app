import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseApp, getFirestoreDB, isFirebaseConfigured } from '../firebase/config';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let messagingInstance: Messaging | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registra el service worker de FCM, pasando la config de Firebase por URL params.
 * Esto permite que el SW en /public/ acceda a las variables de entorno.
 */
async function registerSw(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistration) return swRegistration;
  try {
    // Pasar config de Firebase al SW via URL params
    const params = new URLSearchParams({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    });

    swRegistration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${params.toString()}`,
      { scope: '/' }
    );
    return swRegistration;
  } catch (err) {
    console.warn('[Notifications] Error registrando SW:', err);
    return null;
  }
}

/**
 * Solicita permiso de notificación y obtiene el token FCM.
 * @returns El token FCM o null si falla/no hay permiso.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  if (!('Notification' in window)) {
    console.warn('[Notifications] API de Notificaciones no soportada');
    return null;
  }

  // Verificar que FCM es soportado
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  // Solicitar permiso
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  try {
    // Asegurar que el SW esté registrado
    const registration = await registerSw();
    if (!registration) return null;

    const app = getFirebaseApp();
    const messaging = getMessaging(app);
    messagingInstance = messaging;

    // Obtener token con VAPID key
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (err) {
    console.warn('[Notifications] Error obteniendo token FCM:', err);
    return null;
  }
}

/**
 * Guarda el token FCM en Firestore para el usuario.
 */
export async function saveTokenToFirestore(uid: string, token: string): Promise<void> {
  try {
    const db = getFirestoreDB();
    await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
      token,
      platform: 'web',
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  } catch (err) {
    console.warn('[Notifications] Error guardando token en Firestore:', err);
  }
}

/**
 * Escucha mensajes entrantes mientras la app está en foreground.
 * @param callback Función que se llama con cada mensaje recibido.
 * @returns Función para desuscribirse.
 */
export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; data?: any }) => void
): () => void {
  if (!messagingInstance) {
    try {
      const app = getFirebaseApp();
      messagingInstance = getMessaging(app);
    } catch {
      return () => {};
    }
  }

  const unsubscribe = onMessage(messagingInstance, (payload) => {
    const notification = payload.notification || {};
    callback({
      title: notification.title,
      body: notification.body,
      data: payload.data,
    });
  });

  return unsubscribe;
}

/**
 * Inicializa las notificaciones push para el usuario autenticado.
 * Solicita permiso, registra el SW, obtiene token y lo guarda en Firestore.
 */
export async function initPushNotifications(uid: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  if (!VAPID_KEY) {
    console.info('[Notifications] VAPID key no configurada. Las notificaciones push requieren VITE_FIREBASE_VAPID_KEY en .env');
    return false;
  }

  try {
    const token = await requestNotificationPermission();
    if (token) {
      await saveTokenToFirestore(uid, token);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Notifications] Error en initPushNotifications:', err);
    return false;
  }
}
