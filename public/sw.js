// Service Worker da CentralDellas — versão visível no DevTools > Application > Service Workers
const SW_VERSION = 'centraldellas-v9';
const CACHE_NAME = SW_VERSION;
const RIDE_VIBRATE = [800, 200, 800, 200, 800, 200, 800, 200, 800];
const activeRideAlerts = new Map();

function parsePushData(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    try {
      return JSON.parse(event.data.text());
    } catch {
      return { body: event.data.text() };
    }
  }
}

function stopRideAlert(rideId) {
  if (!rideId) return;
  const timer = activeRideAlerts.get(rideId);
  if (timer) {
    clearInterval(timer);
    activeRideAlerts.delete(rideId);
  }
  self.registration.getNotifications({ tag: `ride-offer-${rideId}` }).then((notifs) => {
    notifs.forEach((n) => n.close());
  });
}

function showRideOfferNotification(data) {
  const rideId = data.rideId;
  const title = data.title || '🚗 Nova corrida disponível!';
  const body = data.body || 'Toque para aceitar agora!';
  const url = data.url || '/DriverDashboard';
  const tag = data.tag || (rideId ? `ride-offer-${rideId}` : `ride-offer-${Date.now()}`);

  return self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag,
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: RIDE_VIBRATE,
    data: { url, rideId, type: 'ride_offer' },
    actions: [{ action: 'open', title: 'Ver corrida' }],
  });
}

function notifyOpenClients(data) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'ride_offer_push',
        rideId: data.rideId,
        url: data.url || '/DriverDashboard',
      });
    });
  });
}

function startRideAlertLoop(data) {
  const rideId = data.rideId;
  if (!rideId) {
    return showRideOfferNotification(data);
  }

  stopRideAlert(rideId);
  showRideOfferNotification(data);

  const timer = setInterval(() => {
    showRideOfferNotification(data);
  }, 12000);
  activeRideAlerts.set(rideId, timer);
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('push', (event) => {
  const data = parsePushData(event);

  if (data.type === 'ride_offer_cancelled') {
    event.waitUntil(
      Promise.resolve().then(() => stopRideAlert(data.rideId))
    );
    return;
  }

  if (data.type === 'ride_offer' || data.persistent) {
    event.waitUntil(
      Promise.all([startRideAlertLoop(data), notifyOpenClients(data)]),
    );
    return;
  }

  const title = data.title || 'CentralDellas 🚗';
  const body = data.body || data.message || '';
  const url = data.url || '/';
  const vibrate = data.type === 'ride' ? RIDE_VIBRATE : [200, 100, 200];

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || `cd-${data.type || 'default'}-${Date.now()}`,
      renotify: true,
      requireInteraction: data.type === 'ride',
      vibrate,
      data: { url, type: data.type || 'default' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rideId = event.notification.data?.rideId;
  if (rideId) stopRideAlert(rideId);

  const url = event.notification.data?.url || '/DriverDashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({ type: 'ride_offer_push', rideId, url });
      });
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'ride_offer_cancelled') {
    stopRideAlert(event.data.rideId);
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
