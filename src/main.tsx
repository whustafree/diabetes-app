import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';

// ─── Global handler: Firestore assertion errors ───
// El SDK de Firestore v11 tiene un bug conocido donde arroja
// "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)" en un bucle
// infinito. Este handler:
//   1. Marca Firestore como no disponible para que cloudSync use REST API
//   2. Suprime el error para que no se propague como unhandled rejection
//
// La combinación de ambos pasos rompe el bucle infinito: el SDK deja de
// recibir nuevas solicitudes (markFirestoreFailed) y el error no satura
// la consola (preventDefault).
import { markFirestoreFailed } from './firebase/config';

window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason;
  if (
    err &&
    typeof err.message === 'string' &&
    err.message.includes('INTERNAL ASSERTION FAILED')
  ) {
    // Marcar Firestore como no disponible para toda la app
    markFirestoreFailed();
    console.warn('[Firestore] Error interno de SDK suprimido. Usando REST API como fallback.');
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <ErrorBoundary>
 <AuthProvider>
 <App />
 </AuthProvider>
 </ErrorBoundary>
 </StrictMode>,
);
