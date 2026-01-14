import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { event, data } = payload;
    
    if (event.type !== 'update') {
      return Response.json({ success: true, message: 'Not an update event' });
    }

    const driverDoc = data;
    if (!driverDoc) {
      return Response.json({ error: 'No driver document data' }, { status: 400 });
    }

    let title = '';
    let message = '';
    let icon = '📄';

    switch (driverDoc.verification_status) {
      case 'pending':
        title = '⏳ Documentação em Análise';
        message = 'Sua documentação foi recebida e está sendo analisada. Aguarde até 48 horas.';
        break;
      case 'approved':
        title = '✅ Documentação Aprovada!';
        message = 'Parabéns! Sua documentação foi aprovada. Você já pode começar a dirigir!';
        icon = '🎉';
        break;
      case 'rejected':
        title = '❌ Documentação Rejeitada';
        message = `Sua documentação foi rejeitada. Motivo: ${driverDoc.rejection_reason || 'Não especificado'}. Por favor, envie novamente.`;
        icon = '⚠️';
        break;
    }

    if (title && message) {
      await base44.asServiceRole.functions.invoke('sendNotification', {
        user_id: driverDoc.user_id,
        title,
        message,
        type: 'driver_verification',
        related_id: driverDoc.id,
        icon,
        action_url: '/driver-registration',
        send_email: true,
        send_sms: true
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});