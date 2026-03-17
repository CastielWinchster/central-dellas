import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import admin from 'npm:firebase-admin@12.0.0';

let adminInitialized = false;

function initFirebase() {
  if (adminInitialized || admin.apps.length > 0) {
    adminInitialized = true;
    return;
  }
  try {
    const json = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!json) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não definido');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
    adminInitialized = true;
    console.log('Firebase Admin inicializado');
  } catch (e) {
    console.error('Erro ao inicializar Firebase Admin:', e.message);
  }
}

/**
 * Envia push FCM para um usuário via token salvo no Firestore
 */
async function sendPush(userId, title, body, data = {}) {
  if (!adminInitialized) return { sent: false, reason: 'firebase_not_initialized' };

  try {
    const db = admin.firestore();
    const snap = await db.collection('user_devices').where('userId', '==', userId).get();

    if (snap.empty) return { sent: false, reason: 'no_token' };

    const token = snap.docs[0].data().token;
    if (!token) return { sent: false, reason: 'empty_token' };

    const message = {
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      webpush: {
        notification: { icon: '/icon-192.png', badge: '/icon-192.png' },
        fcm_options: { link: data.link || '/' }
      }
    };

    const result = await admin.messaging().send(message);
    console.log('Push enviado:', result);
    return { sent: true, messageId: result };
  } catch (e) {
    console.error('Erro ao enviar push:', e.message);
    return { sent: false, error: e.message };
  }
}

/**
 * Handler principal: salva no inbox (Notification entity) + envia push
 * Pode ser chamado via automação (entity event) ou diretamente
 *
 * Payload quando chamado diretamente:
 *   { userId, title, message, type, rideId, link }
 *
 * Payload quando chamado por automação de Ride (update event):
 *   { event: { type }, data: { ...ride } }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    initFirebase();

    const payload = await req.json();

    // --- Modo automação (entidade Ride): chamada interna, não requer auth de usuário ---
    // --- Modo chamada direta: exige admin ---
    if (!payload.event) {
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    if (payload.event) {
      const { event, data: ride } = payload;

      if (event.type !== 'update' || !ride) {
        return Response.json({ success: true, skipped: true });
      }

      const notifications = [];

      switch (ride.status) {
        case 'accepted':
          if (ride.passenger_id) {
            notifications.push({
              userId: ride.passenger_id,
              title: '🚗 Corrida Aceita!',
              message: 'Uma motorista aceitou sua corrida e está a caminho!',
              type: 'ride'
            });
          }
          break;

        case 'arrived':
          if (ride.passenger_id) {
            notifications.push({
              userId: ride.passenger_id,
              title: '📍 Motorista Chegou!',
              message: 'Sua motorista chegou ao local de embarque.',
              type: 'ride'
            });
          }
          break;

        case 'in_progress':
          if (ride.passenger_id) {
            notifications.push({
              userId: ride.passenger_id,
              title: '🎯 Corrida em Andamento',
              message: 'Boa viagem! Você está a caminho do destino.',
              type: 'ride'
            });
          }
          break;

        case 'completed':
          if (ride.passenger_id) {
            notifications.push({
              userId: ride.passenger_id,
              title: '✅ Corrida Concluída!',
              message: 'Você chegou! Obrigada por usar Central Dellas. 💖',
              type: 'ride'
            });
          }
          if (ride.assigned_driver_id) {
            notifications.push({
              userId: ride.assigned_driver_id,
              title: '✅ Corrida Finalizada',
              message: 'Corrida concluída com sucesso! Seus ganhos foram registrados.',
              type: 'ride'
            });
          }
          break;

        case 'cancelled':
          if (ride.passenger_id) {
            notifications.push({
              userId: ride.passenger_id,
              title: '❌ Corrida Cancelada',
              message: 'Sua corrida foi cancelada.',
              type: 'ride'
            });
          }
          if (ride.assigned_driver_id) {
            notifications.push({
              userId: ride.assigned_driver_id,
              title: '❌ Corrida Cancelada',
              message: 'A corrida foi cancelada pela passageira.',
              type: 'ride'
            });
          }
          break;

        default:
          return Response.json({ success: true, skipped: true, status: ride.status });
      }

      const results = [];
      for (const n of notifications) {
        // Inbox
        await base44.asServiceRole.entities.Notification.create({
          user_id: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          is_read: false,
          is_persistent: true
        });

        // Push
        const pushResult = await sendPush(n.userId, n.title, n.message, { type: n.type });
        results.push({ userId: n.userId, ...pushResult });
        console.log(`Notificação enviada para ${n.userId}:`, pushResult);
      }

      return Response.json({ success: true, results });
    }

    // --- Modo chamada direta ---
    const { userId, title, message, type = 'system', link } = payload;

    if (!userId || !title || !message) {
      return Response.json({ error: 'userId, title e message são obrigatórios' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      is_persistent: true,
      related_link: link || null
    });

    const pushResult = await sendPush(userId, title, message, { type, link: link || '/' });

    return Response.json({ success: true, inbox: true, push: pushResult });

  } catch (error) {
    console.error('Erro em rideNotify:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});