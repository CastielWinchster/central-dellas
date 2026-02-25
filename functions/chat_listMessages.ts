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
    const { conversationId, afterTs } = await req.json();

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

    step.current = 'ensure_session';
    // Garantir sessão ativa
    const sessionResponse = await fetch(new URL('/functions/chat_startSession', req.url).href, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify({ conversationId })
    });
    const sessionData = await sessionResponse.json();

    if (!sessionData.ok) {
      return Response.json({ 
        ok: false,
        step: step.current,
        message: 'Erro ao garantir sessão ativa',
        context: sessionData
      }, { status: 200 });
    }

    step.current = 'fetch_messages';
    // Buscar apenas mensagens da sessão atual
    let filter = { 
      conversation_id: conversationId,
      session_id: sessionData.sessionId,
      status: 'visible'
    };
    
    if (afterTs) {
      filter.created_date = { $gt: afterTs };
    }

    const messages = await base44.asServiceRole.entities.Message.filter(
      filter,
      'created_date',
      undefined, undefined, undefined,
      { data_env: "dev" }
    );

    return Response.json({ 
      ok: true,
      messages: messages || [],
      sessionId: sessionData.sessionId,
      expiresAt: sessionData.expiresAt
    });
  } catch (error) {
    console.error('Error in chat_listMessages:', error);
    return Response.json({ 
      ok: false,
      step: step.current,
      message: error.message,
      context: { stack: error.stack }
    }, { status: 200 });
  }
});