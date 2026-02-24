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
  try {
    const base44 = createClientFromRequest(req);
    
    // SEGURANÇA: Verificar usuário logado
    let currentUser;
    try {
      currentUser = await base44.auth.me();
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

    const { action } = await req.json();

    if (action === 'create_users') {
      return await createTestUsers(base44);
    } else if (action === 'create_conversation') {
      return await createConversation(base44);
    } else if (action === 'get_status') {
      return await getStatus(base44);
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro no devSeed:', error);
    return Response.json({ error: error.message }, { status: 500 });
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

async function createConversation(base44) {
  try {
    console.log('=== INÍCIO createConversation ===');
    
    // Buscar usuários de teste
    const passengerUsers = await base44.asServiceRole.entities.User.filter({ 
      email: TEST_USERS.passenger.email 
    });
    const driverUsers = await base44.asServiceRole.entities.User.filter({ 
      email: TEST_USERS.driver.email 
    });

    console.log('Passageiro encontrado:', passengerUsers.length > 0, passengerUsers[0]?.id);
    console.log('Motorista encontrado:', driverUsers.length > 0, driverUsers[0]?.id);

    if (passengerUsers.length === 0 || driverUsers.length === 0) {
      const error = {
        error: 'Usuários de teste não encontrados. Registre-os primeiro.',
        details: {
          passengerEmail: TEST_USERS.passenger.email,
          driverEmail: TEST_USERS.driver.email,
          passengerExists: passengerUsers.length > 0,
          driverExists: driverUsers.length > 0
        }
      };
      console.error('ERRO - Usuários não encontrados:', error);
      return Response.json(error, { status: 400 });
    }

    const passengerId = passengerUsers[0].id;
    const driverId = driverUsers[0].id;
    const passengerName = passengerUsers[0].full_name || passengerUsers[0].email;
    const driverName = driverUsers[0].full_name || driverUsers[0].email;

    console.log('IDs identificados:', { passengerId, driverId, passengerName, driverName });

    // Criar Ride fake primeiro (obrigatório pela entity Conversation)
    console.log('Criando Ride fake...');
    const ride = await base44.asServiceRole.entities.Ride.create({
      passenger_id: passengerId,
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
    console.log('Ride criada:', ride.id);

    // Verificar se já existe conversa entre os dois usuários
    const existingConversations = await base44.asServiceRole.entities.Conversation.filter({
      passenger_id: passengerId,
      driver_id: driverId,
      status: 'active'
    });

    let conversation;
    let conversationCreated = false;

    if (existingConversations.length > 0) {
      conversation = existingConversations[0];
      console.log('Reutilizando conversa existente:', conversation.id);
    } else {
      // Criar conversa
      const conversationPayload = {
        ride_id: ride.id,
        passenger_id: passengerId,
        driver_id: driverId,
        status: 'active'
      };
      console.log('Payload Conversation:', conversationPayload);
      
      conversation = await base44.asServiceRole.entities.Conversation.create(conversationPayload);
      conversationCreated = true;
      console.log('Conversa criada:', conversation.id);
    }

    // SEMPRE criar nova mensagem "Oi"
    const messagePayload = {
      conversation_id: conversation.id,
      ride_id: ride.id,
      sender_id: passengerId,
      type: 'text',
      text: 'Oi',
      status: 'visible',
      is_read: false
    };
    console.log('Payload Message:', messagePayload);
    
    const message = await base44.asServiceRole.entities.Message.create(messagePayload);
    console.log('Mensagem criada:', message.id);

    // Criar notificação apenas para o receptor (motorista)
    await base44.asServiceRole.entities.Notification.create({
      user_id: driverId,
      title: 'Nova mensagem',
      message: `${passengerName} enviou: Oi`,
      type: 'ride',
      is_read: false
    });
    console.log('Notificação criada para:', driverId);

    const result = {
      ok: true,
      conversationId: conversation.id,
      messageId: message.id,
      senderId: passengerId,
      receiverId: driverId,
      senderName: passengerName,
      receiverName: driverName,
      conversationCreated,
      debug: {
        passengerEmail: TEST_USERS.passenger.email,
        driverEmail: TEST_USERS.driver.email,
        rideId: ride.id
      }
    };

    console.log('=== SUCESSO ===', result);
    return Response.json(result);

  } catch (error) {
    console.error('=== ERRO FATAL ===', error);
    return Response.json({ 
      ok: false,
      error: error.message,
      stack: error.stack,
      details: 'Erro ao criar conversa ou mensagem'
    }, { status: 500 });
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