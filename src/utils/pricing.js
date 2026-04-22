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
  rotta_roza: { day: 10.00, night: 10.00 }, // fixo R$10 dentro da cidade
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
  // Rotta Roza tem preço fixo de R$10,00 dentro da cidade
  if (rideType === 'rotta_roza') return 10.00;

  const nocturnal = isNocturnal();
  const base = BASE_FARES[rideType]?.[nocturnal ? 'night' : 'day'] ?? 9.99;
  const pricePerKm = getPricePerKm(distanceKm);
  const total = base + (distanceKm * pricePerKm);
  return Math.round(total * 100) / 100;
}

// Preços fixos moto táxi (Rotta Roza) para destinos especiais
const FIXED_PRICES_MOTO = {
  'delefratti':      12.00,
  'delefrati':       12.00,
  'pátio brejeiro':  12.00,
  'patio brejeiro':  12.00,
  'brejeiro':        10.00, // brejeiro = preço base
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

// ── TARIFAS INTERMUNICIPAIS ─────────────────────────────────────────────────

// Tabela de tarifas por distância entre cidades
const INTERCITY_FARES = [
  { min: 10, max: 15, base: 30.00 },
  { min: 15, max: 20, base: 60.00 },
  { min: 20, max: 25, base: 70.00 },
  { min: 25, max: 30, base: 75.00 },
  { min: 30, max: 35, base: 80.00 },
];

const INTERCITY_KM_RATE = 3.00; // R$/km dentro da cidade destino

/**
 * Calcula preço de corridas intermunicipais (saindo de Orlândia)
 * @returns {number|null} Preço total ou null se distância >= 35km (bloqueado)
 */
export function calculateIntercityPrice(distanceBetweenCities, distanceInDestinationCity) {
  console.log('[Pricing] Intermunicipal:', { distanceBetweenCities, distanceInDestinationCity });

  const tier = INTERCITY_FARES.find(t => distanceBetweenCities >= t.min && distanceBetweenCities < t.max);

  if (!tier) {
    // < 10km = corrida urbana / >= 35km = bloqueado
    return null;
  }

  const destinationFare = distanceInDestinationCity * INTERCITY_KM_RATE;
  const total = tier.base + destinationFare;

  console.log('[Pricing] Base:', tier.base, '+ dest fare:', destinationFare, '= total:', total);
  return Math.round(total * 100) / 100;
}

/**
 * Verifica se uma corrida é intermunicipal (sai de Orlândia para outra cidade)
 */
export function isIntercityRide(pickupCity, dropoffCity) {
  if (!pickupCity || !dropoffCity) return false;
  const origin = pickupCity.toLowerCase().trim();
  const destination = dropoffCity.toLowerCase().trim();
  const isOriginOrlandia = origin.includes('orlândia') || origin.includes('orlandia');
  return isOriginOrlandia && !destination.includes('orlândia') && !destination.includes('orlandia');
}

/**
 * Extrai cidade de um endereço completo com múltiplas estratégias
 */
export function extractCityFromAddress(address) {
  if (!address) return '';

  // Estratégia 1: cidades conhecidas da região
  const knownCities = [
    'Orlândia', 'Orlandia', 'Sales Oliveira', 'Ribeirão Preto', 'Ribeirao Preto',
    'Morro Agudo', 'São Joaquim da Barra', 'Sao Joaquim da Barra', 'Guará', 'Guara',
    'Altinópolis', 'Altinopolis', 'Batatais', 'Ituverava', 'Aramina', 'Brodowski',
  ];
  for (const city of knownCities) {
    if (new RegExp(city, 'i').test(address)) return city;
  }

  // Estratégia 2: penúltimo segmento antes de UF
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2].replace(/\d+/g, '').replace(/[-]/g, '').trim();
    if (candidate.length > 2) return candidate;
  }

  return '';
}

/**
 * Obtém cidade via geocodificação reversa usando o token Mapbox já carregado
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>}
 */
export async function getCityFromCoordinates(lat, lng) {
  try {
    // Importar dinamicamente para evitar dependência circular
    const { MAPBOX_CONFIG } = await import('@/components/utils/mapboxConfig');
    const token = MAPBOX_CONFIG.ACCESS_TOKEN;
    if (!token) {
      console.warn('[getCityFromCoordinates] Token Mapbox não carregado');
      return '';
    }
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=place&language=pt&limit=1`
    );
    const data = await res.json();
    const city = data.features?.[0]?.text || '';
    console.log(`[getCityFromCoordinates] (${lat},${lng}) → "${city}"`);
    return city;
  } catch (e) {
    console.error('[getCityFromCoordinates]', e);
    return '';
  }
}

// ── CUPOM ───────────────────────────────────────────────────────────────────

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