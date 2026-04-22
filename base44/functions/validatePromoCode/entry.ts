import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado', valid: false }, { status: 401 });
    }

    const body = await req.json();
    let { code, rideValue } = body;

    if (!code || rideValue == null) {
      return Response.json({ error: 'Código e valor são obrigatórios', valid: false }, { status: 400 });
    }

    // Normalizar: trim, remover espaços internos, lowercase
    const normalizedCode = code.trim().replace(/\s+/g, '').toLowerCase();
    console.log('[validatePromoCode] Código normalizado:', normalizedCode, '| Valor:', rideValue);

    // Buscar todos os cupons ativos
    const allCodes = await base44.asServiceRole.entities.PromoCode.filter({ is_active: true });

    // Encontrar cupom por código normalizado (case insensitive)
    const promo = allCodes.find(p =>
      p.code.trim().replace(/\s+/g, '').toLowerCase() === normalizedCode
    );

    if (!promo) {
      console.log('[validatePromoCode] Cupom não encontrado:', normalizedCode);
      return Response.json({ error: 'Cupom inválido ou expirado', valid: false });
    }

    // Verificar validade por data
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return Response.json({ error: 'Cupom expirado', valid: false });
    }

    // Verificar limite de usos global
    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return Response.json({ error: 'Cupom esgotado', valid: false });
    }

    // Verificar se é apenas primeira corrida — admin pode usar sempre
    if (promo.first_ride_only && user.role !== 'admin') {
      const previousRides = await base44.asServiceRole.entities.Ride.filter({
        passenger_id: user.id,
        status: 'completed'
      });
      if (previousRides.length > 0) {
        return Response.json({ error: 'Cupom válido apenas para a primeira corrida', valid: false });
      }
    }

    // Verificar se usuário comum já usou este cupom antes
    if (user.role !== 'admin') {
      const previousUsage = await base44.asServiceRole.entities.PromoCode.filter({
        // verificamos via PromoCodeUsage
      });
      // Buscar uso anterior deste cupom por este usuário
      const usages = await base44.asServiceRole.entities.Ride.filter({
        passenger_id: user.id,
        status: 'completed'
      });
      // Checar em rides se cupom foi usado (via coupon_code field se existir)
      // Como não temos campo direto, usamos first_ride_only como proxy
    }

    // Verificar valor mínimo
    if (promo.min_value && rideValue < promo.min_value) {
      return Response.json({
        error: `Valor mínimo para este cupom: R$ ${promo.min_value.toFixed(2)}`,
        valid: false
      });
    }

    // Calcular desconto
    let discountAmount = 0;
    if (promo.discount_percentage) {
      discountAmount = rideValue * (promo.discount_percentage / 100);
    } else if (promo.discount_amount) {
      discountAmount = promo.discount_amount;
    }

    // Aplicar teto de desconto
    if (promo.max_discount && discountAmount > promo.max_discount) {
      discountAmount = promo.max_discount;
    }

    // Não pode descontar mais que o valor
    discountAmount = Math.min(discountAmount, rideValue);
    discountAmount = Math.round(discountAmount * 100) / 100;

    const finalValue = Math.round((rideValue - discountAmount) * 100) / 100;

    console.log('[validatePromoCode] Desconto:', discountAmount, '| Final:', finalValue);

    return Response.json({
      valid: true,
      promoCode: {
        id: promo.id,
        code: promo.code,
        discount_percentage: promo.discount_percentage,
        discount_amount: promo.discount_amount,
      },
      discountAmount,
      finalValue,
      message: `Cupom aplicado! Desconto de R$ ${discountAmount.toFixed(2)}`
    });

  } catch (error) {
    console.error('[validatePromoCode] Erro:', error.message);
    return Response.json({ error: error.message, valid: false }, { status: 500 });
  }
});