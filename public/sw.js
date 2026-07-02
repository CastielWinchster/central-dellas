// Service Worker Central Dellas — push estilo Uber (app fechado + ações Aceitar/Recusar)
const SW_VERSION = 'centraldellas-v10';
const CACHE_NAME = SW_VERSION;
const RIDE_VIBRATE = [800, 200, 800, 200, 800, 200, 800, 200, 800];
const RIDE_ALERT_INTERVAL_MS = 8000;
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

function buildDriverUrl(data) {
  if (data.url) return data.url;
  const params = new URLSearchParams({ from: 'push' });
  if (data.rideId) params.set('rideId', data.rideId);
  if (data.offerId) params.set('offerId', data.offerId);
  return `/DriverDashboard?${params.toString()}`;
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
  const url = buildDriverUrl(data);
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
    data: { url, rideId, offerId: data.offerId || null, type: 'ride_offer' },
    actions: [
      { action: 'accept', title: '✅ Aceitar' },
      { action: 'reject', title: '❌ Recusar' },
    ],
  });
}

function notifyOpenClients(data) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'ride_offer_push',
        rideId: data.rideId,
        offerId: data.offerId,
        url: buildDriverUrl(data),
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
  }, RIDE_ALERT_INTERVAL_MS);
  activeRideAlerts.set(rideId, timer);
}

function openOrFocusClient(url, data) {
  const absolute = url.startsWith('http') ? url : `${self.location.origin}${url}`;
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({
        type: 'ride_offer_push',
        rideId: data?.rideId,
        offerId: data?.offerId,
        url,
      });
    });
    for (const client of clientList) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        if ('navigate' in client) {
          return client.navigate(absolute).then(() => client.focus());
        }
        return client.focus();
      }
    }
    return self.clients.openWindow(absolute);
  });
}

function handleRejectFromNotification(data) {
  stopRideAlert(data?.rideId);
  const params = new URLSearchParams({ from: 'push', autoReject: '1' });
  if (data?.rideId) params.set('rideId', data.rideId);
  if (data?.offerId) params.set('offerId', data.offerId);
  return openOrFocusClient(`/DriverDashboard?${params.toString()}`, data);
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
    event.waitUntil(Promise.resolve().then(() => stopRideAlert(data.rideId)));
    return;
  }

  if (data.type === 'ride_offer' || data.persistent) {
    event.waitUntil(
      Promise.all([startRideAlertLoop(data), notifyOpenClients(data)]),
    );
    return;
  }

  const title = data.title || 'Central Dellas 🚗';
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
      data: { url, type: data.type || 'default', rideId: data.rideId, offerId: data.offerId },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const action = event.action;

  if (data.rideId) stopRideAlert(data.rideId);

  if (action === 'reject') {
    event.waitUntil(handleRejectFromNotification(data));
    return;
  }

  const url = buildDriverUrl(data);
  event.waitUntil(openOrFocusClient(url, data));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'ride_offer_cancelled') {
    stopRideAlert(event.data.rideId);
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
