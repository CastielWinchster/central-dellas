import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
  let action = 'unknown';
  let context = {};
  
  try {
    const base44 = createClientFromRequest(req);
    
    // SEGURANÇA: Verificar usuário logado
    let currentUser;
    try {
      currentUser = await base44.auth.me();
      context.currentUser = currentUser.email;
    } catch (error) {
      return Response.json({ error: 'Unauthorized: Login required' }, { status: 401 });
    }

    // SEGURANÇA: Verificar allowlist
    if (!ALLOWED_EMAILS.includes(currentUser.email)) {
      return Response.json({ 
        error: 'Forbidden: Only authorized developers can access dev seed',
        allowedEmails: ALLOWED_EMAILS
      }, { status: 403 });
    }

    const payload = await req.json();
    action = payload.action;
    context.action = action;
    
    console.log('=== DevSeed Handler ===', { action, payload });

    if (action === 'create_users') {
      return await createTestUsers(base44);
    } else if (action === 'create_conversation') {
      return await createConversation(base44, payload);
    } else if (action === 'get_status') {
      return await getStatus(base44);
    } else {
      return Response.json({ 
        ok: false,
        errorMessage: 'Invalid action',
        context: { action }
      }, { status: 200 });
    }

  } catch (error) {
    console.error('💥 ERRO FATAL no devSeed handler:', {
      action,
      context,
      message: error.message,
      stack: error.stack
    });
    
    return Response.json({ 
      ok: false,
      errorMessage: error.message,
      errorStack: error.stack,
      context: {
        ...context,
        stage: 'handler_root'
      }
    }, { status: 200 });
  }
});

async function createTestUsers(base44) {
  const results = {
    passenger: { created: false, id: null },
    driver: { created: false, id: null }
  };

  for (const [type, userData] of Object.entries(TEST_USERS)) {
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
        
        // Atualizar UserProfile se existir
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({
          user_id: existingUsers[0].id
        });
        
        if (profiles.length === 0) {
          await base44.asServiceRole.entities.UserProfile.create({
            user_id: existingUsers[0].id,
            full_name: userData.full_name,
            role: userData.role
          });
        }
        
        continue;
      }

      // Criar novo usuário via sistema de autenticação
      // Nota: Base44 não tem método direto para criar usuários com senha
      // O usuário precisará se registrar manualmente na primeira vez
      results[type] = {
        created: false,
        message: 'Usuário precisa se registrar manualmente com email: ' + userData.email
      };

    } catch (error) {
      console.error(`Erro ao processar ${type}:`, error);
      results[type] = {
        created: false,
        error: error.message
      };
    }
  }

  return Response.json(results);
}

async function createConversation(base44, payload) {
  const context = {
    stage: 'init',
    userAEmail: payload.userAEmail || TEST_USERS.passenger.email,
    userBEmail: payload.userBEmail || TEST_USERS.driver.email
  };

  try {
    console.log('=== INÍCIO createConversation ===', { payload, context });
    
    // Etapa 1: Buscar usuários
    context.stage = 'fetch_users';
    console.log('Etapa: Buscando usuários...', context);
    
    const userAResults = await base44.asServiceRole.entities.User.filter({ 
      email: context.userAEmail 
    });
    const userBResults = await base44.asServiceRole.entities.User.filter({ 
      email: context.userBEmail 
    });

    console.log('Usuários encontrados:', {
      userA: { email: context.userAEmail, found: userAResults.length > 0, id: userAResults[0]?.id },
      userB: { email: context.userBEmail, found: userBResults.length > 0, id: userBResults[0]?.id }
    });

    if (userAResults.length === 0 || userBResults.length === 0) {
      return Response.json({
        ok: false,
        errorMessage: 'Usuários não encontrados. Registre-os primeiro.',
        context: {
          ...context,
          userAExists: userAResults.length > 0,
          userBExists: userBResults.length > 0
        }
      }, { status: 200 });
    }

    const userAId = userAResults[0].id;
    const userBId = userBResults[0].id;
    const userAName = userAResults[0].full_name || userAResults[0].email;
    const userBName = userBResults[0].full_name || userBResults[0].email;

    context.userAId = userAId;
    context.userBId = userBId;
    context.userAName = userAName;
    context.userBName = userBName;

    console.log('IDs identificados:', context);

    // Etapa 2: Criar Ride fake
    context.stage = 'create_ride';
    console.log('Etapa: Criando Ride fake...', context);
    
    const ride = await base44.asServiceRole.entities.Ride.create({
      passenger_id: userAId,
      pickup_lat: -20.7555,
      pickup_lng: -47.7884,
      pickup_text: 'Teste DevSeed',
      dropoff_lat: -20.7245,
      dropoff_lng: -47.8050,
      dropoff_text: 'Teste DevSeed',
      status: 'accepted',
      estimated_price: 0,
      is_test: true,
      test_seed_key: 'devseed_chat_' + Date.now()
    });
    
    context.rideId = ride.id;
    console.log('Ride criada:', context.rideId);

    // Etapa 3: Verificar conversa existente
    context.stage = 'check_conversation';
    console.log('Etapa: Verificando conversa existente...', context);
    
    const existingConversations = await base44.asServiceRole.entities.Conversation.filter({
      passenger_id: userAId,
      driver_id: userBId,
      status: 'active'
    });

    let conversation;
    let conversationCreated = false;

    if (existingConversations.length > 0) {
      conversation = existingConversations[0];
      console.log('Reutilizando conversa:', conversation.id);
    } else {
      // Etapa 4: Criar conversa
      context.stage = 'create_conversation';
      const conversationPayload = {
        ride_id: ride.id,
        passenger_id: userAId,
        driver_id: userBId,
        status: 'active'
      };
      console.log('Etapa: Criando conversa...', { payload: conversationPayload, context });
      
      conversation = await base44.asServiceRole.entities.Conversation.create(conversationPayload);
      conversationCreated = true;
      console.log('Conversa criada:', conversation.id);
    }

    context.conversationId = conversation.id;

    // Etapa 5: Criar mensagem
    context.stage = 'create_message';
    const messagePayload = {
      conversation_id: conversation.id,
      ride_id: ride.id,
      sender_id: userAId,
      type: 'text',
      text: 'Oi',
      status: 'visible',
      is_read: false
    };
    console.log('Etapa: Criando mensagem...', { payload: messagePayload, context });
    
    const message = await base44.asServiceRole.entities.Message.create(messagePayload);
    context.messageId = message.id;
    console.log('Mensagem criada:', context.messageId);

    // Etapa 6: Criar notificação
    context.stage = 'create_notification';
    console.log('Etapa: Criando notificação...', context);
    
    await base44.asServiceRole.entities.Notification.create({
      user_id: userBId,
      title: 'Nova mensagem',
      message: `${userAName} enviou: Oi`,
      type: 'ride',
      is_read: false
    });
    console.log('Notificação criada para:', userBId);

    const result = {
      ok: true,
      conversationId: conversation.id,
      messageId: message.id,
      senderId: userAId,
      receiverId: userBId,
      senderName: userAName,
      receiverName: userBName,
      conversationCreated,
      context
    };

    console.log('✅ SUCESSO ===', result);
    return Response.json(result, { status: 200 });

  } catch (error) {
    console.error('💥 ERRO em createConversation:', {
      stage: context.stage,
      context,
      message: error.message,
      stack: error.stack
    });
    
    return Response.json({ 
      ok: false,
      errorMessage: error.message,
      errorStack: error.stack,
      context
    }, { status: 200 });
  }
}

async function getStatus(base44) {
  try {
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
      const conversations = await base44.asServiceRole.entities.Conversation.filter({
        passenger_id: status.users.passenger,
        driver_id: status.users.driver
      });

      if (conversations.length > 0) {
        status.conversation = conversations[0].id;
      }
    }

    return Response.json(status);
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}