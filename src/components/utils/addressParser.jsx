// Parser e busca inteligente de endereços para região de Orlândia/SP
// Suporta: Orlândia, Sales Oliveira, São Joaquim da Barra, Franca, Ribeirão Preto

const NUMBERS_MAP = {
  '0': 'zero', '1': 'um', '2': 'dois', '3': 'três', '4': 'quatro',
  '5': 'cinco', '6': 'seis', '7': 'sete', '8': 'oito', '9': 'nove',
  '10': 'dez', '11': 'onze', '12': 'doze', '13': 'treze', '14': 'quatorze',
  '15': 'quinze', '16': 'dezesseis', '17': 'dezessete', '18': 'dezoito',
  '19': 'dezenove', '20': 'vinte'
};

// Cache de resultados (5 minutos)
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Parse o input do usuário e separa via + número
 * Ex: 'Avenida 4, 1381' -> { street: 'Avenida 4', number: '1381' }
 */
export function parseAddress(input) {
  if (!input || typeof input !== 'string') {
    return { street: '', number: null };
  }

  let text = input.trim();
  
  // Remover indicadores comuns de número
  text = text.replace(/\b(n[ºo°]?\.?|num|número|numero)\s*/gi, '');
  
  // Separar por vírgula se houver
  const parts = text.split(',').map(p => p.trim());
  
  if (parts.length === 2) {
    // Formato: 'Rua X, 123'
    return {
      street: parts[0],
      number: parts[1].match(/^\d+[A-Za-z]?$/) ? parts[1] : null
    };
  }
  
  // Tentar pegar o último token como número
  const tokens = text.split(/\s+/);
  const lastToken = tokens[tokens.length - 1];
  
  // Verificar se o último token é um número (1-6 dígitos) com opcional sufixo letra
  if (/^\d{1,6}[A-Za-z]?$/.test(lastToken)) {
    const street = tokens.slice(0, -1).join(' ');
    return {
      street: street || text,
      number: lastToken
    };
  }
  
  // Não encontrou número separado
  return {
    street: text,
    number: null
  };
}

/**
 * Gera variações do nome da via para melhorar busca
 */
export function generateStreetVariants(street) {
  const variants = [street]; // Original sempre primeiro
  
  // Expandir números por extenso (0-20)
  const numberMatch = street.match(/\b(\d{1,2})\b/);
  if (numberMatch) {
    const num = numberMatch[1];
    if (NUMBERS_MAP[num]) {
      const expanded = street.replace(/\b\d{1,2}\b/, NUMBERS_MAP[num]);
      variants.push(expanded);
      // Capitalizar
      variants.push(expanded.replace(/\b\w/g, l => l.toUpperCase()));
    }
  }
  
  return [...new Set(variants)]; // Remove duplicatas
}

/**
 * Calcula viewbox dinâmico baseado na localização do usuário
 * Retorna string no formato 'minLon,minLat,maxLon,maxLat'
 */
export function calculateViewbox(userLat, userLng, radiusKm = 80) {
  if (!userLat || !userLng) return null;
  
  // Aproximação: 1 grau ≈ 111km
  const deltaLat = radiusKm / 111;
  const deltaLng = radiusKm / (111 * Math.cos(userLat * Math.PI / 180));
  
  const minLat = userLat - deltaLat;
  const maxLat = userLat + deltaLat;
  const minLng = userLng - deltaLng;
  const maxLng = userLng + deltaLng;
  
  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

/**
 * Busca endereços no Nominatim com 2 etapas
 */
export async function searchAddress(input, userLocation = null, abortSignal = null) {
  if (!input || input.length < 3) {
    return [];
  }
  
  // Verificar cache
  const cacheKey = `${input}_${userLocation?.lat}_${userLocation?.lng}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.results;
  }
  
  const { street, number } = parseAddress(input);
  const variants = generateStreetVariants(street);
  
  // Construir viewbox
  const viewbox = userLocation 
    ? calculateViewbox(userLocation.lat, userLocation.lng, 80)
    : null;
  
  const baseParams = {
    format: 'jsonv2',
    addressdetails: 1,
    limit: 10,
    countrycodes: 'br',
    dedupe: 1,
    'accept-language': 'pt-BR'
  };
  
  if (viewbox) {
    baseParams.viewbox = viewbox;
    baseParams.bounded = 1;
  }
  
  let allResults = [];
  
  // ETAPA A: Buscar com número (se houver)
  if (number) {
    for (const variant of variants) {
      const query = viewbox 
        ? `${variant}, ${number}, SP, Brasil`
        : `${variant}, ${number}, São Paulo, Brasil`;
      
      const params = new URLSearchParams({
        ...baseParams,
        q: query
      });
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { signal: abortSignal }
        );
        
        if (response.ok) {
          const data = await response.json();
          allResults.push(...data);
          
          // Se encontrou bons resultados, parar
          if (data.length > 0 && data.some(r => r.address?.road)) {
            break;
          }
        }
        
        // Rate limit: esperar 1s entre requisições
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        console.warn('Erro na busca Etapa A:', error);
      }
    }
  }
  
  // ETAPA B: Fallback - buscar só a via (sem número)
  if (allResults.length === 0) {
    for (const variant of variants) {
      const query = viewbox
        ? `${variant}, SP, Brasil`
        : `${variant}, São Paulo, Brasil`;
      
      const params = new URLSearchParams({
        ...baseParams,
        q: query
      });
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { signal: abortSignal }
        );
        
        if (response.ok) {
          const data = await response.json();
          allResults.push(...data);
          
          if (data.length > 0) break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        console.warn('Erro na busca Etapa B:', error);
      }
    }
  }
  
  // Processar e rankear resultados
  const processed = processResults(allResults, street, number, userLocation);
  
  // Salvar no cache
  searchCache.set(cacheKey, {
    results: processed,
    timestamp: Date.now()
  });
  
  // Limpar cache antigo
  cleanCache();
  
  return processed;
}

/**
 * Processa e rankeia resultados
 */
function processResults(results, originalStreet, userNumber, userLocation) {
  // Remove duplicatas por place_id
  const unique = Array.from(
    new Map(results.map(r => [r.place_id, r])).values()
  );
  
  // Adiciona score e formata
  const scored = unique.map(result => {
    let score = 0;
    const addr = result.address || {};
    
    // Priorizar resultados com road
    if (addr.road) score += 50;
    
    // Priorizar resultados com cidade
    if (addr.city || addr.town || addr.village) score += 30;
    
    // Priorizar dentro do viewbox (importance)
    score += (result.importance || 0) * 20;
    
    // Priorizar se tem house_number
    if (addr.house_number) score += 10;
    
    // Calcular distância do usuário se disponível
    if (userLocation) {
      const distance = Math.sqrt(
        Math.pow(userLocation.lat - parseFloat(result.lat), 2) +
        Math.pow(userLocation.lng - parseFloat(result.lon), 2)
      );
      score -= distance * 10; // Penalizar distantes
    }
    
    return {
      ...result,
      score,
      userProvidedNumber: userNumber,
      formattedAddress: formatAddress(result, userNumber)
    };
  });
  
  // Ordenar por score
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, 5); // Top 5
}

/**
 * Formata endereço para exibição
 */
function formatAddress(result, userNumber = null) {
  const addr = result.address || {};
  
  const road = addr.road || addr.pedestrian || addr.path || result.display_name.split(',')[0];
  const number = userNumber || addr.house_number || 'S/N';
  const suburb = addr.suburb || addr.neighbourhood || '';
  const city = addr.city || addr.town || addr.village || addr.municipality || '';
  const state = addr.state || 'SP';
  
  let formatted = road;
  if (number && number !== 'S/N') {
    formatted += `, ${number}`;
  }
  if (suburb) {
    formatted += ` - ${suburb}`;
  }
  if (city) {
    formatted += `, ${city}`;
  }
  formatted += ` - ${state}`;
  
  return formatted;
}

/**
 * Limpa cache antigo
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      searchCache.delete(key);
    }
  }
}

/**
 * Formata endereço para usar na corrida (com número informado)
 */
export function formatAddressForRide(result, userNumber = null) {
  const addr = result.address || {};
  
  const road = addr.road || addr.pedestrian || result.display_name.split(',')[0];
  const number = userNumber || addr.house_number || 'S/N';
  const city = addr.city || addr.town || addr.village || 'Orlândia';
  const state = addr.state || 'SP';
  
  return `${road}, nº ${number}, ${city} - ${state}`;
}