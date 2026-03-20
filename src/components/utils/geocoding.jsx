// Sistema de geocoding usando Mapbox Geocoding API (fonte principal)

import { MAPBOX_CONFIG } from './mapboxConfig';
import { searchLocalPOIs } from './orlandiaPOIs';

const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

function getToken() {
  return MAPBOX_CONFIG.ACCESS_TOKEN;
}

// bbox restringe resultados à região de Orlândia e entorno
const ORLANDIA_BBOX = '-48.4,-21.0,-46.8,-20.0';
const ORLANDIA_CENTER = '-47.8864,-20.7195';

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// ========================================
// 1) PARSER DO INPUT (separa número de rua)
// ========================================
export function parseQuery(text) {
  if (!text || text.trim().length === 0) {
    return { placeQuery: '', houseNumber: null };
  }

  let normalized = text
    .replace(/\s+/g, ' ')
    .replace(/,+/g, ' ')
    .replace(/\bn[°ºª]?\s*/gi, '')
    .replace(/\bnum(ero)?\.?\s*/gi, '')
    .trim();

  const parts = normalized.split(/\s+/);
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
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ========================================
// 3) BUSCA MAPBOX (fonte principal)
// ========================================
async function searchMapbox(query, userLat, userLon, signal) {
  const cacheKey = `mapbox:${query}:${userLat}:${userLon}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;

  const token = getToken();
  if (!token) {
    console.warn('[geocoding] Token não carregado');
    return [];
  }

  const params = new URLSearchParams({
    access_token: token,
    language: 'pt',
    country: 'br',
    limit: 8,
    types: 'address,street,poi,place,locality,neighborhood',
    bbox: ORLANDIA_BBOX,
  });

  const proximity = (userLat != null && userLon != null)
    ? `${userLon},${userLat}`
    : ORLANDIA_CENTER;
  params.append('proximity', proximity);

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;

  const response = await fetch(url, { signal });
  const data = await response.json();

  const results = (data.features || []).map(feature => {
    const context = feature.context || [];
    const getCtx = (type) => context.find(c => c.id.startsWith(type))?.text || '';
    return {
      id: feature.id,
      lat: feature.center[1],
      lon: feature.center[0],
      name: feature.text || '',
      street: feature.properties?.address || feature.place_name?.split(',')[0] || '',
      housenumber: feature.address || '',
      city: getCtx('place') || getCtx('locality') || 'Orlândia',
      state: getCtx('region') || 'SP',
      placeName: feature.place_name,
      placeType: feature.place_type,
      category: feature.place_type?.[0] || 'place',
    };
  });

  cache.set(cacheKey, { data: results, timestamp: Date.now() });
  return results;
}

// ========================================
// 4) ÍCONES E LABELS
// ========================================
export function getCategoryIcon(category) {
  const map = {
    'poi': '📍', 'restaurant': '🍴', 'cafe': '☕', 'bar': '🍺',
    'fast_food': '🍔', 'shop': '🛒', 'supermarket': '🛒', 'mall': '🏬',
    'hospital': '🏥', 'clinic': '⚕️', 'pharmacy': '💊', 'school': '🎓',
    'university': '🎓', 'bank': '🏦', 'atm': '💰', 'fuel': '⛽',
    'park': '🌳', 'address': '🏠', 'house': '🏠', 'building': '🏢',
    'road': '🛣️', 'street': '🛣️', 'place': '🏙️', 'locality': '🏘️',
    'neighborhood': '🏡', 'city': '🏙️', 'town': '🏘️', 'church': '⛪',
  };
  return map[category?.toLowerCase()] || '📍';
}

export function getCategoryLabel(category) {
  const map = {
    'restaurant': 'Restaurante', 'cafe': 'Café', 'bar': 'Bar',
    'shop': 'Loja', 'supermarket': 'Mercado', 'hospital': 'Hospital',
    'school': 'Escola', 'bank': 'Banco', 'park': 'Parque',
    'fuel': 'Posto', 'address': 'Endereço', 'street': 'Rua',
    'place': 'Cidade', 'locality': 'Bairro', 'neighborhood': 'Bairro', 'poi': 'Local',
  };
  return map[category?.toLowerCase()] || 'Local';
}

// ========================================
// 5) BUSCA PRINCIPAL
// ========================================
export async function searchPlaces(text, userLocation, signal) {
  if (!text || text.length < 3) return [];

  const { placeQuery, houseNumber } = parseQuery(text);
  // Monta a query completa: "Avenida T 663 Orlândia SP"
  const fullQuery = [placeQuery, houseNumber, 'Orlândia SP'].filter(Boolean).join(' ');

  const userLat = userLocation?.lat ?? null;
  const userLon = userLocation?.lng ?? null;

  console.log(`[searchPlaces] query="${fullQuery}" | number="${houseNumber}"`);

  try {
    // POIs locais offline (restaurantes, bancos conhecidos) — busca rápida
    const poiResults = searchLocalPOIs(text).slice(0, 3).map(poi => ({
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
      isFaraway: false,
      icon: poi.icon,
      categoryLabel: poi.categoryLabel,
      isLocalPOI: true,
      userProvidedNumber: null,
    }));

    // Mapbox como fonte principal de endereços
    const remoteResults = await searchMapbox(fullQuery, userLat, userLon, signal);

    const remoteFormatted = remoteResults.map(r => {
      const distance = (userLat != null && userLon != null)
        ? haversineDistance(userLat, userLon, r.lat, r.lon)
        : 0;
      return {
        id: r.id,
        lat: r.lat,
        lon: r.lon,
        name: r.name || r.placeName?.split(',')[0] || '',
        street: r.street,
        housenumber: r.housenumber || houseNumber || '',
        city: r.city,
        state: r.state,
        category: r.category,
        distance,
        isFaraway: false,
        icon: getCategoryIcon(r.category),
        categoryLabel: getCategoryLabel(r.category),
        isLocalPOI: false,
        userProvidedNumber: houseNumber,
      };
    });

    // POIs locais primeiro (sem duplicatas com Mapbox)
    const localNames = new Set(poiResults.map(r => normalize(r.name)));
    const remoteDeduplicated = remoteFormatted.filter(r => !localNames.has(normalize(r.name)));

    const combined = [...poiResults, ...remoteDeduplicated];
    console.log(`[searchPlaces] ${poiResults.length} POIs locais + ${remoteDeduplicated.length} Mapbox`);
    return combined.slice(0, 8);

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
    const getCtx = (type) => context.find(c => c.id.startsWith(type))?.text || '';

    return {
      lat,
      lon,
      street: feature.text || '',
      housenumber: feature.address || null,
      city: getCtx('place') || getCtx('locality') || '',
      suburb: getCtx('neighborhood') || '',
      state: getCtx('region') || '',
      country: getCtx('country') || '',
      raw: feature,
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
  const number = userProvidedNumber || result.housenumber || '';
  const street = result.street || result.name || '';
  const suburb = result.suburb || '';
  const city = result.city || '';

  const parts = [];
  if (street) parts.push(number ? `${street}, ${number}` : street);
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