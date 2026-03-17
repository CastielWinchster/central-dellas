import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import admin from 'npm:firebase-admin@12.0.0';

// Inicializar Firebase Admin (singleton)
let adminInitialized = false;

function initializeAdmin() {
  if (adminInitialized) return;
  
  try {
    const serviceAccountJSON = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJSON) {
      console.error('FIREBASE_SERVICE_ACCOUNT_JSON não configurado');
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountJSON);
    
    // Verificar se já foi inicializado
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    adminInitialized = true;
    console.log('Firebase Admin inicializado');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { toUserId, type, title, body, data = {} } = await req.json();

    if (!toUserId || !type || !title || !body) {
      return Response.json({ 
        error: 'Missing required fields: toUserId, type, title, body' 
      }, { status: 400 });
    }

    // Inicializar admin
    initializeAdmin();

    if (!adminInitialized) {
      return Response.json({ 
        error: 'Firebase Admin não configurado' 
      }, { status: 500 });
    }

    const db = admin.firestore();

    // 1. Criar notificação interna (Inbox)
    const notificationRef = db.collection('notifications');
    const notificationDoc = await notificationRef.add({
      userId: toUserId,
      type,
      title,
      body,
      data,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Notificação Inbox criada:', notificationDoc.id);

    // 2. Tentar enviar push real
    let pushResult = { success: false, reason: 'not_attempted' };
    
    try {
      const pushResponse = await base44.functions.invoke('sendPushToUser', {
        toUserId,
        title,
        body,
        data
      });

      pushResult = pushResponse.data;
      console.log('Push result:', pushResult);
    } catch (error) {
      console.error('Erro ao chamar sendPushToUser:', error);
      pushResult = { success: false, error: error.message };
    }

    return Response.json({ 
      success: true,
      notificationId: notificationDoc.id,
      inboxCreated: true,
      pushSent: pushResult.success,
      pushDetails: pushResult
    });

  } catch (error) {
    console.error('Erro em notifyUser:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});