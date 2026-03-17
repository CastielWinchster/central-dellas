import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);
    
    // Verificar se é uma mensagem recebida
    if (!body.messages || body.messages.length === 0) {
      return Response.json({ success: true });
    }

    const message = body.messages[0];
    const phoneNumber = message.from;
    const messageText = message.body?.toLowerCase() || '';
    const userName = message.notifyName || 'Cliente';

    console.log('WhatsApp message received:', { phoneNumber, messageText, userName });

    // Buscar ou criar conversa
    let conversations = await base44.asServiceRole.entities.WhatsAppConversation.filter({
      phone_number: phoneNumber
    });

    let conversation = conversations[0];
    
    if (!conversation) {
      conversation = await base44.asServiceRole.entities.WhatsAppConversation.create({
        phone_number: phoneNumber,
        user_name: userName,
        status: 'bot',
        messages: [],
        conversation_type: 'ride_request'
      });
    }

    // Adicionar mensagem ao histórico
    const updatedMessages = conversation.messages || [];
    updatedMessages.push({
      from: 'user',
      text: message.body,
      timestamp: new Date().toISOString()
    });

    // Lógica de resposta automática
    let responseText = '';
    let shouldEscalate = false;

    // Palavras-chave para escalação humana
    const escalateKeywords = ['reclamação', 'reclamar', 'problema', 'corporativo', 'empresa', 'contrato'];
    const rideKeywords = ['corrida', 'carro', 'viagem', 'buscar', 'levar', 'taxi'];

    if (escalateKeywords.some(word => messageText.includes(word))) {
      shouldEscalate = true;
      responseText = `Olá ${userName}! 👋

Entendi que você precisa de atendimento personalizado.

Um membro da nossa equipe vai responder em breve (horário comercial: 8h-18h).

Sua mensagem foi registrada e daremos retorno o mais rápido possível!`;

      await base44.asServiceRole.entities.WhatsAppConversation.update(conversation.id, {
        status: 'human',
        conversation_type: 'complaint',
        messages: updatedMessages
      });

      // Notificar admin
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: admin.id,
          title: 'Nova Conversa WhatsApp Requer Atendimento',
          message: `${userName} (${phoneNumber}): "${message.body}"`,
          type: 'system',
          icon: '📱'
        });
      }
    } else if (rideKeywords.some(word => messageText.includes(word)) || !conversation.messages || conversation.messages.length <= 1) {
      // Primeira interação ou pedido de corrida
      const appUrl = `${req.headers.get('origin')}/PassengerLogin`;
      
      const promoCode = Deno.env.get('WHATSAPP_PROMO_CODE') || 'WHATSAPP10';
      responseText = `Olá ${userName}! 👋 Bem-vinda à Central Dellas!

🚗 *Para chamar uma corrida IMEDIATA* e ver o preço em tempo real:

📱 *Baixe nosso App*: ${appUrl}

✨ *BÔNUS*: Use o código *${promoCode}* e ganhe *10% OFF* na primeira corrida pelo app!

---

💬 Se for outro assunto (dúvida, reclamação, corporativo), responda esta mensagem e aguarde um atendente.`;

      // Criar código promocional se não existir
      const promoCodeValue = Deno.env.get('WHATSAPP_PROMO_CODE') || 'WHATSAPP10';
      const existingPromo = await base44.asServiceRole.entities.PromoCode.filter({
        code: promoCodeValue
      });

      if (existingPromo.length === 0) {
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + 3);
        
        await base44.asServiceRole.entities.PromoCode.create({
          code: promoCodeValue,
          discount_percentage: 10,
          valid_until: validUntil.toISOString().split('T')[0],
          is_active: true,
          first_ride_only: true,
          promo_type: 'app_migration',
          max_uses: 10000
        });
      }

      await base44.asServiceRole.entities.WhatsAppConversation.update(conversation.id, {
        messages: updatedMessages,
        conversation_type: 'ride_request'
      });
    } else {
      // Mensagens subsequentes - resposta genérica
      responseText = `Obrigada pela mensagem! 

Para *corridas imediatas*, use nosso app: ${req.headers.get('origin')}/PassengerLogin

Para *outros assuntos*, um atendente responderá em breve! ⏰`;

      await base44.asServiceRole.entities.WhatsAppConversation.update(conversation.id, {
        messages: updatedMessages
      });
    }

    // Registrar resposta do bot
    updatedMessages.push({
      from: 'bot',
      text: responseText,
      timestamp: new Date().toISOString()
    });

    await base44.asServiceRole.entities.WhatsAppConversation.update(conversation.id, {
      messages: updatedMessages
    });

    console.log('Bot response sent:', { phoneNumber, responseLength: responseText.length });

    // Retornar resposta para enviar via WhatsApp
    // (Este formato depende da API que você está usando - Twilio, Waha, etc)
    return Response.json({
      success: true,
      reply: {
        to: phoneNumber,
        body: responseText
      }
    });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return Response.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 });
  }
});