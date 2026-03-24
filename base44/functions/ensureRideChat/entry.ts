import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import admin from 'npm:firebase-admin@13.0.2';

// Inicializar Firebase Admin
let firebaseApp = null;

function initFirebase() {
  if (!firebaseApp) {
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON'));
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  return admin.firestore();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rideId } = await req.json();

    if (!rideId) {
      return Response.json({ error: 'rideId é obrigatório' }, { status: 400 });
    }

    // Buscar dados da corrida no Base44
    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    
    if (rides.length === 0) {
      return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });
    }

    const ride = rides[0];

    // Verificar se corrida está em status válido para chat
    if (!['accepted', 'arrived', 'in_progress', 'completed'].includes(ride.status)) {
      return Response.json({ 
        error: 'Chat não disponível para esta corrida',
        status: ride.status 
      }, { status: 400 });
    }

    // Verificar se usuário é participante
    if (user.id !== ride.passenger_id && user.id !== ride.assigned_driver_id) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Garantir que o chat existe no Firestore
    const db = initFirebase();
    const chatRef = db.collection('chats').doc(rideId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      await chatRef.set({
        participants: [ride.assigned_driver_id, ride.passenger_id],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: '',
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return Response.json({
      success: true,
      rideId,
      participants: [ride.assigned_driver_id, ride.passenger_id]
    });
  } catch (error) {
    console.error('Erro ao garantir chat:', error);
    return Response.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 });
  }
});