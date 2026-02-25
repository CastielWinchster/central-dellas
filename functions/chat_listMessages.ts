import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, afterTs } = await req.json();

    // Validar participante da conversa
    const conversations = await base44.asServiceRole.entities.Conversation.filter(
      { id: conversationId },
      undefined, undefined, undefined, undefined,
      { data_env: "dev" }
    );

    if (!conversations || conversations.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = conversations[0];
    
    // Verificar se usuário é participante
    const isParticipant = 
      conversation.passenger_id === user.id || 
      conversation.driver_id === user.id;

    if (!isParticipant) {
      return Response.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Buscar mensagens
    let filter = { conversation_id: conversationId };
    
    if (afterTs) {
      filter.created_date = { $gt: afterTs };
    }

    const messages = await base44.asServiceRole.entities.Message.filter(
      filter,
      'created_date',
      undefined, undefined, undefined,
      { data_env: "dev" }
    );

    return Response.json({ ok: true, messages: messages || [] });
  } catch (error) {
    console.error('Error listing messages:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});