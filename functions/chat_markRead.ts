import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await req.json();

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

    // Buscar mensagens não lidas que NÃO foram enviadas pelo usuário
    const unreadMessages = await base44.asServiceRole.entities.Message.filter(
      { 
        conversation_id: conversationId,
        is_read: false,
        sender_id: { $ne: user.id }
      },
      undefined, undefined, undefined, undefined,
      { data_env: "dev" }
    );

    // Marcar como lidas
    for (const msg of unreadMessages || []) {
      await base44.asServiceRole.entities.Message.update(
        msg.id,
        { is_read: true },
        { data_env: "dev" }
      );
    }

    return Response.json({ ok: true, markedCount: unreadMessages?.length || 0 });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});