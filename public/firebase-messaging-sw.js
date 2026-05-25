// Firebase Cloud Messaging Service Worker
// Recibe notificaciones push cuando la app está en segundo plano

// Parsear config desde URL params (pasados desde registerSw en notifications.ts)
const urlParams = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

// Solo inicializar si hay apiKey (Firebase configurado)
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'null') {
  importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  // Manejar mensajes en background
  messaging.onBackgroundMessage((payload) => {
    const { notification, data } = payload;

    if (notification) {
      const title = notification.title || 'Diabetes Control';
      const options = {
        body: notification.body || '',
        icon: '/vite.svg',
        badge: '/vite.svg',
        vibrate: [200, 100, 200],
        ...(notification.image ? { image: notification.image } : {}),
        data: data || {},
      };

      self.registration.showNotification(title, options);
    }
  });

  // Manejar clic en notificación
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    // Abrir o enfocar la app
    const urlToOpen = new URL('/', self.location.origin);
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of windowClients) {
          if (client.url === urlToOpen.href && 'focus' in client) {
            return client.focus();
          }
        }
        // Sino, abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen.href);
        }
      })
    );
  });
}
