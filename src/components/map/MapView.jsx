import React, { useEffect, useState, useRef, useCallback } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { Car, MapPin, Target, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { MAPBOX_CONFIG, validateMapboxConfig } from '@/components/utils/mapboxConfig';
import { reverseGeocode } from '@/components/utils/geocoding';
import 'mapbox-gl/dist/mapbox-gl.css';

// Validar config na inicialização
try {
  validateMapboxConfig();
} catch (error) {
  console.error(error);
}

// Calcular heading (direção) entre dois pontos
function calculateHeading(fromLat, fromLng, toLat, toLng) {
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const lat1 = fromLat * Math.PI / 180;
  const lat2 = toLat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const heading = Math.atan2(y, x) * 180 / Math.PI;
  
  return (heading + 360) % 360; // Normalizar 0-360
}

// Custom marker components
const UserMarker = ({ heading = 0 }) => (
  <div style={{
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    border: '3px solid white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 8px rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: `translate(-50%, -50%) rotate(${heading}deg)`,
    transition: 'transform 0.5s ease-out'
  }}>
    <Navigation className="w-6 h-6 text-white" />
  </div>
);

const PickupMarker = () => (
  <div style={{
    background: '#22c55e',
    borderRadius: '50%',
    padding: 8,
    boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)',
    transform: 'translate(-50%, -100%)'
  }}>
    <MapPin className="w-5 h-5 text-white" />
  </div>
);

const DestinationMarker = () => (
  <div style={{
    background: '#F22998',
    borderRadius: '50%',
    padding: 8,
    boxShadow: '0 0 15px rgba(242, 41, 152, 0.5)',
    transform: 'translate(-50%, -100%)'
  }}>
    <MapPin className="w-5 h-5 text-white" />
  </div>
);

const CarMarker = ({ tags = [], heading = 0 }) => {
  let color = '#F22998';
  if (tags.includes('aceita_pet')) color = '#a855f7';
  else if (tags.includes('frete')) color = '#3b82f6';
  
  return (
    <div style={{
      background: color,
      borderRadius: '50%',
      padding: 8,
      boxShadow: `0 0 20px ${color}99`,
      transform: `translate(-50%, -50%) rotate(${heading}deg)`,
      transition: 'transform 0.8s ease-out'
    }}>
      <Car className="w-5 h-5 text-white" />
    </div>
  );
};

export default function MapView({
  pickupLocation,
  destinationLocation,
  nearbyDrivers = [],
  center = MAPBOX_CONFIG.DEFAULT_CENTER,
  showRoute = false,
  className = '',
  onPickupDragEnd = null,
  onDestinationDragEnd = null,
  pickupDraggable = false,
  destinationDraggable = false,
  onMapClick = null,
  onDestinationSelected = null
}) {
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: MAPBOX_CONFIG.DEFAULT_ZOOM,
    pitch: MAPBOX_CONFIG.DEFAULT_PITCH,
    bearing: MAPBOX_CONFIG.DEFAULT_BEARING
  });
  
  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(0);
  const [routeData, setRouteData] = useState(null);
  const [routeProgress, setRouteProgress] = useState(null);
  const [followMode, setFollowMode] = useState(true);
  const [driversWithHeading, setDriversWithHeading] = useState([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef();
  const watchIdRef = useRef(null);
  const lastUserPosRef = useRef(null);
  const followTimeoutRef = useRef(null);
  const routeAnimationRef = useRef(null);
  const driverAnimationsRef = useRef({});

  // Track user location com heading
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error('🚫 Geolocalização não disponível');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = [longitude, latitude];
        
        // Calcular heading se houver posição anterior
        if (lastUserPosRef.current) {
          const heading = calculateHeading(
            lastUserPosRef.current[1], lastUserPosRef.current[0],
            latitude, longitude
          );
          setUserHeading(heading);
        }
        
        setUserLocation(newPos);
        lastUserPosRef.current = newPos;
        
        // Follow mode: câmera segue usuário
        if (followMode && mapRef.current) {
          mapRef.current.easeTo({
            center: newPos,
            zoom: Math.max(viewState.zoom, 16),
            pitch: MAPBOX_CONFIG.DEFAULT_PITCH,
            bearing: userHeading,
            duration: MAPBOX_CONFIG.ANIMATION_DURATION
          });
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        if (error.code === 1) {
          toast.error('📍 Permissão de localização negada');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000
      }
    );

    // Posição inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = [position.coords.longitude, position.coords.latitude];
        setUserLocation(pos);
        lastUserPosRef.current = pos;
      },
      () => {}
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [followMode, userHeading, viewState.zoom]);

  // Animar motoristas com movimento suave
  useEffect(() => {
    nearbyDrivers.forEach(driver => {
      const driverId = driver.id || `${driver.lat}-${driver.lng}`;
      const prevDriver = driversWithHeading.find(d => d.id === driverId);
      
      if (prevDriver && (prevDriver.lat !== driver.lat || prevDriver.lng !== driver.lng)) {
        // Calcular heading
        const heading = calculateHeading(
          prevDriver.lat, prevDriver.lng,
          driver.lat, driver.lng
        );
        
        // Animar movimento
        if (driverAnimationsRef.current[driverId]) {
          clearTimeout(driverAnimationsRef.current[driverId]);
        }
        
        driverAnimationsRef.current[driverId] = setTimeout(() => {
          setDriversWithHeading(prev => 
            prev.map(d => d.id === driverId 
              ? { ...driver, id: driverId, heading, lat: driver.lat, lng: driver.lng }
              : d
            )
          );
        }, 100);
      } else if (!prevDriver) {
        // Novo motorista
        setDriversWithHeading(prev => [...prev, { ...driver, id: driverId, heading: 0 }]);
      }
    });
  }, [nearbyDrivers]);

  // Calcular rota e animar
  useEffect(() => {
    if (showRoute && pickupLocation && destinationLocation) {
      const getRoute = async () => {
        try {
          console.log('📍 Calculando rota...');
          const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupLocation.lng},${pickupLocation.lat};${destinationLocation.lng},${destinationLocation.lat}?geometries=geojson&access_token=${MAPBOX_CONFIG.ACCESS_TOKEN}`
          );
          const data = await response.json();
          
          if (data.routes && data.routes[0]) {
            const route = {
              type: 'Feature',
              geometry: data.routes[0].geometry
            };
            setRouteData(route);
            console.log('✅ Rota calculada');
            
            // Animar rota progressivamente
            animateRoute(data.routes[0].geometry.coordinates);
            
            // Fit bounds
            if (mapRef.current) {
              const coords = data.routes[0].geometry.coordinates;
              const bounds = coords.reduce((bounds, coord) => {
                return bounds.extend(coord);
              }, new mapboxgl.LngLatBounds(coords[0], coords[0]));
              
              mapRef.current.fitBounds(bounds, { 
                padding: 80, 
                duration: 1000,
                pitch: MAPBOX_CONFIG.DEFAULT_PITCH 
              });
            }
          }
        } catch (error) {
          console.error('❌ Erro ao calcular rota:', error);
          toast.error('Erro ao calcular rota');
        }
      };
      
      getRoute();
    } else {
      setRouteData(null);
      setRouteProgress(null);
      if (routeAnimationRef.current) {
        cancelAnimationFrame(routeAnimationRef.current);
      }
    }
  }, [showRoute, pickupLocation, destinationLocation]);

  // Animação da rota
  const animateRoute = useCallback((coordinates) => {
    if (routeAnimationRef.current) {
      cancelAnimationFrame(routeAnimationRef.current);
    }
    
    const totalPoints = coordinates.length;
    let currentIndex = 0;
    const startTime = Date.now();
    const animationDuration = 2000; // 2s para animar toda a rota
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Easing suave
      const eased = 1 - Math.pow(1 - progress, 3);
      currentIndex = Math.floor(eased * totalPoints);
      
      if (currentIndex > 0) {
        const progressCoords = coordinates.slice(0, currentIndex);
        setRouteProgress({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: progressCoords
          }
        });
      }
      
      if (progress < 1) {
        routeAnimationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, []);

  // Desativar follow mode temporariamente ao arrastar
  const handleMoveStart = useCallback(() => {
    if (followMode) {
      setFollowMode(false);
      
      // Reativar após 8s
      if (followTimeoutRef.current) {
        clearTimeout(followTimeoutRef.current);
      }
      followTimeoutRef.current = setTimeout(() => {
        setFollowMode(true);
        toast.success('📍 Modo seguir reativado');
      }, MAPBOX_CONFIG.FOLLOW_MODE_TIMEOUT);
    }
  }, [followMode]);

  const handleToggleFollow = () => {
    const newFollowMode = !followMode;
    setFollowMode(newFollowMode);
    
    if (followTimeoutRef.current) {
      clearTimeout(followTimeoutRef.current);
    }
    
    if (newFollowMode && userLocation && mapRef.current) {
      mapRef.current.easeTo({
        center: userLocation,
        zoom: 16,
        pitch: MAPBOX_CONFIG.DEFAULT_PITCH,
        bearing: userHeading,
        duration: MAPBOX_CONFIG.ANIMATION_DURATION
      });
      toast.success('📍 Modo seguir ativado');
    } else if (!newFollowMode) {
      toast.info('🗺️ Modo livre');
    }
  };

  const handleMapClick = useCallback(async (event) => {
    if (onMapClick) {
      onMapClick(event.lngLat.lat, event.lngLat.lng);
    }
    
    // Reverse geocoding ao clicar
    if (onDestinationSelected) {
      try {
        const result = await reverseGeocode(event.lngLat.lat, event.lngLat.lng);
        if (result) {
          const address = `${result.street || ''}${result.housenumber ? ', ' + result.housenumber : ''}${result.city ? ' - ' + result.city : ''}`;
          onDestinationSelected({
            lat: event.lngLat.lat,
            lng: event.lngLat.lng,
            address: address.trim() || 'Local selecionado'
          });
          toast.success('📍 Destino selecionado no mapa');
        }
      } catch (error) {
        console.error('❌ Erro no reverse geocoding:', error);
      }
    }
  }, [onMapClick, onDestinationSelected]);

  const onMarkerDragEnd = useCallback((event, type) => {
    const { lngLat } = event;
    if (type === 'pickup' && onPickupDragEnd) {
      onPickupDragEnd(lngLat.lat, lngLat.lng);
    } else if (type === 'destination' && onDestinationDragEnd) {
      onDestinationDragEnd(lngLat.lat, lngLat.lng);
    }
  }, [onPickupDragEnd, onDestinationDragEnd]);

  return (
    <div className={`relative rounded-2xl overflow-hidden h-[360px] w-full ${className}`}>
      <style>{`
        .mapboxgl-ctrl-logo { display: none !important; }
        .mapboxgl-ctrl-attrib { display: none !important; }
        
        .follow-button {
          position: absolute;
          bottom: 20px;
          right: 20px;
          z-index: 10;
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

      <button
        onClick={handleToggleFollow}
        className={`follow-button ${followMode ? 'active' : ''}`}
        title={followMode ? 'Modo seguir ativo' : 'Ativar modo seguir'}
      >
        <Target className="w-6 h-6" style={{ color: followMode ? 'white' : '#F22998' }} />
      </button>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onDragStart={handleMoveStart}
        onClick={handleMapClick}
        mapStyle={MAPBOX_CONFIG.MAP_STYLE}
        mapboxAccessToken={MAPBOX_CONFIG.ACCESS_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        antialias={true}
      >
        <NavigationControl position="top-left" showCompass={true} />

        {/* Rota base */}
        {routeData && (
          <Source type="geojson" data={routeData}>
            <Layer
              id="route-base"
              type="line"
              paint={{
                'line-color': MAPBOX_CONFIG.ROUTE_STYLE.color,
                'line-width': MAPBOX_CONFIG.ROUTE_STYLE.width,
                'line-opacity': MAPBOX_CONFIG.ROUTE_STYLE.opacity
              }}
            />
          </Source>
        )}

        {/* Rota animada (progresso) */}
        {routeProgress && (
          <Source type="geojson" data={routeProgress}>
            <Layer
              id="route-progress"
              type="line"
              paint={{
                'line-color': MAPBOX_CONFIG.ROUTE_PROGRESS_STYLE.color,
                'line-width': MAPBOX_CONFIG.ROUTE_PROGRESS_STYLE.width,
                'line-opacity': MAPBOX_CONFIG.ROUTE_PROGRESS_STYLE.opacity
              }}
            />
          </Source>
        )}

        {/* User location */}
        {userLocation && (
          <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="center">
            <UserMarker heading={userHeading} />
          </Marker>
        )}

        {/* Pickup */}
        {pickupLocation && (
          <Marker
            longitude={pickupLocation.lng}
            latitude={pickupLocation.lat}
            anchor="bottom"
            draggable={pickupDraggable}
            onDragEnd={(e) => onMarkerDragEnd(e, 'pickup')}
          >
            <PickupMarker />
          </Marker>
        )}

        {/* Destination */}
        {destinationLocation && (
          <Marker
            longitude={destinationLocation.lng}
            latitude={destinationLocation.lat}
            anchor="bottom"
            draggable={destinationDraggable}
            onDragEnd={(e) => onMarkerDragEnd(e, 'destination')}
          >
            <DestinationMarker />
          </Marker>
        )}

        {/* Motoristas com heading */}
        {driversWithHeading.map((driver) => (
          <Marker
            key={driver.id}
            longitude={driver.lng}
            latitude={driver.lat}
            anchor="center"
          >
            <CarMarker tags={driver.tags || []} heading={driver.heading || 0} />
          </Marker>
        ))}
      </Map>
    </div>
  );
}