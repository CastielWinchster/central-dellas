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
    // Buscar usuários de teste
    const passengerUsers = await base44.asServiceRole.entities.User.filter({ 
      email: TEST_USERS.passenger.email 
    });
    const driverUsers = await base44.asServiceRole.entities.User.filter({ 
      email: TEST_USERS.driver.email 
    });

    if (passengerUsers.length === 0 || driverUsers.length === 0) {
      return Response.json({ 
        error: 'Usuários de teste não encontrados. Registre-os primeiro.',
        passengerExists: passengerUsers.length > 0,
        driverExists: driverUsers.length > 0
      }, { status: 400 });
    }

    const passengerId = passengerUsers[0].id;
    const driverId = driverUsers[0].id;

    // Verificar se já existe conversa entre os dois usuários
    const existingConversations = await base44.asServiceRole.entities.Conversation.filter({
      passenger_id: passengerId,
      driver_id: driverId
    });

    let conversation;
    let conversationCreated = false;

    if (existingConversations.length > 0) {
      conversation = existingConversations[0];
    } else {
      // Criar conversa sem corrida vinculada
      conversation = await base44.asServiceRole.entities.Conversation.create({
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
        sender_id: 'system',
        type: 'system',
        text: 'Chat de teste criado. Conversem à vontade!',
        status: 'visible'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      await base44.asServiceRole.entities.Message.create({
        conversation_id: conversation.id,
        sender_id: driverId,
        type: 'text',
        text: 'Olá! Como vai? 👋',
        status: 'visible'
      });

      messagesCreated = true;

      // Criar notificações para ambos os usuários
      await base44.asServiceRole.entities.Notification.create({
        user_id: passengerId,
        title: 'Nova conversa disponível',
        message: 'Você tem uma nova conversa de teste no chat!',
        type: 'system',
        is_read: false
      });

      await base44.asServiceRole.entities.Notification.create({
        user_id: driverId,
        title: 'Nova conversa disponível',
        message: 'Você tem uma nova conversa de teste no chat!',
        type: 'system',
        is_read: false
      });
    }

    return Response.json({
      success: true,
      conversation: {
        id: conversation.id,
        created: conversationCreated,
        status: conversation.status
      },
      messages: {
        created: messagesCreated,
        count: existingMessages.length || 2
      }
    });

  } catch (error) {
    console.error('Erro ao criar conversa:', error);
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