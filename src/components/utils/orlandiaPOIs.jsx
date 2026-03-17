// Locais de referência de Orlândia — dados offline com coordenadas precisas
// Fonte: OpenStreetMap / mapeamento local
// Última atualização: 2026-03

const AMENITY_ICON = {
  bank: '🏦',
  bus_station: '🚌',
  cafe: '☕',
  cinema: '🎬',
  clinic: '⚕️',
  college: '🎓',
  convenience: '🏪',
  fuel: '⛽',
  hospital: '🏥',
  kindergarten: '🧒',
  library: '📚',
  pharmacy: '💊',
  place_of_worship: '⛪',
  post_office: '📮',
  restaurant: '🍽️',
  school: '🏫',
  supermarket: '🛒',
  townhall: '🏛️',
};

const AMENITY_LABEL = {
  bank: 'Banco',
  bus_station: 'Terminal',
  cafe: 'Café',
  cinema: 'Cinema',
  clinic: 'Clínica',
  college: 'Faculdade/Técnico',
  convenience: 'Conveniência',
  fuel: 'Posto',
  hospital: 'Hospital',
  kindergarten: 'Escola Infantil',
  library: 'Biblioteca',
  pharmacy: 'Farmácia',
  place_of_worship: 'Igreja',
  post_office: 'Correios',
  restaurant: 'Restaurante',
  school: 'Escola',
  supermarket: 'Supermercado',
  townhall: 'Prefeitura',
};

export const ORLANDIA_POIS = [
  { name: 'Banco do Brasil', amenity: 'bank', lat: -20.7205946, lon: -47.8842859, street: 'Rua Dois', housenumber: '232', neighbourhood: 'Centro' },
  { name: 'Bradesco', amenity: 'bank', lat: -20.7209893, lon: -47.8830969, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Itaú', amenity: 'bank', lat: -20.7205744, lon: -47.883244, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Santander', amenity: 'bank', lat: -20.7200587, lon: -47.8836568, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Terminal Rodoviário', amenity: 'bus_station', lat: -20.7268755, lon: -47.8847623, street: 'Avenida Cinco', housenumber: '177', neighbourhood: '' },
  { name: 'Sorveteria Ki-Delícia', amenity: 'cafe', lat: -20.7221746, lon: -47.8842493, street: '', housenumber: '', neighbourhood: '' },
  { name: 'CineOrlândia', amenity: 'cinema', lat: -20.7200548, lon: -47.8814321, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Unidade Básica de Saúde II "José Marchi"', amenity: 'clinic', lat: -20.7094711, lon: -47.900332, street: '', housenumber: '', neighbourhood: '' },
  { name: 'ETEC Prof. Alcídio de Souza Prado', amenity: 'college', lat: -20.7152498, lon: -47.8909389, street: '', housenumber: '', neighbourhood: '' },
  { name: 'BOX Conveniência', amenity: 'convenience', lat: -20.7202036, lon: -47.8856378, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Ipê Armazém', amenity: 'convenience', lat: -20.7110714, lon: -47.88317, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Posto A. Alves', amenity: 'fuel', lat: -20.7201517, lon: -47.8858121, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Posto Compre Bem', amenity: 'fuel', lat: -20.7043556, lon: -47.891594, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Posto Ipê', amenity: 'fuel', lat: -20.7110638, lon: -47.8830339, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Posto Shell', amenity: 'fuel', lat: -20.7221767, lon: -47.8884754, street: 'Rua Um', housenumber: '700', neighbourhood: 'Centro' },
  { name: 'Posto São José', amenity: 'fuel', lat: -20.6975457, lon: -47.8923292, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Hospital Beneficente Santo Antônio', amenity: 'hospital', lat: -20.7241413, lon: -47.8908909, street: 'Rua Três', housenumber: '941', neighbourhood: 'Centro' },
  { name: 'São Francisco Saúde', amenity: 'hospital', lat: -20.7125733, lon: -47.8884233, street: 'Rua Dezoito', housenumber: '565', neighbourhood: 'Centro' },
  { name: 'EMEB Paulo Bimbo Gomes', amenity: 'kindergarten', lat: -20.7085859, lon: -47.8882812, street: 'Rua Vinte e Quatro', housenumber: '520', neighbourhood: '' },
  { name: 'Biblioteca Municipal', amenity: 'library', lat: -20.7206006, lon: -47.8815731, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Farmácia Flor de Lis', amenity: 'pharmacy', lat: -20.7217634, lon: -47.8845695, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Farmácia Municipal Bolivar Berti', amenity: 'pharmacy', lat: -20.7219729, lon: -47.8822274, street: 'Rua Um', housenumber: '29', neighbourhood: 'Centro' },
  { name: 'Farmácia e Ótica Unimed Alta Mogiana', amenity: 'pharmacy', lat: -20.7196735, lon: -47.8910745, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Capela Mãe Rainha', amenity: 'place_of_worship', lat: -20.7055124, lon: -47.8835613, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Igreja Adventista do Sétimo Dia', amenity: 'place_of_worship', lat: -20.7139823, lon: -47.8808016, street: 'Avenida A', housenumber: '1230', neighbourhood: 'Vila Marcussi' },
  { name: 'Igreja Batista', amenity: 'place_of_worship', lat: -20.7152408, lon: -47.8900864, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Igreja Catedral Avivamento', amenity: 'place_of_worship', lat: -20.7083162, lon: -47.8954239, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Igreja Católica', amenity: 'place_of_worship', lat: -20.7080522, lon: -47.8937288, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Igreja Católica (Vila Nova)', amenity: 'place_of_worship', lat: -20.7075549, lon: -47.9000432, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Igreja Cristo Rei', amenity: 'place_of_worship', lat: -20.7205888, lon: -47.8751094, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Igreja Deus É Amor', amenity: 'place_of_worship', lat: -20.7082313, lon: -47.8945643, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Igreja Evangélica Assembléia de Deus', amenity: 'place_of_worship', lat: -20.7078139, lon: -47.9025128, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Igreja Matriz São José', amenity: 'place_of_worship', lat: -20.7206389, lon: -47.8874787, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Igreja Santa Genoveva', amenity: 'place_of_worship', lat: -20.7215181, lon: -47.8854666, street: '', housenumber: '', neighbourhood: '' },
  { name: 'SEARA', amenity: 'place_of_worship', lat: -20.7084283, lon: -47.8862205, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Correios', amenity: 'post_office', lat: -20.7201247, lon: -47.885502, street: 'Rua Quatro', housenumber: '351', neighbourhood: 'Centro' },
  { name: 'Restaurante Papai Salim', amenity: 'restaurant', lat: -20.7217456, lon: -47.8843078, street: 'Rua Um', housenumber: '250', neighbourhood: 'Centro' },
  { name: 'Tanaka San', amenity: 'restaurant', lat: -20.7265972, lon: -47.8894709, street: 'Rua Nove', housenumber: '818', neighbourhood: 'Jardim Bandeirantes' },
  { name: 'CAEC - Centro de Atividades de Educação Complementar', amenity: 'school', lat: -20.7127791, lon: -47.8704886, street: 'Rua Quatorze', housenumber: '', neighbourhood: 'Jardim dos Servidores' },
  { name: 'CEO-Anglo Unidade II', amenity: 'school', lat: -20.7170896, lon: -47.8840421, street: 'Avenida Três', housenumber: '874', neighbourhood: 'Centro' },
  { name: 'Colégio Albert Einstein', amenity: 'school', lat: -20.7140097, lon: -47.8898334, street: 'Avenida Oito', housenumber: '1199', neighbourhood: 'Centro' },
  { name: 'Colégio Anglo', amenity: 'school', lat: -20.7200036, lon: -47.8844335, street: '', housenumber: '', neighbourhood: '' },
  { name: 'EE Oswaldo Ribeiro Junqueira', amenity: 'school', lat: -20.7158102, lon: -47.8838713, street: 'Avenida Três', housenumber: '1030', neighbourhood: 'Centro' },
  { name: 'EMEB Arthur Oliva', amenity: 'school', lat: -20.7184732, lon: -47.8763768, street: 'Avenida D', housenumber: '600', neighbourhood: 'Jardim Boa Vista' },
  { name: 'EMEB Coronel Francisco Orlando', amenity: 'school', lat: -20.7191537, lon: -47.8837463, street: 'Rua Quatro', housenumber: '146', neighbourhood: '' },
  { name: 'EMEB Dr. Arlindo Morandini', amenity: 'school', lat: -20.7131153, lon: -47.8700027, street: 'Rua Quatorze', housenumber: '1134A', neighbourhood: 'Jardim Siena' },
  { name: 'EMEB Enfermeira Maria Magdalena Brasil', amenity: 'school', lat: -20.7184382, lon: -47.8759656, street: 'Rua Quatro', housenumber: '465A', neighbourhood: 'Jardim Boa Vista' },
  { name: 'EMEB Fernanda da Silva Fonseca', amenity: 'school', lat: -20.7201969, lon: -47.8709083, street: 'Avenida Marginal L', housenumber: '381', neighbourhood: 'Jardim Formoso' },
  { name: 'EMEB Francisco Salles de Abreu Sampaio', amenity: 'school', lat: -20.7169716, lon: -47.8869557, street: 'Avenida Seis', housenumber: '870', neighbourhood: 'Centro' },
  { name: 'EMEB Izolina Zancopé Munari', amenity: 'school', lat: -20.7092938, lon: -47.9011724, street: 'Rua Vinte e Seis', housenumber: '1919', neighbourhood: '' },
  { name: 'EMEB Maurício Leite de Moraes', amenity: 'school', lat: -20.7091114, lon: -47.8982014, street: 'Rua Vinte e Seis', housenumber: '1625', neighbourhood: '' },
  { name: 'EMEB Odette Leite de Moraes', amenity: 'school', lat: -20.7109841, lon: -47.8730334, street: 'Avenida H', housenumber: '1394', neighbourhood: 'Jardim Boa Vista' },
  { name: 'EMEB Pedro Bordignon Neto', amenity: 'school', lat: -20.7272424, lon: -47.8915104, street: 'Avenida Onze', housenumber: '138A', neighbourhood: 'Jardim Bandeirantes' },
  { name: 'EMEB Prof. Celestino Sarti', amenity: 'school', lat: -20.7210747, lon: -47.8646342, street: 'Avenida P', housenumber: '234', neighbourhood: 'Jardim Parisi' },
  { name: 'EMEB Prof.ª Alcinea Gouveia de Freitas', amenity: 'school', lat: -20.7059211, lon: -47.9016411, street: 'Travessa Dezenove', housenumber: '2506', neighbourhood: '' },
  { name: 'EMEB Prof.ª Elaine Maria Alves Silveira', amenity: 'school', lat: -20.7146562, lon: -47.8660404, street: 'Avenida O', housenumber: '980', neighbourhood: 'Jardim Siena' },
  { name: 'EMEB Prof.ª Iracema Miele', amenity: 'school', lat: -20.7166976, lon: -47.8918089, street: '', housenumber: '', neighbourhood: '' },
  { name: 'EMEB Prof.ª Irma Miranda Mello', amenity: 'school', lat: -20.7166552, lon: -47.8913596, street: '', housenumber: '', neighbourhood: '' },
  { name: 'EMEB Prof.ª Maria Aparecida de Melo e Souza', amenity: 'school', lat: -20.7146278, lon: -47.8678629, street: 'Avenida M', housenumber: '980', neighbourhood: 'Jadim Siena' },
  { name: 'EMEB Prof.ª Maria Lúcia Berti', amenity: 'school', lat: -20.7248911, lon: -47.8975085, street: 'Rua Cinco', housenumber: '1630', neighbourhood: 'Jardim Nova Orlândia' },
  { name: 'EMEB Prof.ª Sylvia Ferreira Jorge Schaffer', amenity: 'school', lat: -20.7125107, lon: -47.8583641, street: 'Rua Doze', housenumber: '2291A', neighbourhood: 'Jardim Santa Rita' },
  { name: 'EMEB Prof.ª Victória Olivito Nonino', amenity: 'school', lat: -20.7123104, lon: -47.8672142, street: 'Rua Quatorze', housenumber: '1303A', neighbourhood: 'Jardim Siena' },
  { name: 'EMEB Santo Garbin', amenity: 'school', lat: -20.706996, lon: -47.9004132, street: 'Avenida Dezenove', housenumber: '2276', neighbourhood: '' },
  { name: '1A99', amenity: 'supermarket', lat: -20.7206705, lon: -47.8854937, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Compre Bem Supermercado', amenity: 'supermarket', lat: -20.7039391, lon: -47.8912441, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Econômico Supermercados', amenity: 'supermarket', lat: -20.715106, lon: -47.8881595, street: 'Avenida Sete', housenumber: '1060', neighbourhood: 'Centro' },
  { name: 'Econômico Supermercados (2)', amenity: 'supermarket', lat: -20.7171929, lon: -47.8884245, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Econômico Supermercados - Loja 2', amenity: 'supermarket', lat: -20.7215372, lon: -47.8844584, street: 'Avenida Quatro', housenumber: '', neighbourhood: '' },
  { name: 'Paulista Supermercado', amenity: 'supermarket', lat: -20.7195932, lon: -47.8832674, street: 'Rua Quatro', housenumber: '', neighbourhood: '' },
  { name: 'Paulista Supermercado (2)', amenity: 'supermarket', lat: -20.7191778, lon: -47.8832958, street: 'Rua Quatro', housenumber: '', neighbourhood: '' },
  { name: 'Ponto Certo Supermercado', amenity: 'supermarket', lat: -20.7141099, lon: -47.8809517, street: '', housenumber: '', neighbourhood: '' },
  { name: 'Supermercados Mialich', amenity: 'supermarket', lat: -20.7159378, lon: -47.8706495, street: 'Rua Oito', housenumber: '983A', neighbourhood: 'Jardim Siena' },
  { name: 'Prefeitura Municipal de Orlândia', amenity: 'townhall', lat: -20.7196201, lon: -47.8847476, street: '', housenumber: '', neighbourhood: '' },
].map(poi => ({
  ...poi,
  id: `poi-orlandia-${poi.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
  icon: AMENITY_ICON[poi.amenity] || '📍',
  categoryLabel: AMENITY_LABEL[poi.amenity] || 'Local',
  isLocalPOI: true,
}));

// Normaliza texto para busca sem acentos
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Busca nos POIs locais por texto
export function searchLocalPOIs(query) {
  if (!query || query.length < 2) return [];

  const q = normalize(query);
  const tokens = q.split(/\s+/).filter(t => t.length >= 2);

  return ORLANDIA_POIS
    .filter(poi => {
      const haystack = normalize(
        `${poi.name} ${poi.amenity} ${poi.categoryLabel} ${poi.street} ${poi.neighbourhood}`
      );
      return tokens.every(token => haystack.includes(token));
    })
    .slice(0, 6);
}