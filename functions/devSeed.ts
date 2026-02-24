import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const VERSION = "dev_seed_v3";

const ALLOWED_EMAILS = [
  'dellasadvogadas@gmail.com',
  'luishcosta3@gmail.com',
  'rossideh77@gmail.com'
];

const TEST_USERS = {
  passenger: {
    email: 'luishcosta3@gmail.com',
    full_name: 'Luis Costa',
    role: 'passenger'
  },
  driver: {
    email: 'rossideh77@gmail.com',
    full_name: 'Rossi Dellas',
    role: 'driver'
  }
};

Deno.serve(async (req) => {
  let step = 'start';
  let context = {
    version: VERSION,
    action: null,
    userAEmail: null,
    userBEmail: null,
    userAId: null,
    userBId: null,
    entities: ['Ride', 'Conversation', 'Message', 'Notification']
  };
  
  try {
    console.log('🚀 DevSeed Handler START', { version: VERSION, timestamp: new Date().toISOString() });
    
    // Etapa 1: Parse request
    step = 'parse_request';
    let payload;
    try {
      payload = await req.json();
      context.action = payload.action || 'unknown';
      console.log('📦 Payload recebido:', payload);
    } catch (err) {
      console.error('❌ Erro ao parsear request:', err);
      return Response.json({
        ok: false,
        version: VERSION,
        step,
        message: 'Invalid JSON in request body',
        stack: null,
        context
      }, { status: 200 });
    }
    
    // Etapa 2: Criar client
    step = 'create_client';
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (err) {
      console.error('❌ Erro ao criar client:', err);
      return Response.json({
        ok: false,
        version: VERSION,
        step,
        message: err?.message ?? String(err),
        stack: err?.stack ?? null,
        context
      }, { status: 200 });
    }
    
    // Etapa 3: Verificar autenticação
    step = 'check_auth';
    let currentUser;
    try {
      currentUser = await base44.auth.me();
      context.currentUser = currentUser.email;
    } catch (err) {
      console.error('❌ Usuário não autenticado:', err);
      return Response.json({ 
        ok: false,
        version: VERSION,
        step,
        message: 'Unauthorized: Login required',
        stack: null,
        context
      }, { status: 200 });
    }

    // Etapa 4: Verificar allowlist
    step = 'check_allowlist';
    if (!ALLOWED_EMAILS.includes(currentUser.email)) {
      console.error('❌ Email não autorizado:', currentUser.email);
      return Response.json({ 
        ok: false,
        version: VERSION,
        step,
        message: 'Forbidden: Only authorized developers can access dev seed',
        stack: null,
        context: {
          ...context,
          allowedEmails: ALLOWED_EMAILS
        }
      }, { status: 200 });
    }
    
    console.log('✅ Auth OK:', currentUser.email);

    // Etapa 5: Rotear ação
    step = 'route_action';
    const action = payload.action;
    
    if (action === 'create_users') {
      return await createTestUsers(base44, VERSION);
    } else if (action === 'create_conversation') {
      return await createConversation(base44, payload, VERSION);
    } else if (action === 'get_status') {
      return await getStatus(base44, VERSION);
    } else {
      console.error('❌ Ação inválida:', action);
      return Response.json({ 
        ok: false,
        version: VERSION,
        step,
        message: `Invalid action: ${action}`,
        stack: null,
        context: { ...context, validActions: ['create_users', 'create_conversation', 'get_status'] }
      }, { status: 200 });
    }

  } catch (err) {
    console.error('💥 ERRO FATAL no handler:', {
      step,
      context,
      message: err?.message,
      stack: err?.stack
    });
    
    return Response.json({ 
      ok: false,
      version: VERSION,
      step,
      message: err?.message ?? String(err),
      stack: err?.stack ?? null,
      context
    }, { status: 200 });
  }
});

async function createTestUsers(base44, VERSION) {
  let step = 'start_create_users';
  const context = { version: VERSION, action: 'create_users' };
  
  try {
    const results = {
      passenger: { created: false, id: null },
      driver: { created: false, id: null }
    };

    for (const [type, userData] of Object.entries(TEST_USERS)) {
      step = `create_user_${type}`;
      
      try {
        // Verificar se usuário já existe
        const existingUsers = await base44.asServiceRole.entities.User.filter({ 
          email: userData.email 
        });

        if (existingUsers.length > 0) {
          results[type] = {
            created: false,
            id: existingUsers[0].id,
            message: 'Já existe'
          };
          continue;
        }

        results[type] = {
          created: false,
          message: 'Usuário precisa se registrar manualmente com email: ' + userData.email
        };

      } catch (err) {
        console.error(`Erro ao processar ${type}:`, err);
        results[type] = {
          created: false,
          error: err?.message ?? String(err)
        };
      }
    }

    return Response.json({
      ok: true,
      version: VERSION,
      step,
      results,
      context
    }, { status: 200 });
    
  } catch (err) {
    console.error('💥 Erro em createTestUsers:', err);
    return Response.json({
      ok: false,
      version: VERSION,
      step,
      message: err?.message ?? String(err),
      stack: err?.stack ?? null,
      context
    }, { status: 200 });
  }
}

async function createConversation(base44, payload, VERSION) {
  let step = 'init';
  const context = {
    version: VERSION,
    action: 'create_conversation',
    userAEmail: payload.userAEmail || TEST_USERS.passenger.email,
    userBEmail: payload.userBEmail || TEST_USERS.driver.email,
    userAId: null,
    userBId: null,
    userAName: null,
    userBName: null,
    rideId: null,
    conversationId: null,
    messageId: null,
    entities: ['Ride', 'Conversation', 'Message', 'Notification']
  };

  try {
    console.log('=== INÍCIO createConversation ===', { payload, context });
    
    // Etapa 1: Buscar usuário A
    step = 'lookup_user_a';
    console.log(`📍 Step: ${step}`);
    const userAResults = await base44.asServiceRole.entities.User.filter({ 
      email: context.userAEmail 
    });
    
    if (userAResults.length === 0) {
      console.error('❌ Usuário A não encontrado:', context.userAEmail);
      return Response.json({
        ok: false,
        version: VERSION,
        step,
        message: `User A not found: ${context.userAEmail}`,
        stack: null,
        context
      }, { status: 200 });
    }
    
    context.userAId = userAResults[0].id;
    context.userAName = userAResults[0].full_name || userAResults[0].email;
    console.log('✅ User A found:', { id: context.userAId, name: context.userAName });

    // Etapa 2: Buscar usuário B
    step = 'lookup_user_b';
    console.log(`📍 Step: ${step}`);
    const userBResults = await base44.asServiceRole.entities.User.filter({ 
      email: context.userBEmail 
    });
    
    if (userBResults.length === 0) {
      console.error('❌ Usuário B não encontrado:', context.userBEmail);
      return Response.json({
        ok: false,
        version: VERSION,
        step,
        message: `User B not found: ${context.userBEmail}`,
        stack: null,
        context
      }, { status: 200 });
    }
    
    context.userBId = userBResults[0].id;
    context.userBName = userBResults[0].full_name || userBResults[0].email;
    console.log('✅ User B found:', { id: context.userBId, name: context.userBName });

    // Etapa 3: Criar Ride fake (obrigatório para Conversation.ride_id)
    step = 'create_ride';
    console.log(`📍 Step: ${step}`);
    const ridePayload = {
      passenger_id: context.userAId,
      pickup_lat: -20.7555,
      pickup_lng: -47.7884,
      pickup_text: 'DevSeed Test Pickup',
      dropoff_lat: -20.7245,
      dropoff_lng: -47.8050,
      dropoff_text: 'DevSeed Test Dropoff',
      status: 'accepted',
      estimated_price: 0,
      is_test: true,
      test_seed_key: 'devseed_chat_' + Date.now()
    };
    console.log('Ride payload:', ridePayload);
    
    const ride = await base44.asServiceRole.entities.Ride.create(ridePayload);
    context.rideId = ride.id;
    console.log('✅ Ride created:', context.rideId);

    // Etapa 4: Verificar conversa existente
    step = 'check_existing_conversation';
    console.log(`📍 Step: ${step}`);
    const existingConversations = await base44.asServiceRole.entities.Conversation.filter({
      passenger_id: context.userAId,
      driver_id: context.userBId,
      status: 'active'
    });

    let conversation;
    let conversationCreated = false;

    if (existingConversations.length > 0) {
      conversation = existingConversations[0];
      context.conversationId = conversation.id;
      console.log('♻️ Reusing existing conversation:', context.conversationId);
    } else {
      // Etapa 5: Criar nova conversa
      step = 'create_conversation';
      console.log(`📍 Step: ${step}`);
      const conversationPayload = {
        ride_id: context.rideId,
        passenger_id: context.userAId,
        driver_id: context.userBId,
        status: 'active'
      };
      console.log('Conversation payload:', conversationPayload);
      
      conversation = await base44.asServiceRole.entities.Conversation.create(conversationPayload);
      conversationCreated = true;
      context.conversationId = conversation.id;
      console.log('✅ Conversation created:', context.conversationId);
    }

    // Etapa 6: Criar mensagem "Oi" (SEMPRE)
    step = 'create_message';
    console.log(`📍 Step: ${step}`);
    const messagePayload = {
      conversation_id: context.conversationId,
      ride_id: context.rideId,
      sender_id: context.userAId,
      type: 'text',
      text: 'Oi',
      status: 'visible',
      is_read: false
    };
    console.log('Message payload:', messagePayload);
    
    const message = await base44.asServiceRole.entities.Message.create(messagePayload);
    context.messageId = message.id;
    console.log('✅ Message created:', context.messageId);

    // Etapa 7: Criar notificação para receptor
    step = 'create_notification';
    console.log(`📍 Step: ${step}`);
    const notificationPayload = {
      user_id: context.userBId,
      title: 'Nova mensagem',
      message: `${context.userAName} enviou: Oi`,
      type: 'ride',
      is_read: false
    };
    console.log('Notification payload:', notificationPayload);
    
    await base44.asServiceRole.entities.Notification.create(notificationPayload);
    console.log('✅ Notification created for:', context.userBId);

    const result = {
      ok: true,
      version: VERSION,
      step: 'success',
      conversationId: context.conversationId,
      messageId: context.messageId,
      rideId: context.rideId,
      senderId: context.userAId,
      receiverId: context.userBId,
      senderName: context.userAName,
      receiverName: context.userBName,
      conversationCreated,
      context
    };

    console.log('🎉 SUCCESS ===', result);
    return Response.json(result, { status: 200 });

  } catch (err) {
    console.error('💥 ERRO em createConversation:', {
      step,
      context,
      message: err?.message,
      stack: err?.stack
    });
    
    return Response.json({ 
      ok: false,
      version: VERSION,
      step,
      message: err?.message ?? String(err),
      stack: err?.stack ?? null,
      context
    }, { status: 200 });
  }
}

async function getStatus(base44, VERSION) {
  let step = 'start_get_status';
  const context = { version: VERSION, action: 'get_status' };
  
  try {
    step = 'fetch_users';
    const passengerUsers = await base44.asServiceRole.entities.User.filter({ 
      email: TEST_USERS.passenger.email 
    });
    const driverUsers = await base44.asServiceRole.entities.User.filter({ 
      email: TEST_USERS.driver.email 
    });

    const status = {
      users: {
        passenger: passengerUsers.length > 0 ? passengerUsers[0].id : null,
        driver: driverUsers.length > 0 ? driverUsers[0].id : null
      },
      conversation: null
    };

    if (status.users.passenger && status.users.driver) {
      step = 'fetch_conversation';
      const conversations = await base44.asServiceRole.entities.Conversation.filter({
        passenger_id: status.users.passenger,
        driver_id: status.users.driver
      });

      if (conversations.length > 0) {
        status.conversation = conversations[0].id;
      }
    }

    return Response.json({
      ok: true,
      version: VERSION,
      step: 'success',
      status,
      context
    }, { status: 200 });
    
  } catch (err) {
    console.error('💥 Erro em getStatus:', err);
    return Response.json({ 
      ok: false,
      version: VERSION,
      step,
      message: err?.message ?? String(err),
      stack: err?.stack ?? null,
      context
    }, { status: 200 });
  }
}