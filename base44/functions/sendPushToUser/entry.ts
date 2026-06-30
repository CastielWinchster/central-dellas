/*
  Variáveis de ambiente (Base44 > Secrets):
  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
  VITE_VAPID_PUBLIC_KEY (frontend build — mesma chave pública)
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';
import admin from 'npm:firebase-admin@12.0.0';

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_EMAIL = 'mailto:contato@centraldellas.com.br';

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

async function sendFcm(
  token: string,
  payload: { title: string; body: string; type: string; url: string; rideId: string | null },
) {
  if (!ensureFcm()) return false;
  await admin.messaging().send({
    token,
    notification: { title: payload.title, body: payload.body },
    data: {
      type: payload.type,
      url: payload.url,
      rideId: payload.rideId || '',
      title: payload.title,
      body: payload.body,
    },
    webpush: {
      fcmOptions: { link: payload.url },
    },
    android: { priority: 'high' },
  });
  return true;
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
    const subscription = parseSubscription(prefs[0]?.push_subscription);
    const fcmToken = prefs[0]?.fcm_token ? String(prefs[0].fcm_token) : null;
    const pushPayload = { title: title!, body: body!, type, url, rideId };

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
          persistent,
          tag,
        });

        await webpush.sendNotification(subscription, payload, {
          TTL: persistent ? 120 : 60,
          urgency: type === 'ride_offer' || persistent ? 'high' : 'normal',
        });

        console.log(`[sendPushToUser] Web Push enviado para ${userId}`);
        return Response.json({ success: true, method: 'webpush' });
      } catch (pushErr: unknown) {
        const statusCode = (pushErr as { statusCode?: number })?.statusCode;
        console.warn('[sendPushToUser] Web Push falhou:', (pushErr as Error)?.message, statusCode);

        if (statusCode === 404 || statusCode === 410) {
          await clearInvalidSubscription(base44, userId);
        }
      }
    } else if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      console.warn('[sendPushToUser] VAPID não configurado — tentando FCM ou in-app');
    }

    if (fcmToken) {
      try {
        const sent = await sendFcm(fcmToken, pushPayload);
        if (sent) {
          console.log(`[sendPushToUser] FCM enviado para ${userId}`);
          if (skipInApp || type === 'ride_offer') {
            return Response.json({ success: true, method: 'fcm' });
          }
        }
      } catch (fcmErr) {
        console.warn('[sendPushToUser] FCM falhou:', (fcmErr as Error).message);
        if (prefs[0]?.id && String((fcmErr as { code?: string }).code || '').includes('registration-token')) {
          await base44.asServiceRole.entities.UserPreferences.update(prefs[0].id, { fcm_token: null });
        }
      }
    }

    if (skipInApp || (type === 'ride_offer' && (subscription || fcmToken))) {
      return Response.json({ success: true, method: 'push_only' });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      title: title || 'Central Dellas',
      message: body || '',
      type: ['ride', 'message', 'coupon', 'event', 'system'].includes(type) ? type : 'system',
      is_read: false,
      is_persistent: persistent || type === 'ride_offer',
    });

    return Response.json({ success: true, method: 'in-app' });
  } catch (error) {
    console.error('[sendPushToUser]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
