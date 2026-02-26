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
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
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

    const { toUserId, title, body, data = {} } = await req.json();

    if (!toUserId || !title || !body) {
      return Response.json({ 
        error: 'Missing required fields: toUserId, title, body' 
      }, { status: 400 });
    }

    // Inicializar admin se necessário
    initializeAdmin();

    if (!adminInitialized) {
      return Response.json({ 
        success: false, 
        error: 'Firebase Admin não configurado' 
      }, { status: 500 });
    }

    // Buscar token do usuário no Firestore
    const db = admin.firestore();
    const devicesRef = db.collection('user_devices');
    const snapshot = await devicesRef.where('userId', '==', toUserId).limit(1).get();

    if (snapshot.empty) {
      console.log(`Nenhum token encontrado para userId: ${toUserId}`);
      return Response.json({ 
        success: false, 
        reason: 'no_token',
        message: 'Usuário não tem token de push registrado'
      });
    }

    const deviceDoc = snapshot.docs[0];
    const token = deviceDoc.data().token;

    // Enviar push notification
    const message = {
      token,
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Push enviado com sucesso:', response);

    return Response.json({ 
      success: true, 
      messageId: response,
      toUserId 
    });

  } catch (error) {
    console.error('Erro ao enviar push:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});