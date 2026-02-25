import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const step = { current: 'init' };
  
  try {
    const base44 = createClientFromRequest(req);
    
    step.current = 'auth';
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ 
        ok: false,
        step: step.current,
        message: 'Não autenticado',
        context: null
      }, { status: 200 });
    }

    step.current = 'parse_input';
    const { conversationId } = await req.json();

    if (!conversationId) {
      return Response.json({ 
        ok: false,
        step: step.current,
        message: 'conversationId é obrigatório',
        context: { conversationId }
      }, { status: 200 });
    }

    step.current = 'fetch_conversation';
    const conversations = await base44.asServiceRole.entities.Conversation.filter(
      { id: conversationId },
      undefined, undefined, undefined, undefined,
      { data_env: "dev" }
    );

    if (!conversations || conversations.length === 0) {
      return Response.json({ 
        ok: false,
        step: step.current,
        message: 'Conversa não encontrada',
        context: { conversationId }
      }, { status: 200 });
    }

    const conversation = conversations[0];
    
    step.current = 'validate_participant';
    const isParticipant = 
      conversation.passenger_id === user.id || 
      conversation.driver_id === user.id;

    if (!isParticipant) {
      return Response.json({ 
        ok: false,
        step: step.current,
        message: 'Você não é participante desta conversa',
        context: { userId: user.id }
      }, { status: 200 });
    }

    step.current = 'fetch_unread';
    // Buscar mensagens não lidas da sessão atual que NÃO foram enviadas pelo usuário
    const unreadMessages = await base44.asServiceRole.entities.Message.filter(
      { 
        conversation_id: conversationId,
        session_id: conversation.active_session_id,
        is_read: false,
        sender_id: { $ne: user.id }
      },
      undefined, undefined, undefined, undefined,
      { data_env: "dev" }
    );

    step.current = 'mark_read';
    // Marcar como lidas
    for (const msg of unreadMessages || []) {
      await base44.asServiceRole.entities.Message.update(
        msg.id,
        { is_read: true },
        { data_env: "dev" }
      );
    }

    return Response.json({ 
      ok: true,
      markedCount: unreadMessages?.length || 0
    });
  } catch (error) {
    console.error('Error in chat_markRead:', error);
    return Response.json({ 
      ok: false,
      step: step.current,
      message: error.message,
      context: { stack: error.stack }
    }, { status: 200 });
  }
});