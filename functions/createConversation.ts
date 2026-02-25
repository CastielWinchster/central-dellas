import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ride_id } = await req.json();

    if (!ride_id) {
      return Response.json({ error: 'ride_id é obrigatório' }, { status: 400 });
    }

    // Buscar dados da corrida
    const rides = await base44.asServiceRole.entities.Ride.filter({ id: ride_id });
    if (rides.length === 0) {
      return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });
    }

    const ride = rides[0];
    
    // Verificar se usuário é participante da corrida
    const isParticipant = 
      ride.passenger_id === user.id || 
      ride.assigned_driver_id === user.id;

    if (!isParticipant) {
      return Response.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Verificar se já existe conversa para esta corrida
    const existingConversations = await base44.asServiceRole.entities.Conversation.filter({ 
      ride_id 
    });

    if (existingConversations.length > 0) {
      return Response.json({ 
        conversation: existingConversations[0],
        message: 'Conversa já existe'
      });
    }

    // Criar nova conversa
    const conversation = await base44.asServiceRole.entities.Conversation.create({
      ride_id,
      passenger_id: ride.passenger_id,
      driver_id: ride.assigned_driver_id,
      status: 'active'
    });

    // Criar mensagem do sistema
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      ride_id,
      sender_id: 'system',
      type: 'system',
      text: 'Conversa iniciada. Seja educada e respeitosa.',
      status: 'visible'
    });

    return Response.json({ conversation });
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});