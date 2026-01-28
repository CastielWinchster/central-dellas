import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Car, MapPin, Navigation, Phone, Dog, Package, Target } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'sonner';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícones personalizados por tag
const createCarIcon = (tags = []) => {
  let color = '#F22998'; // Rosa padrão
  
  if (tags.includes('aceita_pet')) {
    color = '#a855f7'; // Roxo claro
  } else if (tags.includes('frete')) {
    color = '#3b82f6'; // Azul
  }
  
  return new L.DivIcon({
    className: 'custom-car-marker',
    html: `<div style="background: ${color}; border-radius: 50%; padding: 8px; box-shadow: 0 0 20px rgba(${
      tags.includes('aceita_pet') ? '168, 85, 247' : 
      tags.includes('frete') ? '59, 130, 246' : 
      '242, 41, 152'
    }, 0.6);">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const pickupIcon = new L.DivIcon({
  className: 'custom-pickup-marker',
  html: `<div style="background: #22c55e; border-radius: 50%; padding: 8px; box-shadow: 0 0 15px rgba(34, 197, 94, 0.5);">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const destinationIcon = new L.DivIcon({
  className: 'custom-destination-marker',
  html: `<div style="background: #F22998; border-radius: 50%; padding: 8px; box-shadow: 0 0 15px rgba(242, 41, 152, 0.5);">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function MapController({ center, pickup, destination, showRoute, onMapReady }) {
  const map = useMap();
  
  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  useEffect(() => {
    if (showRoute && pickup && destination) {
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, pickup, destination, showRoute, map]);
  
  // Desligar follow ao arrastar manualmente
  useEffect(() => {
    const handleMoveStart = () => {
      if (onMapReady) {
        // Será desligado pelo componente pai via prop
      }
    };
    
    map.on('dragstart', handleMoveStart);
    return () => {
      map.off('dragstart', handleMoveStart);
    };
  }, [map, onMapReady]);
  
  return null;
}

export default function MapView({ 
  pickupLocation, 
  destinationLocation, 
  nearbyDrivers = [],
  center = [-23.5505, -46.6333],
  showRoute = false,
  className = ''
}) {
  const [mapCenter, setMapCenter] = useState(center);
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [followUser, setFollowUser] = useState(true);
  const watchIdRef = useRef(null);
  const lastLatLngRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const userMarkerRef = useRef(null);
  const mapRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Animação suave do marcador
  const animateMarkerTo = (marker, fromLatLng, toLatLng, duration = 500) => {
    if (!marker || !fromLatLng || !toLatLng) return;
    
    const startTime = Date.now();
    const startLat = fromLatLng.lat;
    const startLng = fromLatLng.lng;
    const endLat = toLatLng.lat;
    const endLng = toLatLng.lng;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Interpolação suave (easeOutQuad)
      const eased = 1 - Math.pow(1 - progress, 2);
      
      const currentLat = startLat + (endLat - startLat) * eased;
      const currentLng = startLng + (endLng - startLng) * eased;
      
      marker.setLatLng([currentLat, currentLng]);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Rastreamento em tempo real
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      toast.error('🚫 Seu navegador não suporta geolocalização', { duration: 5000 });
      return;
    }

    // Checar permissão primeiro
    navigator.permissions?.query({ name: 'geolocation' })
      .then((result) => {
        if (result.state === 'denied') {
          setLocationDenied(true);
          toast.error('📍 Localização bloqueada! Ative nas configurações do navegador para usar o app.', {
            duration: 8000,
            action: {
              label: 'Ajuda',
              onClick: () => {
                toast.info('💡 Vá em Configurações do navegador > Permissões > Localização e permita para este site.');
              }
            }
          });
        }
      })
      .catch(() => {});

    // Iniciar watchPosition
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const now = Date.now();
        
        // Filtro 1: Evitar updates muito frequentes (< 500ms)
        if (now - lastUpdateRef.current < 500) {
          return;
        }
        
        const newLatLng = L.latLng(latitude, longitude);
        
        // Filtro 2: Ignorar movimentos < 5 metros
        if (lastLatLngRef.current) {
          const distance = lastLatLngRef.current.distanceTo(newLatLng);
          if (distance < 5) {
            return;
          }
        }
        
        // Atualizar referências
        lastUpdateRef.current = now;
        const oldLatLng = lastLatLngRef.current;
        lastLatLngRef.current = newLatLng;
        
        // Atualizar state
        setUserLocation([latitude, longitude]);
        
        // Animar marcador se já existe
        if (userMarkerRef.current && oldLatLng) {
          animateMarkerTo(userMarkerRef.current, oldLatLng, newLatLng, 500);
        }
        
        // Seguir usuário se modo ativo
        if (followUser && mapRef.current) {
          mapRef.current.panTo(newLatLng, { animate: true, duration: 0.5 });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationDenied(true);
        
        if (error.code === 1) {
          toast.error('📍 Permissão de localização negada. Por favor, ative para usar o app.', {
            duration: 8000
          });
        } else if (error.code === 2) {
          toast.warning('📡 Localização indisponível. Verifique o GPS do dispositivo.', {
            duration: 5000
          });
        } else if (error.code === 3) {
          toast.warning('⏱️ Timeout ao obter localização. Tente novamente.', {
            duration: 4000
          });
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );

    // Centralizar no primeiro carregamento
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = [position.coords.latitude, position.coords.longitude];
        setUserLocation(userPos);
        setMapCenter(userPos);
        lastLatLngRef.current = L.latLng(position.coords.latitude, position.coords.longitude);
      },
      () => {}
    );

    // Cleanup
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [followUser]);

  useEffect(() => {
    if (pickupLocation) {
      setMapCenter([pickupLocation.lat, pickupLocation.lng]);
    }
  }, [pickupLocation]);

  useEffect(() => {
    if (locationDenied) {
      toast.error(
        'Localização desativada. Por favor, ative a localização do seu dispositivo para usar o mapa.',
        { duration: 5000 }
      );
    }
  }, [locationDenied]);

  // Calcular rota quando origem e destino estiverem definidos
  useEffect(() => {
    if (showRoute && pickupLocation && destinationLocation) {
      const getRoute = async () => {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${pickupLocation.lng},${pickupLocation.lat};${destinationLocation.lng},${destinationLocation.lat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRouteCoordinates(coords);
          }
        } catch (error) {
          console.error('Erro ao calcular rota:', error);
        }
      };
      
      getRoute();
    } else {
      setRouteCoordinates([]);
    }
  }, [showRoute, pickupLocation, destinationLocation]);

  const userLocationIcon = new L.DivIcon({
    className: 'custom-user-marker',
    html: `<div style="position: relative;">
      <div style="
        width: 44px; 
        height: 44px; 
        border-radius: 50%; 
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 8px rgba(59, 130, 246, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse-user 2s infinite;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <style>
        @keyframes pulse-user {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      </style>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

  const handleToggleFollow = () => {
    const newFollowState = !followUser;
    setFollowUser(newFollowState);
    
    if (newFollowState && userLocation && mapRef.current) {
      mapRef.current.flyTo(userLocation, Math.max(mapRef.current.getZoom(), 16), {
        animate: true,
        duration: 0.8
      });
      toast.success('📍 Modo seguir ativado', { duration: 2000 });
    } else if (!newFollowState) {
      toast.info('🗺️ Modo livre - arraste o mapa', { duration: 2000 });
    }
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      <style>{`
        .leaflet-container {
          background: #ffffff;
        }
        .leaflet-tile {
          filter: none;
        }
        .custom-car-marker, .custom-pickup-marker, .custom-destination-marker, .custom-user-marker {
          background: transparent !important;
          border: none !important;
        }
        .route-polyline {
          filter: drop-shadow(0 0 4px rgba(242, 41, 152, 0.4));
        }
        .custom-driver-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
        }
        .custom-driver-popup .leaflet-popup-content {
          margin: 0;
        }
        .follow-button {
          position: absolute;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: white;
          border: 2px solid #F22998;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .follow-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        .follow-button.active {
          background: linear-gradient(135deg, #BF3B79 0%, #F22998 100%);
          border-color: #F22998;
        }
        .follow-button.active svg {
          color: white;
        }
      `}</style>
      
      {/* Botão de seguir usuário */}
      <button
        onClick={handleToggleFollow}
        className={`follow-button ${followUser ? 'active' : ''}`}
        title={followUser ? 'Modo seguir ativo' : 'Ativar modo seguir'}
      >
        <Target className="w-6 h-6" style={{ color: followUser ? 'white' : '#F22998' }} />
      </button>
      
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController 
          center={mapCenter} 
          pickup={pickupLocation} 
          destination={destinationLocation}
          showRoute={showRoute}
          onMapReady={(map) => {
            mapRef.current = map;
            map.on('dragstart', () => {
              if (followUser) {
                setFollowUser(false);
              }
            });
          }}
        />
        
        {/* Rota - Polyline Rosa */}
        {showRoute && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            color="#F22998"
            weight={5}
            opacity={0.8}
            className="route-polyline"
          />
        )}
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={userLocation} 
            icon={userLocationIcon}
            ref={(ref) => {
              if (ref) {
                userMarkerRef.current = ref;
              }
            }}
          >
            <Popup>
              <div className="text-sm font-medium">📍 Você está aqui</div>
            </Popup>
          </Marker>
        )}
        
        {/* Pickup marker */}
        {pickupLocation && (
          <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-sm font-medium">Ponto de Partida</div>
            </Popup>
          </Marker>
        )}
        
        {/* Destination marker */}
        {destinationLocation && (
          <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-sm font-medium">Destino</div>
            </Popup>
          </Marker>
        )}
        
        {/* Nearby drivers com ícones coloridos */}
        {nearbyDrivers.map((driver, index) => (
          <Marker 
            key={index} 
            position={[driver.lat, driver.lng]} 
            icon={createCarIcon(driver.tags || [])}
          >
            <Popup className="custom-driver-popup">
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-base mb-2">{driver.name || 'Motorista'}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{driver.phone || 'Sem telefone'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-xs">{driver.location || 'Localização indisponível'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span className="text-xs">{driver.vehicle || 'Veículo não informado'}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium">{driver.rating || 5}</span>
                  </div>
                  
                  {driver.tags && driver.tags.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {driver.tags.map((tag, idx) => (
                          <span 
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                              tag === 'aceita_pet' ? 'bg-purple-100 text-purple-700' :
                              tag === 'frete' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {tag === 'aceita_pet' && <Dog className="w-3 h-3" />}
                            {tag === 'frete' && <Package className="w-3 h-3" />}
                            {tag === 'aceita_pet' ? 'Aceita Pets' : tag === 'frete' ? 'Faz Frete' : tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}