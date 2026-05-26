import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Flag para detectar si el SDK de Firestore falló internamente
// (ej: error FIRESTORE INTERNAL ASSERTION FAILED). Cuando esto ocurre,
// toda la app debe usar REST API como fallback.
let firestoreFailed = false;

/**
 * Marca Firestore como no disponible. Todas las llamadas al SDK
 * deben redirigirse a REST API.
 */
export function markFirestoreFailed(): void {
  firestoreFailed = true;
}

/**
 * Verifica si el SDK de Firestore está disponible para usar.
 * Si retorna false, usar REST API como único mecanismo de sync.
 */
export function isFirestoreAvailable(): boolean {
  return !firestoreFailed;
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirestoreDB(): Firestore {
  if (!db && !firestoreFailed) {
    try {
      // Usamos HTTP long polling en lugar de WebSockets para evitar
      // el error "Failed to get document because the client is offline"
      // que ocurre cuando firewalls o proxies bloquean WebSockets.
      db = initializeFirestore(getFirebaseApp(), {
        experimentalForceLongPolling: true,
      });
    } catch (err) {
      console.error('[Firestore] Error al inicializar Firestore SDK:', err);
      firestoreFailed = true;
    }
  }
  // Si firestoreFailed, lanzar error claro para que los callers
  // (AuthContext, etc.) atrapen correctamente en sus try-catch
  if (firestoreFailed) {
    throw new Error('Firestore SDK no disponible (error interno de aserción). Usando REST API como fallback.');
  }
  return db!;
}

// Verificar si Firebase está configurado (no valores vacíos)
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'tu-api-key' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'tu-proyecto'
  );
}
