import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ALLOWED_EMAILS = [
  'luishcosta3@gmail.com' // Email do desenvolvedor autorizado
];

const TEST_USERS = {
  passenger: {
    email: 'passageira.teste@centraldellas.dev',
    password: 'Central@12345',
    full_name: 'Passageira Teste',
    role: 'passenger'
  },
  driver: {
    email: 'motorista.teste@centraldellas.dev',
    password: 'Central@12345',
    full_name: 'Motorista Teste',
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
    } else if (action === 'create_ride_conversation') {
      return await createRideAndConversation(base44);
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
        message: 'Usuário precisa se registrar manualmente com email: ' + userData.email,
        credentials: {
          email: userData.email,
          password: userData.password
        }
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

async function createRideAndConversation(base44) {
  try {
    // Buscar usuários de teste
    const passengerUsers = await base44.asServiceRole.entities.User.filter({ 
      email: TEST_USERS.passenger.email 
    });
    const driverUsers = await base44.asServiceRole.entities.User.filter({ 
      email: TEST_USERS.driver.email 
    });

    if (passengerUsers.length === 0 || driverUsers.length === 0) {
      return Response.json({ 
        error: 'Usuários de teste não encontrados. Crie-os primeiro ou registre-os manualmente.',
        passengerExists: passengerUsers.length > 0,
        driverExists: driverUsers.length > 0
      }, { status: 400 });
    }

    const passengerId = passengerUsers[0].id;
    const driverId = driverUsers[0].id;

    // Verificar se já existe corrida de teste
    const existingRides = await base44.asServiceRole.entities.Ride.filter({
      passenger_id: passengerId,
      assigned_driver_id: driverId,
      test_seed_key: 'seed_chat_v1'
    });

    let ride;
    let rideCreated = false;

    if (existingRides.length > 0) {
      ride = existingRides[0];
    } else {
      // Criar corrida fake
      ride = await base44.asServiceRole.entities.Ride.create({
        passenger_id: passengerId,
        assigned_driver_id: driverId,
        pickup_lat: -20.7555,
        pickup_lng: -47.7884,
        pickup_text: 'Praça da Matriz, Orlândia, SP',
        dropoff_lat: -20.7245,
        dropoff_lng: -47.8050,
        dropoff_text: 'Terminal Rodoviário, Orlândia, SP',
        status: 'accepted',
        estimated_price: 15.50,
        estimated_duration: 12,
        ride_type: 'standard',
        is_test: true,
        test_seed_key: 'seed_chat_v1'
      });
      rideCreated = true;
    }

    // Verificar se já existe conversa
    const existingConversations = await base44.asServiceRole.entities.Conversation.filter({
      ride_id: ride.id
    });

    let conversation;
    let conversationCreated = false;

    if (existingConversations.length > 0) {
      conversation = existingConversations[0];
    } else {
      // Criar conversa
      conversation = await base44.asServiceRole.entities.Conversation.create({
        ride_id: ride.id,
        passenger_id: passengerId,
        driver_id: driverId,
        status: 'active'
      });
      conversationCreated = true;
    }

    // Verificar se já existem mensagens
    const existingMessages = await base44.asServiceRole.entities.Message.filter({
      conversation_id: conversation.id
    });

    let messagesCreated = false;

    if (existingMessages.length === 0) {
      // Criar mensagens iniciais
      await base44.asServiceRole.entities.Message.create({
        conversation_id: conversation.id,
        ride_id: ride.id,
        sender_id: 'system',
        type: 'system',
        text: 'Corrida de teste criada. Chat liberado para testes.',
        status: 'visible'
      });

      // Aguardar 1 segundo para garantir ordem
      await new Promise(resolve => setTimeout(resolve, 1000));

      await base44.asServiceRole.entities.Message.create({
        conversation_id: conversation.id,
        ride_id: ride.id,
        sender_id: driverId,
        type: 'text',
        text: 'Olá! Estou a caminho 🙂',
        status: 'visible'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      await base44.asServiceRole.entities.Message.create({
        conversation_id: conversation.id,
        ride_id: ride.id,
        sender_id: passengerId,
        type: 'text',
        text: 'Perfeito, obrigada! 💗',
        status: 'visible'
      });

      messagesCreated = true;
    }

    return Response.json({
      success: true,
      ride: {
        id: ride.id,
        created: rideCreated,
        status: ride.status
      },
      conversation: {
        id: conversation.id,
        created: conversationCreated,
        status: conversation.status
      },
      messages: {
        created: messagesCreated,
        count: existingMessages.length || 3
      },
      chatUrls: {
        passenger: `/Chat?conversation=${conversation.id}`,
        driver: `/Chat?conversation=${conversation.id}`
      }
    });

  } catch (error) {
    console.error('Erro ao criar ride/conversation:', error);
    return Response.json({ error: error.message }, { status: 500 });
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
      ride: null,
      conversation: null
    };

    if (status.users.passenger && status.users.driver) {
      const rides = await base44.asServiceRole.entities.Ride.filter({
        passenger_id: status.users.passenger,
        assigned_driver_id: status.users.driver,
        test_seed_key: 'seed_chat_v1'
      });

      if (rides.length > 0) {
        status.ride = rides[0].id;

        const conversations = await base44.asServiceRole.entities.Conversation.filter({
          ride_id: rides[0].id
        });

        if (conversations.length > 0) {
          status.conversation = conversations[0].id;
        }
      }
    }

    return Response.json(status);
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}