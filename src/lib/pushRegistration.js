import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { base44 } from '@/api/base44Client';
import { subscribeToPush } from '@/hooks/useNotifications';
import { firebaseConfig, FCM_VAPID_KEY } from '@/lib/firebaseConfig';

let foregroundHandlerRegistered = false;

async function saveTokens({ subscription, fcmToken, platform }) {
  const payload = {};
  if (subscription) payload.subscription = subscription;
  if (fcmToken) payload.fcmToken = fcmToken;
  if (platform) payload.platform = platform;
  if (!payload.subscription && !payload.fcmToken) return { ok: false, reason: 'empty' };

  await base44.functions.invoke('savePushToken', payload);
  return { ok: true };
}

function registerForegroundHandler() {
  if (foregroundHandlerRegistered) return;
  foregroundHandlerRegistered = true;

  isSupported().then((supported) => {
    if (!supported) return;
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'Central Dellas';
      const body = payload.notification?.body || '';
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: payload.data?.tag || `fcm-${Date.now()}`,
        });
      }
      if (payload.data?.type === 'ride_offer') {
        window.dispatchEvent(new CustomEvent('driver-ride-offer-alert'));
      }
    });
  }).catch(() => {});
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
