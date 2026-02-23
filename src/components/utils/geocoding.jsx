// Sistema de geocoding usando Mapbox Geocoding API

const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
const MAPBOX_TOKEN = 'pk.eyJ1IjoibHVpc2JyYWNhbGUiLCJhIjoiY21sd21xdHZvMGdxazNlcHp5Y204cGxyMSJ9.MZltiRZAp6dsx-HZkawDBA';

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
// 3) MAPBOX GEOCODING SEARCH
// ========================================
async function searchMapbox(query, userLat, userLon, signal) {
  const cacheKey = `mapbox:${query}:${userLat}:${userLon}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    language: 'pt',
    country: 'br',
    limit: 10,
    types: 'address,poi,place,locality,neighborhood'
  });
  
  if (userLat && userLon) {
    params.append('proximity', `${userLon},${userLat}`);
  }
  
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`,
    { signal }
  );
  const data = await response.json();
  
  const results = (data.features || []).map(feature => {
    const context = feature.context || [];
    const getContext = (type) => context.find(c => c.id.startsWith(type))?.text || '';
    
    return {
      type: 'mapbox',
      id: feature.id,
      lat: feature.center[1],
      lon: feature.center[0],
      name: feature.text || '',
      street: feature.properties?.address || '',
      housenumber: feature.address || '',
      city: getContext('place') || getContext('locality'),
      state: getContext('region'),
      country: getContext('country'),
      category: feature.place_type?.[0] || 'place',
      placeType: feature.place_type,
      placeName: feature.place_name,
      raw: feature
    };
  });
  
  cache.set(cacheKey, { data: results, timestamp: Date.now() });
  return results;
}

// ========================================
// 5) CATEGORIZAÇÃO E ÍCONES
// ========================================
export function getCategoryIcon(category) {
  const categoryMap = {
    // POIs
    'poi': '📍',
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
    'address': '🏠',
    'house': '🏠',
    'building': '🏢',
    'road': '🛣️',
    'highway': '🛣️',
    'street': '🛣️',
    
    // Cidade
    'place': '🏙️',
    'locality': '🏘️',
    'neighborhood': '🏡',
    'city': '🏙️',
    'town': '🏘️',
    'village': '🏡',
    
    // Religião
    'church': '⛪',
    'temple': '🕌'
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
// 6) BUSCA PRINCIPAL USANDO MAPBOX
// ========================================
export async function searchPlaces(text, userLocation, signal) {
  if (!text || text.length < 3) return [];
  
  const { placeQuery, houseNumber } = parseQuery(text);
  
  // Construir query com número se fornecido
  const fullQuery = houseNumber 
    ? `${placeQuery} ${houseNumber}`
    : placeQuery;
  
  if (!fullQuery) return [];
  
  const userLat = userLocation?.lat;
  const userLon = userLocation?.lng;
  
  try {
    const results = await searchMapbox(fullQuery, userLat, userLon, signal);
    
    // Adicionar distância e prioridade
    const withMetadata = results.map(r => ({
      ...r,
      distance: userLat && userLon ? haversineDistance(userLat, userLon, r.lat, r.lon) : 999,
      priority: r.housenumber ? 1 : r.placeType?.includes('poi') ? 2 : 3,
      userProvidedNumber: houseNumber
    }));
    
    // Filtrar por proximidade (30km)
    const RADIUS_KM = 30;
    const nearby = withMetadata.filter(item => item.distance <= RADIUS_KM);
    const faraway = withMetadata.filter(item => item.distance > RADIUS_KM).slice(0, 2);
    
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
      name: item.name || item.placeName?.split(',')[0] || '',
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
// 7) REVERSE GEOCODE USANDO MAPBOX
// ========================================
export async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}&language=pt&types=address,poi,place,locality,neighborhood`
    );
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) return null;
    
    const feature = data.features[0];
    const context = feature.context || [];
    const getContext = (type) => context.find(c => c.id.startsWith(type))?.text || '';
    
    return {
      lat,
      lon,
      street: feature.text || '',
      housenumber: feature.address || null,
      city: getContext('place') || getContext('locality') || '',
      suburb: getContext('neighborhood') || '',
      state: getContext('region') || '',
      country: getContext('country') || '',
      raw: feature
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