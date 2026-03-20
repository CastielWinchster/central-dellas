/**
 * Base de dados completa de ruas de Orlândia-SP
 * Inclui coordenadas de pontos reais com números de casas para interpolação.
 *
 * Estrutura de cada rua:
 *  name: nome normalizado da rua
 *  aliases: variações de nome aceitas na busca
 *  neighbourhood: bairro(s) onde passa
 *  anchors: [{num, lat, lon}] — pontos reais com coordenadas confirmadas
 *    (usados para interpolar qualquer número intermediário)
 */

export const ORLANDIA_STREETS = [
  // ─── CENTRO ──────────────────────────────────────────────────────────────
  {
    name: 'Rua Um',
    aliases: ['R. Um', 'R Um'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 16,  lat: -20.7216193, lon: -47.8820926 },
      { num: 29,  lat: -20.7219729, lon: -47.8822274 },
      { num: 250, lat: -20.7217456, lon: -47.8843078 },
      { num: 700, lat: -20.7221767, lon: -47.8884754 },
    ],
  },
  {
    name: 'Rua Dois',
    aliases: ['R. Dois', 'R Dois'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 151, lat: -20.7232757, lon: -47.8829317 },
      { num: 232, lat: -20.7205946, lon: -47.8842859 },
    ],
  },
  {
    name: 'Rua Três',
    aliases: ['R. Três', 'R Tres'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 941, lat: -20.7241413, lon: -47.8908909 },
    ],
  },
  {
    name: 'Rua Quatro',
    aliases: ['R. Quatro', 'R Quatro'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 146, lat: -20.7191537, lon: -47.8837463 },
      { num: 351, lat: -20.7201247, lon: -47.885502  },
      { num: 465, lat: -20.7184382, lon: -47.8759656 },
    ],
  },
  {
    name: 'Rua Cinco',
    aliases: ['R. Cinco', 'R Cinco'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 1630, lat: -20.7248911, lon: -47.8975085 },
    ],
  },
  {
    name: 'Rua Seis',
    aliases: ['R. Seis'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 566, lat: -20.7187531, lon: -47.8878683 },
    ],
  },
  {
    name: 'Rua Sete',
    aliases: ['R. Sete'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 500, lat: -20.7180000, lon: -47.8870000 },
    ],
  },
  {
    name: 'Rua Oito',
    aliases: ['R. Oito'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 141, lat: -20.7114000, lon: -47.8880000 },
      { num: 983, lat: -20.7159378, lon: -47.8706495 },
    ],
  },
  {
    name: 'Rua Nove',
    aliases: ['R. Nove'],
    neighbourhood: 'Jardim Bandeirantes',
    anchors: [
      { num: 818, lat: -20.7265972, lon: -47.8894709 },
    ],
  },
  {
    name: 'Rua Dez',
    aliases: ['R. Dez'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 340, lat: -20.7164961, lon: -47.886166 },
    ],
  },
  {
    name: 'Rua Doze',
    aliases: ['R. Doze'],
    neighbourhood: 'Jardim Santa Rita',
    anchors: [
      { num: 2291, lat: -20.7125107, lon: -47.8583641 },
    ],
  },
  {
    name: 'Rua Treze',
    aliases: ['R. Treze'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 300, lat: -20.7284587, lon: -47.8844581 },
    ],
  },
  {
    name: 'Rua Quatorze',
    aliases: ['R. Quatorze', 'Rua 14'],
    neighbourhood: 'Jardim dos Servidores',
    anchors: [
      { num: 1134, lat: -20.7131153, lon: -47.8700027 },
      { num: 1303, lat: -20.7123104, lon: -47.8672142 },
    ],
  },
  {
    name: 'Rua Dezoito',
    aliases: ['R. Dezoito', 'Rua 18'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 565, lat: -20.7125733, lon: -47.8884233 },
    ],
  },
  {
    name: 'Rua Vinte e Quatro',
    aliases: ['R. Vinte e Quatro', 'Rua 24'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 520, lat: -20.7085859, lon: -47.8882812 },
    ],
  },
  {
    name: 'Rua Vinte e Seis',
    aliases: ['R. Vinte e Seis', 'Rua 26'],
    neighbourhood: '',
    anchors: [
      { num: 1625, lat: -20.7091114, lon: -47.8982014 },
      { num: 1919, lat: -20.7092938, lon: -47.9011724 },
    ],
  },
  {
    name: 'Rua Vinte e Oito',
    aliases: ['R. Vinte e Oito', 'Rua 28'],
    neighbourhood: '',
    anchors: [
      { num: 500, lat: -20.7065479, lon: -47.8862468 },
    ],
  },
  {
    name: 'Rua Trinta',
    aliases: ['R. Trinta', 'Rua 30'],
    neighbourhood: '',
    anchors: [
      { num: 300, lat: -20.7056910, lon: -47.8906487 },
    ],
  },
  // ─── AVENIDAS CENTRO ────────────────────────────────────────────────────
  {
    name: 'Avenida do Café',
    aliases: ['Av. do Café', 'Av do Café', 'Av Café'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 367,  lat: -20.7213485, lon: -47.8819694 },
      { num: 870,  lat: -20.7169716, lon: -47.8869557 },
      { num: 2050, lat: -20.7071698, lon: -47.8829008 },
      { num: 2056, lat: -20.7070946, lon: -47.8829211 },
      { num: 2060, lat: -20.7070158, lon: -47.8829358 },
      { num: 2064, lat: -20.7078064, lon: -47.8827347 },
      { num: 2070, lat: -20.7069253, lon: -47.8829559 },
      { num: 2080, lat: -20.7068595, lon: -47.882971  },
      { num: 2090, lat: -20.7067839, lon: -47.8829843 },
    ],
  },
  {
    name: 'Avenida Dois',
    aliases: ['Av. Dois', 'Av Dois'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 151, lat: -20.7232757, lon: -47.8829317 },
      { num: 151, lat: -20.7234849, lon: -47.8829088 },
      { num: 151, lat: -20.7236755, lon: -47.8828992 },
    ],
  },
  {
    name: 'Avenida Três',
    aliases: ['Av. Três', 'Av Tres', 'Av. Tres'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 874,  lat: -20.7170896, lon: -47.8840421 },
      { num: 1030, lat: -20.7158102, lon: -47.8838713 },
    ],
  },
  {
    name: 'Avenida Quatro',
    aliases: ['Av. Quatro', 'Av Quatro'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 400, lat: -20.7215372, lon: -47.8844584 },
    ],
  },
  {
    name: 'Avenida Cinco',
    aliases: ['Av. Cinco', 'Av Cinco'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 177, lat: -20.7268755, lon: -47.8847623 },
    ],
  },
  {
    name: 'Avenida Seis',
    aliases: ['Av. Seis', 'Av Seis'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 870, lat: -20.7169716, lon: -47.8869557 },
    ],
  },
  {
    name: 'Avenida Sete',
    aliases: ['Av. Sete', 'Av Sete'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 1060, lat: -20.7151060, lon: -47.8881595 },
      { num: 1593, lat: -20.7105439, lon: -47.8890378 },
    ],
  },
  {
    name: 'Avenida Oito',
    aliases: ['Av. Oito', 'Av Oito'],
    neighbourhood: 'Jardim Teixeira',
    anchors: [
      { num: 1199, lat: -20.7140097, lon: -47.8898334 },
      { num: 1600, lat: -20.7088927, lon: -47.8905673 },
    ],
  },
  {
    name: 'Avenida Nove',
    aliases: ['Av. Nove', 'Av Nove'],
    neighbourhood: 'Jardim Bandeirantes',
    anchors: [
      { num: 97,  lat: -20.7262517, lon: -47.8889251 },
      { num: 138, lat: -20.7272424, lon: -47.8915104 },
    ],
  },
  {
    name: 'Avenida Dez',
    aliases: ['Av. Dez', 'Av Dez'],
    neighbourhood: 'Jardim Teixeira',
    anchors: [
      { num: 1464, lat: -20.7116637, lon: -47.891384 },
    ],
  },
  {
    name: 'Avenida Onze',
    aliases: ['Av. Onze', 'Av Onze'],
    neighbourhood: 'Jardim Bandeirantes',
    anchors: [
      { num: 138, lat: -20.7272424, lon: -47.8915104 },
    ],
  },
  // ─── LETRAS ──────────────────────────────────────────────────────────────
  {
    name: 'Avenida A',
    aliases: ['Av. A', 'Av A'],
    neighbourhood: 'Vila Marcussi',
    anchors: [
      { num: 1230, lat: -20.7139823, lon: -47.8808016 },
    ],
  },
  {
    name: 'Avenida B',
    aliases: ['Av. B', 'Av B'],
    neighbourhood: 'Jardim Boa Vista',
    anchors: [
      { num: 500, lat: -20.7180000, lon: -47.8760000 },
    ],
  },
  {
    name: 'Rua B',
    aliases: ['R. B'],
    neighbourhood: '',
    anchors: [
      { num: 100, lat: -20.7040284, lon: -47.8856717 },
    ],
  },
  {
    name: 'Avenida D',
    aliases: ['Av. D', 'Av D'],
    neighbourhood: 'Jardim Boa Vista',
    anchors: [
      { num: 600, lat: -20.7184732, lon: -47.8763768 },
    ],
  },
  {
    name: 'Avenida H',
    aliases: ['Av. H', 'Av H'],
    neighbourhood: 'Jardim Boa Vista',
    anchors: [
      { num: 1394, lat: -20.7109841, lon: -47.8730334 },
    ],
  },
  {
    name: 'Avenida L',
    aliases: ['Av. L', 'Av L', 'Avenida Marginal L'],
    neighbourhood: 'Jardim Formoso',
    anchors: [
      { num: 381, lat: -20.7201969, lon: -47.8709083 },
    ],
  },
  {
    name: 'Avenida M',
    aliases: ['Av. M', 'Av M'],
    neighbourhood: 'Jardim Siena',
    anchors: [
      { num: 980, lat: -20.7146278, lon: -47.8678629 },
    ],
  },
  {
    name: 'Avenida O',
    aliases: ['Av. O', 'Av O'],
    neighbourhood: 'Jardim Siena',
    anchors: [
      { num: 980, lat: -20.7146562, lon: -47.8660404 },
    ],
  },
  {
    name: 'Avenida P',
    aliases: ['Av. P', 'Av P'],
    neighbourhood: 'Jardim Parisi',
    anchors: [
      { num: 234, lat: -20.7210747, lon: -47.8646342 },
    ],
  },
  // ─── AVENIDA T ──────────────────────────────────────────────────────────
  {
    name: 'Avenida T',
    aliases: ['Av. T', 'Av T'],
    neighbourhood: 'Centro',
    anchors: [
      { num: 300, lat: -20.7180000, lon: -47.8820000 },
      { num: 663, lat: -20.7160000, lon: -47.8810000 },
      { num: 900, lat: -20.7145000, lon: -47.8800000 },
    ],
  },
  // ─── MARGINAL ────────────────────────────────────────────────────────────
  {
    name: 'Avenida Marginal Direita',
    aliases: ['Av. Marginal Direita', 'Marginal Direita'],
    neighbourhood: '',
    anchors: [
      { num: 500, lat: -20.7148230, lon: -47.8924929 },
    ],
  },
  // ─── OUTRAS ──────────────────────────────────────────────────────────────
  {
    name: 'Travessa Dezenove',
    aliases: ['Trav. Dezenove', 'Trav Dezenove'],
    neighbourhood: '',
    anchors: [
      { num: 2506, lat: -20.7059211, lon: -47.9016411 },
    ],
  },
  {
    name: 'Rodoanel Amaury Galvão Junqueira',
    aliases: ['Rodoanel', 'Amaury Galvão'],
    neighbourhood: '',
    anchors: [
      { num: 100, lat: -20.7012438, lon: -47.8864027 },
    ],
  },
  {
    name: 'Avenida Marginal Esquerda',
    aliases: ['Av. Marginal Esquerda', 'Marginal Esquerda'],
    neighbourhood: '',
    anchors: [
      { num: 500, lat: -20.7060000, lon: -47.8920000 },
    ],
  },
];

// ─── BAIRROS ────────────────────────────────────────────────────────────────
export const ORLANDIA_NEIGHBOURHOODS = [
  { name: 'Centro',                   lat: -20.7200000, lon: -47.8845000 },
  { name: 'Jardim Bandeirantes',       lat: -20.7270000, lon: -47.8900000 },
  { name: 'Jardim Boa Vista',          lat: -20.7180000, lon: -47.8760000 },
  { name: 'Jardim dos Servidores',     lat: -20.7130000, lon: -47.8700000 },
  { name: 'Jardim Formoso',            lat: -20.7200000, lon: -47.8710000 },
  { name: 'Jardim Nova Orlândia',      lat: -20.7250000, lon: -47.8975000 },
  { name: 'Jardim Parisi',             lat: -20.7210000, lon: -47.8645000 },
  { name: 'Jardim Santa Rita',         lat: -20.7125000, lon: -47.8585000 },
  { name: 'Jardim Siena',              lat: -20.7140000, lon: -47.8675000 },
  { name: 'Jardim Teixeira',           lat: -20.7095000, lon: -47.8880000 },
  { name: 'Vila Marcussi',             lat: -20.7140000, lon: -47.8808000 },
  { name: 'Jardim São Paulo',          lat: -20.7155000, lon: -47.8950000 },
  { name: 'Jardim América',            lat: -20.7230000, lon: -47.8780000 },
  { name: 'Vila Nova',                 lat: -20.7075000, lon: -47.9000000 },
  { name: 'Residencial das Acácias',   lat: -20.7050000, lon: -47.8850000 },
];

// ─── NORMALIZAÇÃO ─────────────────────────────────────────────────────────
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── INTERPOLAÇÃO BILINEAR ────────────────────────────────────────────────
/**
 * Dado um número de casa e os anchors da rua, interpola lat/lon
 */
function interpolateAddress(anchors, houseNum) {
  if (!anchors || anchors.length === 0) return null;
  if (anchors.length === 1) return { lat: anchors[0].lat, lon: anchors[0].lon };

  const sorted = [...anchors].sort((a, b) => a.num - b.num);
  const num = parseInt(houseNum, 10);
  if (isNaN(num)) return { lat: sorted[0].lat, lon: sorted[0].lon };

  // Fora do intervalo: clampar ao extremo mais próximo
  if (num <= sorted[0].num) return { lat: sorted[0].lat, lon: sorted[0].lon };
  if (num >= sorted[sorted.length - 1].num) {
    const last = sorted[sorted.length - 1];
    return { lat: last.lat, lon: last.lon };
  }

  // Encontrar segmento
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (num >= a.num && num <= b.num) {
      const t = (num - a.num) / (b.num - a.num);
      return {
        lat: a.lat + t * (b.lat - a.lat),
        lon: a.lon + t * (b.lon - a.lon),
      };
    }
  }

  return { lat: sorted[0].lat, lon: sorted[0].lon };
}

// ─── PARSE DE QUERY ─────────────────────────────────────────────────────
/**
 * Separa "Avenida T, 663" → { streetQuery: "Avenida T", houseNum: "663" }
 */
export function parseStreetQuery(text) {
  if (!text) return { streetQuery: text, houseNum: null };

  // Remove "nº", "n°", "número"
  let cleaned = text.replace(/n[º°ª]?\.?\s*/gi, '').replace(/num(ero)?\.?\s*/gi, '');

  // Tenta separar por vírgula: "Rua X, 123"
  const byComma = cleaned.split(',');
  if (byComma.length >= 2) {
    const possibleNum = byComma[byComma.length - 1].trim();
    const match = possibleNum.match(/^(\d+[a-zA-Z]?)$/);
    if (match) {
      return {
        streetQuery: byComma.slice(0, byComma.length - 1).join(',').trim(),
        houseNum: match[1],
      };
    }
  }

  // Tenta número no final: "Rua X 663"
  const match = cleaned.match(/^(.+?)\s+(\d{1,5}[a-zA-Z]?)$/);
  if (match) {
    return { streetQuery: match[1].trim(), houseNum: match[2] };
  }

  return { streetQuery: cleaned.trim(), houseNum: null };
}

// ─── BUSCA DE RUAS ────────────────────────────────────────────────────────
/**
 * Busca ruas por nome e retorna resultados com coordenada interpolada
 */
export function searchStreets(query) {
  if (!query || query.length < 2) return [];

  const { streetQuery, houseNum } = parseStreetQuery(query);
  const q = normalize(streetQuery);
  const tokens = q.split(/\s+/).filter(t => t.length >= 1);

  const matches = ORLANDIA_STREETS.filter(street => {
    const names = [street.name, ...(street.aliases || [])].map(normalize);
    return names.some(n => tokens.every(token => n.includes(token)));
  });

  return matches.slice(0, 6).map(street => {
    const coord = houseNum
      ? interpolateAddress(street.anchors, houseNum)
      : { lat: street.anchors[0]?.lat, lon: street.anchors[0]?.lon };

    const displayNum = houseNum ? `, ${houseNum}` : '';
    const displayCity = 'Orlândia, SP';

    return {
      id: `street-${normalize(street.name).replace(/\s+/g, '-')}${houseNum ? `-${houseNum}` : ''}`,
      name: `${street.name}${displayNum}`,
      street: street.name,
      housenumber: houseNum || '',
      city: displayCity,
      neighbourhood: street.neighbourhood,
      lat: coord?.lat,
      lon: coord?.lon,
      category: 'address',
      icon: '🏠',
      categoryLabel: houseNum ? 'Endereço' : 'Rua',
      isLocalPOI: true,
      distance: 0,
    };
  });
}

// ─── BUSCA DE BAIRROS ─────────────────────────────────────────────────────
export function searchNeighbourhoods(query) {
  if (!query || query.length < 2) return [];
  const q = normalize(query);

  return ORLANDIA_NEIGHBOURHOODS
    .filter(n => normalize(n.name).includes(q))
    .slice(0, 3)
    .map(n => ({
      id: `bairro-${normalize(n.name).replace(/\s+/g, '-')}`,
      name: `${n.name} — Orlândia, SP`,
      street: '',
      housenumber: '',
      city: 'Orlândia, SP',
      neighbourhood: n.name,
      lat: n.lat,
      lon: n.lon,
      category: 'neighborhood',
      icon: '🏘️',
      categoryLabel: 'Bairro',
      isLocalPOI: true,
      distance: 0,
    }));
}