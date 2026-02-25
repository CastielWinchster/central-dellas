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

    // Buscar conversa da corrida
    const conversations = await base44.asServiceRole.entities.Conversation.filter({ 
      ride_id,
      status: 'active'
    });

    if (conversations.length === 0) {
      return Response.json({ message: 'Nenhuma conversa ativa encontrada' });
    }

    const conversation = conversations[0];
    
    // Verificar se usuário é participante
    const isParticipant = 
      conversation.passenger_id === user.id || 
      conversation.driver_id === user.id;

    if (!isParticipant) {
      return Response.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Arquivar conversa
    await base44.asServiceRole.entities.Conversation.update(conversation.id, {
      status: 'archived',
      archived_at: new Date().toISOString()
    });

    // Criar mensagem do sistema
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      ride_id,
      sender_id: 'system',
      type: 'system',
      text: 'Corrida finalizada. Conversa arquivada.',
      status: 'visible'
    });

    return Response.json({ 
      message: 'Conversa arquivada com sucesso',
      conversation 
    });
  } catch (error) {
    console.error('Erro ao arquivar conversa:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});