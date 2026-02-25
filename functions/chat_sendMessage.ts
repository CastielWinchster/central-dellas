import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, type, text, fileUrl, durationSec } = await req.json();

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

    // Criar mensagem usando service role
    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      type: type || 'text',
      status: 'visible',
      is_read: false
    };

    if (conversation.ride_id) {
      messageData.ride_id = conversation.ride_id;
    }

    if (text) messageData.text = text;
    if (fileUrl) messageData.file_url = fileUrl;
    if (durationSec !== undefined) messageData.duration_sec = durationSec;

    const message = await base44.asServiceRole.entities.Message.create(
      messageData,
      { data_env: "dev" }
    );

    return Response.json({ ok: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});