import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { base44 } from '@/api/base44Client';
import { subscribeToPush } from '@/hooks/useNotifications';
import { firebaseConfig, FCM_VAPID_KEY } from '@/lib/firebaseConfig';
import { buildDriverOfferUrl } from '@/lib/pushDeepLink';

let foregroundHandlerRegistered = false;
let nativeListenersRegistered = false;

async function saveTokens({ subscription, fcmToken, platform }) {
  const payload = {};
  if (subscription) payload.subscription = subscription;
  if (fcmToken) payload.fcmToken = fcmToken;
  if (platform) payload.platform = platform;
  if (!payload.subscription && !payload.fcmToken) return { ok: false, reason: 'empty' };

  await base44.functions.invoke('savePushToken', payload);
  return { ok: true };
}

function dispatchRideOfferAlert(data = {}) {
  window.dispatchEvent(new CustomEvent('driver-ride-offer-alert', { detail: data }));
}

function navigateToOffer(data = {}) {
  const url = data.url || buildDriverOfferUrl({ rideId: data.rideId, offerId: data.offerId });
  if (window.location.pathname + window.location.search !== url) {
    window.location.href = url;
  } else {
    dispatchRideOfferAlert(data);
  }
}

async function rejectOfferFromPush(offerId) {
  if (!offerId) return;
  try {
    await base44.functions.invoke('respondRideOffer', { offerId, status: 'rejected' });
  } catch (e) {
    console.warn('[Push] Falha ao recusar oferta:', e.message);
  }
}

function registerForegroundHandler() {
  if (foregroundHandlerRegistered) return;
  foregroundHandlerRegistered = true;

  isSupported().then((supported) => {
    if (!supported) return;
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      const data = payload.data || {};
      const title = payload.notification?.title || data.title || 'Central Dellas';
      const body = payload.notification?.body || data.body || '';

      if (data.type === 'ride_offer') {
        dispatchRideOfferAlert(data);
        if (Notification.permission === 'granted') {
          const tag = data.rideId ? `ride-offer-${data.rideId}` : `fcm-${Date.now()}`;
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag,
            requireInteraction: true,
            data,
          });
        }
        return;
      }

      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: data.tag || `fcm-${Date.now()}`,
        });
      }
    });
  }).catch(() => {});
}

function registerNativePushListeners() {
  if (nativeListenersRegistered || !Capacitor.isNativePlatform()) return;
  nativeListenersRegistered = true;

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    const data = notification.data || {};
    if (data.type === 'ride_offer') {
      dispatchRideOfferAlert(data);
    }
  });

  PushNotifications.addListener('pushNotificationActionPerformed', async (event) => {
    const data = event.notification?.data || {};
    if (data.type !== 'ride_offer') return;

    if (event.actionId === 'reject') {
      await rejectOfferFromPush(data.offerId);
      return;
    }

    navigateToOffer(data);
  });
}

/** FCM Web — token via service worker existente (/sw.js) */
export async function registerFcmWebPush() {
  try {
    if (!FCM_VAPID_KEY) {
      return { ok: false, reason: 'no_vapid' };
    }
    if (!(await isSupported())) {
      return { ok: false, reason: 'unsupported' };
    }
    if (!('serviceWorker' in navigator)) {
      return { ok: false, reason: 'no_sw' };
    }

    const registration = await navigator.serviceWorker.ready;
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return { ok: false, reason: 'no_token' };

    await saveTokens({ fcmToken: token, platform: 'web' });
    registerForegroundHandler();
    console.log('[FCM] Token web salvo');
    return { ok: true };
  } catch (err) {
    console.warn('[FCM] Falha web:', err.message);
    return { ok: false, reason: err.message };
  }
}

/** FCM nativo — Capacitor Android/iOS */
export async function registerNativeFcmPush() {
  try {
    if (!Capacitor.isNativePlatform()) {
      return { ok: false, reason: 'not_native' };
    }

    registerNativePushListeners();

    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      return { ok: false, reason: 'denied' };
    }

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', async (token) => {
        try {
          await saveTokens({
            fcmToken: token.value,
            platform: Capacitor.getPlatform(),
          });
          console.log('[FCM] Token nativo salvo');
          resolve({ ok: true });
        } catch (e) {
          console.warn('[FCM] Falha ao salvar token nativo:', e.message);
          resolve({ ok: false, reason: e.message });
        }
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.warn('[FCM] registrationError:', err);
        resolve({ ok: false, reason: 'registration_error' });
      });

      PushNotifications.register();
    });
  } catch (err) {
    console.warn('[FCM] Falha nativo:', err.message);
    return { ok: false, reason: err.message };
  }
}

/** Registra todos os canais disponíveis (VAPID + FCM web + nativo) */
export async function registerAllPushChannels({ requestPermission = false } = {}) {
  const results = {
    vapid: { ok: false, reason: 'skipped' },
    fcmWeb: { ok: false, reason: 'skipped' },
    fcmNative: { ok: false, reason: 'skipped' },
  };

  results.vapid = await subscribeToPush({ requestPermission });
  if (Capacitor.isNativePlatform()) {
    results.fcmNative = await registerNativeFcmPush();
  } else {
    results.fcmWeb = await registerFcmWebPush();
  }

  const anyOk = results.vapid.ok || results.fcmWeb.ok || results.fcmNative.ok;
  return { ok: anyOk, ...results };
}

/** Trata deep link / recusa automática ao abrir app via notificação */
export async function handlePushDeepLinkOnLaunch() {
  const params = new URLSearchParams(window.location.search);
  const autoReject = params.get('autoReject') === '1';
  const offerId = params.get('offerId') || params.get('offer_id');
  const rideId = params.get('rideId') || params.get('ride_id');

  if (autoReject && offerId) {
    await rejectOfferFromPush(offerId);
    params.delete('autoReject');
    params.delete('offerId');
    params.delete('offer_id');
    const qs = params.toString();
    window.history.replaceState({}, document.title, `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    return { handled: true, action: 'reject', offerId, rideId };
  }

  if (rideId || offerId) {
    dispatchRideOfferAlert({ rideId, offerId });
    return { handled: true, action: 'open', offerId, rideId };
  }

  return { handled: false };
}
