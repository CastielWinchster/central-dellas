import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { event, data } = payload;
    
    if (event.type !== 'create') {
      return Response.json({ success: true, message: 'Not a create event' });
    }

    const message = data;
    if (!message || !message.receiver_id) {
      return Response.json({ error: 'No message data or receiver' }, { status: 400 });
    }

    // Get sender info
    const sender = await base44.asServiceRole.entities.User.get(message.sender_id);

    await base44.asServiceRole.functions.invoke('sendNotification', {
      user_id: message.receiver_id,
      title: '💬 Nova Mensagem',
      message: `${sender.full_name || 'Alguém'} enviou uma mensagem: "${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"`,
      type: 'message',
      related_id: message.id,
      icon: '💬',
      action_url: `/messages`,
      send_email: false,
      send_sms: false
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});