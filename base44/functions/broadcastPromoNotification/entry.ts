import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { promoCode } = body;

    if (!promoCode) {
      return Response.json({ error: 'promoCode obrigatório' }, { status: 400 });
    }

    // Buscar todos os usuários
    const users = await base44.asServiceRole.entities.User.list();
    console.log(`[broadcastPromoNotification] Enviando para ${users.length} usuários`);

    const discount = promoCode.discount_amount
      ? `R$ ${promoCode.discount_amount.toFixed(2)} OFF`
      : promoCode.discount_percentage
      ? `${promoCode.discount_percentage}% OFF`
      : 'desconto especial';

    const notifications = users.map(u => ({
      user_id: u.id,
      title: '🎁 Novo cupom disponível!',
      message: `Use o cupom ${promoCode.code} e ganhe ${discount} na sua próxima corrida!`,
      type: 'coupon',
      is_read: false,
      is_persistent: true,
    }));

    // Criar em lotes de 50
    const batchSize = 50;
    let count = 0;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      await Promise.all(batch.map(n => base44.asServiceRole.entities.Notification.create(n)));
      count += batch.length;
    }

    console.log(`[broadcastPromoNotification] ${count} notificações criadas para cupom: ${promoCode.code}`);
    return Response.json({ success: true, count });
  } catch (error) {
    console.error('[broadcastPromoNotification] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});