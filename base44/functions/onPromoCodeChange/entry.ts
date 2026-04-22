import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Acionado por automação de entidade PromoCode (create/update)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data } = payload;

    console.log(`[onPromoCodeChange] Evento: ${event?.type} | PromoCode:`, data?.code);

    // Só notificar se:
    // - Criação de cupom ativo
    // - Atualização onde is_active passou de false para true
    const isNewActive = event?.type === 'create' && data?.is_active;
    const wasJustActivated = event?.type === 'update' && data?.is_active && old_data?.is_active === false;

    if (!isNewActive && !wasJustActivated) {
      console.log('[onPromoCodeChange] Sem ação necessária');
      return Response.json({ skipped: true });
    }

    const promoCode = data;
    const discount = promoCode.discount_amount
      ? `R$ ${Number(promoCode.discount_amount).toFixed(2)} OFF`
      : promoCode.discount_percentage
      ? `${promoCode.discount_percentage}% OFF`
      : 'desconto especial';

    // Buscar todos os usuários
    const users = await base44.asServiceRole.entities.User.list();
    console.log(`[onPromoCodeChange] Notificando ${users.length} usuários sobre: ${promoCode.code}`);

    const batchSize = 50;
    let count = 0;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(batch.map(u =>
        base44.asServiceRole.entities.Notification.create({
          user_id: u.id,
          title: '🎁 Novo cupom disponível!',
          message: `Use o cupom ${promoCode.code} e ganhe ${discount} na sua próxima corrida!`,
          type: 'coupon',
          is_read: false,
          is_persistent: true,
        })
      ));
      count += batch.length;
    }

    console.log(`[onPromoCodeChange] ${count} notificações enviadas`);
    return Response.json({ success: true, count });
  } catch (error) {
    console.error('[onPromoCodeChange] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});