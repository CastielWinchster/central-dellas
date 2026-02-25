import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SESSION_DURATION_MS = 24 * 60 * 1000; // 24 minutos (parametrizável)

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
        context: { userId: user.id, conversation }
      }, { status: 200 });
    }

    step.current = 'check_session';
    const now = new Date();
    const expiresAt = conversation.active_session_expires_at 
      ? new Date(conversation.active_session_expires_at) 
      : null;

    const needsNewSession = !expiresAt || now >= expiresAt;

    if (needsNewSession) {
      step.current = 'create_session';
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startedAt = now.toISOString();
      const newExpiresAt = new Date(now.getTime() + SESSION_DURATION_MS).toISOString();

      await base44.asServiceRole.entities.Conversation.update(
        conversationId,
        {
          active_session_id: sessionId,
          active_session_started_at: startedAt,
          active_session_expires_at: newExpiresAt
        },
        { data_env: "dev" }
      );

      return Response.json({ 
        ok: true,
        sessionId,
        startedAt,
        expiresAt: newExpiresAt,
        isNewSession: true
      });
    }

    return Response.json({ 
      ok: true,
      sessionId: conversation.active_session_id,
      startedAt: conversation.active_session_started_at,
      expiresAt: conversation.active_session_expires_at,
      isNewSession: false
    });
  } catch (error) {
    console.error('Error in chat_startSession:', error);
    return Response.json({ 
      ok: false,
      step: step.current,
      message: error.message,
      context: { stack: error.stack }
    }, { status: 200 });
  }
});