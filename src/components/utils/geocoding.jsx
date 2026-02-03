// Sistema híbrido de geocoding para apps de mobilidade
// Photon (POIs) + Nominatim (números e reverse)

const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// ========================================
// 1) PARSER ROBUSTO DO INPUT
// ========================================
export function parseQuery(text) {
  if (!text || text.trim().length === 0) {
    return { placeQuery: '', houseNumber: null };
  }
  
  // Normalizar
  let normalized = text
    .replace(/\s+/g, ' ')
    .replace(/,+/g, ',')
    .replace(/n[°ºª]?\s*/gi, '')
    .replace(/num(ero)?\.?\s*/gi, '')
    .trim();
  
  // Separar por vírgula ou espaço
  const parts = normalized.split(/[,\s]+/);
  
  // Procurar último token numérico (1-6 dígitos + letra opcional)
  let houseNumber = null;
  let placeTokens = [...parts];
  
  for (let i = parts.length - 1; i >= 0; i--) {
    const token = parts[i];
    const match = token.match(/^(\d{1,6})([A-Za-z]?)$/);
    
    if (match) {
      // Verificar se não faz parte do nome da rua (ex: "Rua 3", "Avenida T-4")
      const prevToken = parts[i - 1]?.toLowerCase() || '';
      const isPartOfRoadName = /^(rua|avenida|av|r|travessa|trav|alameda|al|viela|estrada)$/.test(prevToken);
      
      if (!isPartOfRoadName) {
        houseNumber = match[1] + (match[2] || '');
        placeTokens.splice(i, 1);
        break;
      }
    }
  }
  
  const placeQuery = placeTokens.join(' ');
  
  return { placeQuery, houseNumber };
}

// ========================================
// 2) HAVERSINE DISTANCE
// ========================================
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ========================================
// 3) PHOTON SEARCH (POIs e Lugares)
// ========================================
async function searchPhoton(placeQuery, userLat, userLon, signal) {
  const cacheKey = `photon:${placeQuery}:${userLat}:${userLon}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const params = new URLSearchParams({
    q: placeQuery,
    limit: 8,
    lang: 'pt'
  });
  
  if (userLat && userLon) {
    params.append('lat', userLat);
    params.append('lon', userLon);
  }
  
  const response = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
  const data = await response.json();
  
  const results = (data.features || []).map(feature => ({
    type: 'photon',
    id: `${feature.properties.osm_type}-${feature.properties.osm_id}`,
    lat: feature.geometry.coordinates[1],
    lon: feature.geometry.coordinates[0],
    name: feature.properties.name || feature.properties.street || '',
    street: feature.properties.street || '',
    housenumber: feature.properties.housenumber || '',
    city: feature.properties.city || feature.properties.town || feature.properties.village || '',
    state: feature.properties.state || '',
    country: feature.properties.country || '',
    category: feature.properties.osm_value || feature.properties.type || 'place',
    raw: feature.properties
  }));
  
  cache.set(cacheKey, { data: results, timestamp: Date.now() });
  return results;
}

// ========================================
// 4) NOMINATIM SEARCH (Números de Casa)
// ========================================
async function searchNominatim(placeQuery, houseNumber, userLat, userLon, signal) {
  const cacheKey = `nominatim:${placeQuery}:${houseNumber}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const query = houseNumber 
    ? `${placeQuery}, ${houseNumber}, Brasil`
    : `${placeQuery}, Brasil`;
  
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: 1,
    limit: 5,
    countrycodes: 'br',
    'accept-language': 'pt-BR'
  });
  
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { signal }
  );
  const data = await response.json();
  
  const results = data.map(item => ({
    type: 'nominatim',
    id: `nom-${item.place_id}`,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    name: item.display_name.split(',')[0],
    street: item.address?.road || '',
    housenumber: item.address?.house_number || houseNumber,
    city: item.address?.city || item.address?.town || item.address?.village || '',
    state: item.address?.state || '',
    country: item.address?.country || '',
    category: item.type || 'address',
    raw: item.address,
    userProvidedNumber: houseNumber
  }));
  
  cache.set(cacheKey, { data: results, timestamp: Date.now() });
  return results;
}

// ========================================
// 5) CATEGORIZAÇÃO E ÍCONES
// ========================================
export function getCategoryIcon(category) {
  const categoryMap = {
    // POIs
    'restaurant': '🍴',
    'cafe': '☕',
    'bar': '🍺',
    'fast_food': '🍔',
    'pub': '🍻',
    
    // Comércio
    'shop': '🛒',
    'supermarket': '🛒',
    'mall': '🏬',
    'convenience': '🏪',
    'market': '🛍️',
    
    // Saúde
    'hospital': '🏥',
    'clinic': '⚕️',
    'pharmacy': '💊',
    'doctors': '🩺',
    
    // Educação
    'school': '🎓',
    'university': '🎓',
    'college': '🏫',
    
    // Serviços
    'bank': '🏦',
    'atm': '💰',
    'post_office': '📮',
    'fuel': '⛽',
    'parking': '🅿️',
    
    // Lazer
    'cinema': '🎬',
    'theatre': '🎭',
    'park': '🌳',
    'stadium': '🏟️',
    
    // Transporte
    'bus_stop': '🚌',
    'airport': '✈️',
    'station': '🚉',
    
    // Endereços
    'house': '🏠',
    'building': '🏢',
    'address': '📍',
    'road': '🛣️',
    'highway': '🛣️',
    'street': '🛣️',
    
    // Cidade
    'city': '🏙️',
    'town': '🏘️',
    'village': '🏡',
    
    // Religião
    'church': '⛪',
    'temple': '🕌',
    
    // Default
    'place': '📍'
  };
  
  return categoryMap[category?.toLowerCase()] || '📍';
}

export function getCategoryLabel(category) {
  const labelMap = {
    'restaurant': 'Restaurante',
    'cafe': 'Café',
    'bar': 'Bar',
    'shop': 'Loja',
    'supermarket': 'Mercado',
    'hospital': 'Hospital',
    'school': 'Escola',
    'bank': 'Banco',
    'park': 'Parque',
    'fuel': 'Posto',
    'address': 'Endereço',
    'road': 'Via',
    'city': 'Cidade'
  };
  
  return labelMap[category?.toLowerCase()] || 'Local';
}

// ========================================
// 6) BUSCA HÍBRIDA PRINCIPAL
// ========================================
export async function searchPlaces(text, userLocation, signal) {
  if (!text || text.length < 3) return [];
  
  const { placeQuery, houseNumber } = parseQuery(text);
  
  if (!placeQuery) return [];
  
  const userLat = userLocation?.lat;
  const userLon = userLocation?.lng;
  
  try {
    // Executar buscas em paralelo
    const [photonResults, nominatimResults] = await Promise.all([
      searchPhoton(placeQuery, userLat, userLon, signal).catch(() => []),
      houseNumber 
        ? searchNominatim(placeQuery, houseNumber, userLat, userLon, signal).catch(() => [])
        : Promise.resolve([])
    ]);
    
    // Combinar resultados
    let combined = [];
    
    // 1) Nominatim com número primeiro (se houver)
    if (nominatimResults.length > 0) {
      combined.push(...nominatimResults.map(r => ({
        ...r,
        priority: 1,
        distance: userLat && userLon ? haversineDistance(userLat, userLon, r.lat, r.lon) : 999
      })));
    }
    
    // 2) Photon POIs e lugares
    combined.push(...photonResults.map(r => ({
      ...r,
      priority: r.name ? 2 : 3, // POIs com nome têm prioridade sobre ruas
      distance: userLat && userLon ? haversineDistance(userLat, userLon, r.lat, r.lon) : 999
    })));
    
    // Filtrar duplicatas por coordenadas próximas (< 50m)
    const unique = [];
    for (const item of combined) {
      const isDuplicate = unique.some(existing => 
        haversineDistance(existing.lat, existing.lon, item.lat, item.lon) < 0.05
      );
      if (!isDuplicate) {
        unique.push(item);
      }
    }
    
    // Filtrar por proximidade (30km)
    const RADIUS_KM = 30;
    const nearby = unique.filter(item => item.distance <= RADIUS_KM);
    const faraway = unique.filter(item => item.distance > RADIUS_KM).slice(0, 2);
    
    // Ordenar por priority e distance
    nearby.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.distance - b.distance;
    });
    
    // Retornar até 10 resultados
    return [...nearby, ...faraway].slice(0, 10).map(item => ({
      id: item.id,
      lat: item.lat,
      lon: item.lon,
      name: item.name,
      street: item.street,
      housenumber: item.housenumber,
      city: item.city,
      state: item.state,
      category: item.category,
      type: item.type,
      userProvidedNumber: item.userProvidedNumber,
      distance: item.distance,
      isFaraway: item.distance > RADIUS_KM,
      icon: getCategoryIcon(item.category),
      categoryLabel: getCategoryLabel(item.category)
    }));
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Erro na busca:', error);
    }
    return [];
  }
}

// ========================================
// 7) REVERSE GEOCODE
// ========================================
export async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=pt-BR`
    );
    const data = await response.json();
    
    if (!data.address) return null;
    
    const addr = data.address;
    return {
      lat,
      lon,
      street: addr.road || '',
      housenumber: addr.house_number || null,
      city: addr.city || addr.town || addr.village || '',
      suburb: addr.suburb || addr.neighbourhood || '',
      state: addr.state || '',
      country: addr.country || '',
      raw: addr
    };
  } catch (error) {
    console.error('Erro no reverse geocode:', error);
    return null;
  }
}

// ========================================
// 8) FORMATAR ENDEREÇO PARA DISPLAY
// ========================================
export function formatAddressDisplay(result, userProvidedNumber = null) {
  const number = userProvidedNumber || result.housenumber || 's/n';
  const street = result.street || result.name || '';
  const suburb = result.suburb || '';
  const city = result.city || '';
  
  let parts = [];
  
  if (street) {
    parts.push(`${street}${number !== 's/n' ? ', ' + number : ''}`);
  }
  
  if (suburb && suburb !== street) {
    parts.push(suburb);
  }
  
  if (city && city !== street && city !== suburb) {
    parts.push(city);
  }
  
  return parts.filter(p => p).join(', ');
}

// ========================================
// 9) CARREGAR FAVORITOS E RECENTES
// ========================================
export async function loadFavoritesAndRecents(userId, base44) {
  try {
    const [favorites, recents] = await Promise.all([
      base44.entities.FavoritePlace.filter({ user_id: userId }),
      base44.entities.RecentPlace.filter({ user_id: userId }, '-last_used_at', 5)
    ]);
    
    const favoriteSuggestions = favorites.map(fav => ({
      id: `fav-${fav.id}`,
      lat: fav.lat,
      lon: fav.lng,
      name: fav.label,
      street: fav.address_text,
      city: '',
      category: 'favorite',
      icon: '⭐',
      categoryLabel: 'Favorito',
      isFavorite: true,
      priority: 0,
      distance: 0
    }));
    
    const recentSuggestions = recents.map(rec => ({
      id: `recent-${rec.id}`,
      lat: rec.lat,
      lon: rec.lng,
      name: rec.address_text.split(',')[0],
      street: rec.address_text,
      city: '',
      category: 'recent',
      icon: '🕘',
      categoryLabel: 'Recente',
      isRecent: true,
      priority: 0,
      distance: 0
    }));
    
    return [...favoriteSuggestions, ...recentSuggestions];
  } catch (error) {
    console.error('Erro ao carregar favoritos/recentes:', error);
    return [];
  }
}

// ========================================
// 10) LIMPAR CACHE
// ========================================
export function cleanCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}

// Auto-limpar cache a cada 15 minutos
setInterval(cleanCache, 15 * 60 * 1000);