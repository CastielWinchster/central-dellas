// Configuração centralizada do Mapbox
export const MAPBOX_CONFIG = {
  // Token de acesso (carregado via backend)
  ACCESS_TOKEN: null, // Será carregado dinamicamente
  
  // Estilo personalizado 3D
  MAP_STYLE: 'mapbox://styles/luisbracale/cmlzdk84n003e01s29qedaex4',
  
  // Configurações padrão do mapa
  DEFAULT_CENTER: [-47.8864, -20.7195], // [lng, lat] Franca, SP
  DEFAULT_ZOOM: 15,
  DEFAULT_PITCH: 60, // Inclinação 3D
  DEFAULT_BEARING: 0,
  
  // Configurações de animação
  ANIMATION_DURATION: 800, // ms
  FOLLOW_MODE_TIMEOUT: 8000, // 8s sem interação reativa o follow
  DRIVER_MOVE_DURATION: 1000, // 1s para movimento suave dos motoristas
  
  // Configurações de geocoding
  GEOCODING: {
    language: 'pt',
    country: 'br',
    limit: 10,
    debounce: 300 // ms
  },
  
  // Estilos de rota
  ROUTE_STYLE: {
    color: '#F22998',
    width: 5,
    opacity: 0.8
  },
  
  // Estilos de rota animada
  ROUTE_PROGRESS_STYLE: {
    color: '#BF3B79',
    width: 7,
    opacity: 1
  }
};

// Validar configuração
export function validateMapboxConfig() {
  if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
    throw new Error('❌ MAPBOX_TOKEN não configurado');
  }
  
  if (!MAPBOX_CONFIG.MAP_STYLE) {
    throw new Error('❌ MAP_STYLE_URL não configurado');
  }
  
  console.log('✅ Mapbox configurado:', {
    style: MAPBOX_CONFIG.MAP_STYLE,
    center: MAPBOX_CONFIG.DEFAULT_CENTER
  });
  
  return true;
}

// Carregar token do Mapbox via backend
export async function loadMapboxToken(base44Client) {
  try {
    const response = await base44Client.functions.invoke('getMapboxToken');
    MAPBOX_CONFIG.ACCESS_TOKEN = response.data.token;
    return MAPBOX_CONFIG.ACCESS_TOKEN;
  } catch (error) {
    console.error('Erro ao carregar token do Mapbox:', error);
    throw error;
  }
}