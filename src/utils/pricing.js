// Verifica se é horário noturno (22h às 6h, horário de Brasília)
function isNocturnal() {
  const hour = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false
  });
  const h = parseInt(hour);
  return h >= 22 || h < 6;
}

// Tarifa base por tipo de corrida
const BASE_FARES = {
  standard:   { day: 9.99,  night: 14.99 },
  rotta_roza: { day: 9.99,  night: 14.99 },
  sales:      { day: 25.00, night: 25.00 },
};

// Preço por km dentro da cidade por distância
function getPricePerKm(distanceKm) {
  if (distanceKm <= 3)  return 2.00;
  if (distanceKm <= 10) return 1.80;
  return 1.50;
}

// Cálculo principal para corridas dentro da cidade
export function calculateCityPrice(distanceKm, rideType = 'standard') {
  const nocturnal = isNocturnal();
  const base = BASE_FARES[rideType]?.[nocturnal ? 'night' : 'day'] ?? 9.99;
  const pricePerKm = getPricePerKm(distanceKm);
  const total = base + (distanceKm * pricePerKm);
  return Math.round(total * 100) / 100;
}

// Preços fixos moto táxi (Rotta Roza) para destinos especiais
const FIXED_PRICES_MOTO = {
  'delefrati':       12.00,
  'patio brejeiro':  12.00,
  'brejeiro':        12.00,
  'timboré':         15.00,
  'timboro':         15.00,
  'ponte sem terra': 15.00,
  'sem terra':       15.00,
};

// Preços fixos de entrega para destinos especiais
const FIXED_PRICES_DELIVERY = {
  'timboré':         12.00,
  'timboro':         12.00,
  'brejeiro':        10.00,
  'patio brejeiro':  10.00,
  'delefrati':       10.00,
  'sem terra':       12.00,
  'ponte sem terra': 12.00,
};

// Verifica se o destino bate com algum preço fixo
export function getFixedPrice(dropoffText, type = 'moto') {
  if (!dropoffText) return null;
  const lower = dropoffText.toLowerCase();
  const table = type === 'delivery' ? FIXED_PRICES_DELIVERY : FIXED_PRICES_MOTO;
  for (const [key, value] of Object.entries(table)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

// Desconto de R$2,00 na primeira corrida de moto do usuário
export function applyFirstMotoDiscount(price, isFirstMotoRide) {
  if (!isFirstMotoRide) return price;
  return Math.max(0, Math.round((price - 2.00) * 100) / 100);
}

// Aplicar cupom de desconto
export function applyCoupon(price, couponCode, availableCoupons) {
  const coupon = availableCoupons?.find(
    c => c.code.toUpperCase() === couponCode.toUpperCase() && c.is_active
  );
  if (!coupon) return { price, discount: 0, valid: false };
  const discount = coupon.discount_percentage
    ? price * (coupon.discount_percentage / 100)
    : (coupon.discount_amount ?? 0);
  return {
    price: Math.max(0, Math.round((price - discount) * 100) / 100),
    discount: Math.round(discount * 100) / 100,
    valid: true,
    coupon
  };
}