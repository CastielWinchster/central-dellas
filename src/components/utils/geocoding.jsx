// Sistema de geocoding usando Mapbox Geocoding API

import { MAPBOX_CONFIG } from './mapboxConfig';
import { searchLocalPOIs } from './orlandiaPOIs';
import { searchStreets, searchNeighbourhoods } from './orlandiaStreets';

const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// Token lido dinamicamente
function getToken() {
  return MAPBOX_CONFIG.ACCESS_TOKEN;
}

// ========================================
// BBOX da região de Orlândia e entorno (~60km)
// [minLng, minLat, maxLng, maxLat]
// Cobre: Orlândia, Aramina, São Joaquim da Barra, Rifaina, Ituverava,
//        Guará, Altinópolis, Sales Oliveira, Brodowski, Batatais
// ========================================
const ORLANDIA_BBOX = '-48.4,-21.0,-46.8,-20.0';

// ========================================
// 1) PARSER DO INPUT
// ========================================
export function parseQuery(text) {
  if (!text || text.trim().length === 0) {
    return { placeQuery: '', houseNumber: null };
  }

  let normalized = text
    .replace(/\s+/g, ' ')
    .replace(/,+/g, ',')
    .replace(/n[°ºª]?\s*/gi, '')
    .replace(/num(ero)?\.?\s*/gi, '')
    .trim();

  const parts = normalized.split(/[,\s]+/);

  let houseNumber = null;
  let placeTokens = [...parts];

  for (let i = parts.length - 1; i >= 0; i--) {
    const token = parts[i];
    const match = token.match(/^(\d{1,6})([A-Za-z]?)$/);
    if (match) {
      const prevToken = parts[i - 1]?.toLowerCase() || '';
      const isPartOfRoadName = /^(rua|avenida|av|r|travessa|trav|alameda|al|viela|estrada)$/.test(prevToken);
      if (!isPartOfRoadName) {
        houseNumber = match[1] + (match[2] || '');
        placeTokens.splice(i, 1);
        break;
      }
    }
  }

  return { placeQuery: placeTokens.join(' '), houseNumber };
}

// ========================================
// 2) HAVERSINE DISTANCE
// ========================================
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ========================================
// 3) MAPBOX GEOCODING SEARCH (com bbox Orlândia)
// ========================================
async function searchMapbox(query, userLat, userLon, signal) {
  const cacheKey = `mapbox:${query}:${userLat}:${userLon}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[geocoding] Cache hit para:', query);
    return cached.data;
  }

  const token = getToken();
  if (!token) {
    console.warn('[geocoding] Token não carregado ainda, abortando busca');
    return [];
  }

  const params = new URLSearchParams({
    access_token: token,
    language: 'pt',
    country: 'br',
    limit: 10,
    // Tipos relevantes para transporte urbano
    types: 'address,street,poi,place,locality,neighborhood',
    // bbox restringe resultados à região de Orlândia
    bbox: ORLANDIA_BBOX,
  });

  // proximity: bias para a localização atual do usuário (lng,lat)
  if (userLat != null && userLon != null) {
    params.append('proximity', `${userLon},${userLat}`);
    console.log(`[geocoding] proximity=${userLon},${userLat} | bbox=${ORLANDIA_BBOX}`);
  } else {
    // fallback: centro de Orlândia
    params.append('proximity', '-47.8864,-20.7195');
    console.log(`[geocoding] proximity=fallback Orlândia | bbox=${ORLANDIA_BBOX}`);
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;
  console.log('[geocoding] Buscando URL:', url.replace(token, 'TOKEN'));

  const response = await fetch(url, { signal });
  const data = await response.json();

  console.log(`[geocoding] Resposta da API: ${data.features?.length || 0} features para "${query}"`);

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
// 4) CATEGORIZAÇÃO E ÍCONES
// ========================================
export function getCategoryIcon(category) {
  const map = {
    'poi': '📍', 'restaurant': '🍴', 'cafe': '☕', 'bar': '🍺',
    'fast_food': '🍔', 'pub': '🍻', 'shop': '🛒', 'supermarket': '🛒',
    'mall': '🏬', 'convenience': '🏪', 'market': '🛍️', 'hospital': '🏥',
    'clinic': '⚕️', 'pharmacy': '💊', 'doctors': '🩺', 'school': '🎓',
    'university': '🎓', 'college': '🏫', 'bank': '🏦', 'atm': '💰',
    'post_office': '📮', 'fuel': '⛽', 'parking': '🅿️', 'cinema': '🎬',
    'theatre': '🎭', 'park': '🌳', 'stadium': '🏟️', 'bus_stop': '🚌',
    'airport': '✈️', 'station': '🚉', 'address': '🏠', 'house': '🏠',
    'building': '🏢', 'road': '🛣️', 'highway': '🛣️', 'street': '🛣️',
    'place': '🏙️', 'locality': '🏘️', 'neighborhood': '🏡',
    'city': '🏙️', 'town': '🏘️', 'village': '🏡',
    'church': '⛪', 'temple': '🕌'
  };
  return map[category?.toLowerCase()] || '📍';
}

export function getCategoryLabel(category) {
  const map = {
    'restaurant': 'Restaurante', 'cafe': 'Café', 'bar': 'Bar',
    'shop': 'Loja', 'supermarket': 'Mercado', 'hospital': 'Hospital',
    'school': 'Escola', 'bank': 'Banco', 'park': 'Parque',
    'fuel': 'Posto', 'address': 'Endereço', 'road': 'Via',
    'street': 'Rua', 'city': 'Cidade', 'place': 'Cidade',
    'locality': 'Bairro', 'neighborhood': 'Bairro', 'poi': 'Local'
  };
  return map[category?.toLowerCase()] || 'Local';
}

// ========================================
// 5) BUSCA PRINCIPAL (Etapa 2)
// ========================================
export async function searchPlaces(text, userLocation, signal) {
  if (!text || text.length < 3) return [];

  const { placeQuery, houseNumber } = parseQuery(text);
  const fullQuery = houseNumber ? `${placeQuery} ${houseNumber}` : placeQuery;
  if (!fullQuery) return [];

  const userLat = userLocation?.lat ?? null;
  const userLon = userLocation?.lng ?? null;

  console.log(`[searchPlaces] query="${fullQuery}" | number="${houseNumber}" | userLoc=${userLat},${userLon}`);

  try {
    // Busca local offline (POIs de Orlândia) — tem prioridade máxima
    const localResults = searchLocalPOIs(text).map(poi => ({
      id: poi.id,
      lat: poi.lat,
      lon: poi.lon,
      name: poi.name,
      street: poi.street,
      housenumber: poi.housenumber,
      city: 'Orlândia',
      state: 'SP',
      category: poi.amenity,
      distance: 0,
      priority: 0,
      isFaraway: false,
      icon: poi.icon,
      categoryLabel: poi.categoryLabel,
      isLocalPOI: true,
      userProvidedNumber: null,
    }));

    const remoteResults = await searchMapbox(fullQuery, userLat, userLon, signal);

    const withMeta = remoteResults.map(r => ({
      ...r,
      distance: (userLat != null && userLon != null)
        ? haversineDistance(userLat, userLon, r.lat, r.lon)
        : 999,
      priority: r.housenumber ? 1 : r.placeType?.includes('poi') ? 2 : 3,
      userProvidedNumber: houseNumber
    }));

    // Ordenar por: distância primeiro (com bbox já limitamos à região)
    withMeta.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.distance - b.distance;
    });

    // Separar próximos (dentro do bbox) e distantes
    const RADIUS_KM = 60;
    const nearby = withMeta.filter(r => r.distance <= RADIUS_KM);
    const faraway = withMeta.filter(r => r.distance > RADIUS_KM).slice(0, 2);

    const remoteFormatted = [...nearby, ...faraway].map(item => ({
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
      categoryLabel: getCategoryLabel(item.category),
      isLocalPOI: false,
    }));

    // POIs locais primeiro, depois resultados remotos (sem duplicatas por nome)
    const localNames = new Set(localResults.map(r => r.name.toLowerCase()));
    const remoteDeduplicated = remoteFormatted.filter(r => !localNames.has(r.name.toLowerCase()));

    console.log(`[searchPlaces] ${localResults.length} locais offline + ${remoteDeduplicated.length} remotos`);

    return [...localResults, ...remoteDeduplicated].slice(0, 10);
  } catch (error) {
    if (error.name !== 'AbortError') console.error('[searchPlaces] Erro:', error);
    return [];
  }
}

// ========================================
// 6) REVERSE GEOCODE
// ========================================
export async function reverseGeocode(lat, lon) {
  try {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${token}&language=pt&types=address,poi,place,locality,neighborhood`
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
    console.error('[reverseGeocode] Erro:', error);
    return null;
  }
}

// ========================================
// 7) FORMATAR ENDEREÇO
// ========================================
export function formatAddressDisplay(result, userProvidedNumber = null) {
  const number = userProvidedNumber || result.housenumber || 's/n';
  const street = result.street || result.name || '';
  const suburb = result.suburb || '';
  const city = result.city || '';

  const parts = [];
  if (street) parts.push(`${street}${number !== 's/n' ? ', ' + number : ''}`);
  if (suburb && suburb !== street) parts.push(suburb);
  if (city && city !== street && city !== suburb) parts.push(city);

  return parts.filter(Boolean).join(', ');
}

// ========================================
// 8) FAVORITOS E RECENTES
// ========================================
export async function loadFavoritesAndRecents(userId, base44) {
  try {
    const [favorites, recents] = await Promise.all([
      base44.entities.FavoritePlace.filter({ user_id: userId }),
      base44.entities.RecentPlace.filter({ user_id: userId }, '-last_used_at', 5)
    ]);

    return [
      ...favorites.map(fav => ({
        id: `fav-${fav.id}`, lat: fav.lat, lon: fav.lng,
        name: fav.label, street: fav.address_text, city: '',
        category: 'favorite', icon: '⭐', categoryLabel: 'Favorito',
        isFavorite: true, priority: 0, distance: 0
      })),
      ...recents.map(rec => ({
        id: `recent-${rec.id}`, lat: rec.lat, lon: rec.lng,
        name: rec.address_text.split(',')[0], street: rec.address_text, city: '',
        category: 'recent', icon: '🕘', categoryLabel: 'Recente',
        isRecent: true, priority: 0, distance: 0
      }))
    ];
  } catch (error) {
    console.error('[loadFavoritesAndRecents] Erro:', error);
    return [];
  }
}

// ========================================
// 9) CACHE CLEANUP
// ========================================
export function cleanCache() {
  const now = Date.now();
  for (const [key, val] of cache.entries()) {
    if (now - val.timestamp > CACHE_DURATION) cache.delete(key);
  }
}
setInterval(cleanCache, 15 * 60 * 1000);