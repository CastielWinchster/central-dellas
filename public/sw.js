// Service Worker da CentralDellas
const CACHE_NAME = 'centraldellas-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Recebe push do servidor e exibe na barra de notificação do dispositivo
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: 'CentralDellas', body: event.data?.text() ?? '' };
  }

  const title = data.title || 'CentralDellas 🚗';
  const options = {
    body: data.body || data.message || '',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'centraldellas-' + Date.now(),
    data: { url: data.url || '/' },
    vibrate: data.type === 'ride'
      ? [200, 100, 200, 100, 400]
      : data.type === 'message'
        ? [100, 50, 100]
        : [150, 100, 150],
    requireInteraction: data.type === 'ride',
    actions: data.type === 'ride'
      ? [{ action: 'open', title: 'Ver corrida' }]
      : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Ao clicar na notificação, abre/foca o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
