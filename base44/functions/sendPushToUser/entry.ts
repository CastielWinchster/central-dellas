/*
  Variáveis de ambiente (Base44 > Secrets):
  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
  VITE_VAPID_PUBLIC_KEY (frontend build — mesma chave pública)
  FIREBASE_SERVICE_ACCOUNT_JSON (FCM web/nativo)
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';
import admin from 'npm:firebase-admin@12.0.0';

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_EMAIL = 'mailto:contato@centraldellas.com.br';
const SITE_ORIGIN = 'https://centraldellas.base44.app';

let vapidConfigured = false;
let fcmInitialized = false;

function ensureVapid() {
  if (vapidConfigured || !VAPID_PUBLIC || !VAPID_PRIVATE) return;
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
  vapidConfigured = true;
}

function ensureFcm() {
  if (fcmInitialized) return true;
  try {
    const json = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!json) return false;
    if (admin.apps.length === 0) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
    }
    fcmInitialized = true;
    return true;
  } catch (e) {
    console.warn('[sendPushToUser] FCM init falhou:', (e as Error).message);
    return false;
  }
}

type PushPayload = {
  title: string;
  body: string;
  type: string;
  url: string;
  rideId: string | null;
  offerId: string | null;
  persistent: boolean;
};

function absoluteUrl(url: string) {
  if (url.startsWith('http')) return url;
  return `${SITE_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
}

function buildFcmData(payload: PushPayload): Record<string, string> {
  return {
    type: payload.type,
    url: payload.url,
    rideId: payload.rideId || '',
    offerId: payload.offerId || '',
    title: payload.title,
    body: payload.body,
    persistent: payload.persistent ? 'true' : 'false',
    tag: payload.rideId ? `ride-offer-${payload.rideId}` : `cd-${payload.type}`,
  };
}

/** FCM para tokens web (TWA / PWA / browser) — data-only para o SW exibir */
async function sendFcmWeb(token: string, payload: PushPayload) {
  if (!ensureFcm()) return false;

  const data = buildFcmData(payload);
  const isRideOffer = payload.type === 'ride_offer';

  await admin.messaging().send({
    token,
    data,
    webpush: {
      headers: {
        Urgency: isRideOffer ? 'high' : 'normal',
        TTL: isRideOffer ? '120' : '60',
      },
      fcmOptions: { link: absoluteUrl(payload.url) },
    },
  });
  return true;
}

/** FCM para tokens nativos Capacitor Android/iOS */
async function sendFcmNative(token: string, payload: PushPayload) {
  if (!ensureFcm()) return false;

  const data = buildFcmData(payload);
  const isRideOffer = payload.type === 'ride_offer';

  await admin.messaging().send({
    token,
    notification: { title: payload.title, body: payload.body },
    data,
    android: {
      priority: 'high',
      ttl: 120000,
      notification: isRideOffer ? {
        title: payload.title,
        body: payload.body,
        channelId: 'ride_requests',
        priority: 'max' as const,
        defaultSound: true,
        defaultVibrateTimings: true,
        visibility: 'public' as const,
        tag: data.tag,
      } : undefined,
    },
    apns: {
      headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
      payload: {
        aps: {
          alert: { title: payload.title, body: payload.body },
          sound: 'default',
          'content-available': 1,
        },
      },
    },
  });
  return true;
}

async function sendFcm(token: string, payload: PushPayload, platform?: string | null) {
  const p = String(platform || 'web').toLowerCase();
  if (p === 'android' || p === 'ios') {
    return sendFcmNative(token, payload);
  }
  return sendFcmWeb(token, payload);
}

function parseSubscription(raw: unknown) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

async function clearInvalidSubscription(
  base44: ReturnType<typeof createClientFromRequest>,
  userId: string,
) {
  const prefs = await base44.asServiceRole.entities.UserPreferences.filter({ user_id: userId });
  if (prefs[0]?.id) {
    await base44.asServiceRole.entities.UserPreferences.update(prefs[0].id, {
      push_subscription: null,
      push_enabled: false,
    });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let userId: string | undefined;
    let title: string | undefined;
    let body: string | undefined;
    let type = 'default';
    let url = '/DriverDashboard';
    let rideId: string | null = null;
    let offerId: string | null = null;
    let persistent = false;
    let skipInApp = false;

    try {
      const b = await req.json();
      userId = b.userId || b.toUserId;
      title = b.title;
      body = b.body;
      type = b.type ?? 'default';
      url = b.url ?? '/DriverDashboard';
      rideId = b.rideId ?? null;
      offerId = b.offerId ?? null;
      persistent = b.persistent ?? false;
      skipInApp = b.skipInApp ?? false;
    } catch {
      return Response.json({ error: 'JSON inválido' }, { status: 400 });
    }

    if (!userId) {
      return Response.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    if (type !== 'ride_offer_cancelled' && (!title || !body)) {
      return Response.json({ error: 'title e body são obrigatórios' }, { status: 400 });
    }

    const prefs = await base44.asServiceRole.entities.UserPreferences.filter({ user_id: userId });
    const pref = prefs[0] || null;
    const subscription = parseSubscription(pref?.push_subscription);
    const fcmToken = pref?.fcm_token ? String(pref.fcm_token) : null;
    const pushPlatform = pref?.push_platform ? String(pref.push_platform) : 'web';

    const pushPayload: PushPayload = {
      title: title!,
      body: body!,
      type,
      url,
      rideId,
      offerId,
      persistent,
    };

    let pushDelivered = false;
    let method = 'none';
    const errors: string[] = [];

    if (subscription && VAPID_PUBLIC && VAPID_PRIVATE) {
      try {
        ensureVapid();
        const tag = rideId ? `ride-offer-${rideId}` : `cd-${type}-${Date.now()}`;
        const payload = JSON.stringify({
          title,
          body,
          type,
          url,
          rideId,
          offerId,
          persistent,
          tag,
        });

        await webpush.sendNotification(subscription, payload, {
          TTL: persistent ? 120 : 60,
          urgency: type === 'ride_offer' || persistent ? 'high' : 'normal',
        });

        pushDelivered = true;
        method = 'webpush';
        console.log(`[sendPushToUser] Web Push OK → ${userId}`);
      } catch (pushErr: unknown) {
        const statusCode = (pushErr as { statusCode?: number })?.statusCode;
        errors.push(`webpush:${(pushErr as Error)?.message}`);
        console.warn('[sendPushToUser] Web Push falhou:', (pushErr as Error)?.message, statusCode);

        if (statusCode === 404 || statusCode === 410) {
          await clearInvalidSubscription(base44, userId);
        }
      }
    } else if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      errors.push('vapid_not_configured');
    }

    if (!pushDelivered && fcmToken) {
      try {
        const sent = await sendFcm(fcmToken, pushPayload, pushPlatform);
        if (sent) {
          pushDelivered = true;
          method = `fcm_${pushPlatform}`;
          console.log(`[sendPushToUser] FCM OK (${pushPlatform}) → ${userId}`);
        }
      } catch (fcmErr) {
        errors.push(`fcm:${(fcmErr as Error).message}`);
        console.warn('[sendPushToUser] FCM falhou:', (fcmErr as Error).message);
        if (pref?.id && String((fcmErr as { code?: string }).code || '').includes('registration-token')) {
          await base44.asServiceRole.entities.UserPreferences.update(String(pref.id), { fcm_token: null });
        }
      }
    }

    if (pushDelivered) {
      return Response.json({ success: true, method });
    }

    if (type === 'ride_offer') {
      await base44.asServiceRole.entities.Notification.create({
        user_id: userId,
        title: title || 'Nova corrida disponível!',
        message: body || '',
        type: 'ride',
        is_read: false,
        is_persistent: true,
      });
      return Response.json({
        success: true,
        method: 'in-app_fallback',
        pushDelivered: false,
        details: errors,
      });
    }

    if (skipInApp) {
      return Response.json({
        success: false,
        method: 'none',
        error: 'push_delivery_failed',
        details: errors,
        hasSubscription: !!subscription,
        hasFcmToken: !!fcmToken,
        vapidConfigured: !!(VAPID_PUBLIC && VAPID_PRIVATE),
        fcmConfigured: ensureFcm(),
      }, { status: 502 });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      title: title || 'Central Dellas',
      message: body || '',
      type: ['ride', 'message', 'coupon', 'event', 'system'].includes(type) ? type : 'system',
      is_read: false,
      is_persistent: persistent || type === 'ride_offer',
    });

    return Response.json({ success: true, method: 'in-app', pushDelivered: false, details: errors });
  } catch (error) {
    console.error('[sendPushToUser]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
