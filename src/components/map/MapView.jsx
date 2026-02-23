import React, { useEffect, useState, useRef, useCallback } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import { Car, MapPin, Target } from 'lucide-react';
import { toast } from 'sonner';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibHVpc2JyYWNhbGUiLCJhIjoiY21sd21xdHZvMGdxazNlcHp5Y204cGxyMSJ9.MZltiRZAp6dsx-HZkawDBA';

// Custom marker components
const UserMarker = () => (
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
    animation: 'pulse-user 2s infinite',
    transform: 'translate(-50%, -50%)'
  }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
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

const CarMarker = ({ tags = [] }) => {
  let color = '#F22998';
  if (tags.includes('aceita_pet')) color = '#a855f7';
  else if (tags.includes('frete')) color = '#3b82f6';
  
  return (
    <div style={{
      background: color,
      borderRadius: '50%',
      padding: 8,
      boxShadow: `0 0 20px ${color}99`,
      transform: 'translate(-50%, -50%)'
    }}>
      <Car className="w-5 h-5 text-white" />
    </div>
  );
};

export default function MapView({
  pickupLocation,
  destinationLocation,
  nearbyDrivers = [],
  center = [-47.8864, -20.7195], // [lng, lat] para Mapbox
  showRoute = false,
  className = '',
  showRealTimeDrivers = false,
  filterPets = false,
  onPickupDragEnd = null,
  onDestinationDragEnd = null,
  pickupDraggable = false,
  destinationDraggable = false,
  onMapClick = null
}) {
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: 14
  });
  
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [followUser, setFollowUser] = useState(true);
  const mapRef = useRef();
  const watchIdRef = useRef(null);

  // Track user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      toast.error('🚫 Seu navegador não suporta geolocalização');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([longitude, latitude]);
        
        if (followUser && mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            duration: 500
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationDenied(true);
        if (error.code === 1) {
          toast.error('📍 Permissão de localização negada');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [followUser]);

  // Calculate route when pickup and destination are set
  useEffect(() => {
    if (showRoute && pickupLocation && destinationLocation) {
      const getRoute = async () => {
        try {
          const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupLocation.lng},${pickupLocation.lat};${destinationLocation.lng},${destinationLocation.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
          );
          const data = await response.json();
          
          if (data.routes && data.routes[0]) {
            setRouteData({
              type: 'Feature',
              geometry: data.routes[0].geometry
            });
            
            // Fit bounds to show entire route
            if (mapRef.current) {
              const bounds = [
                [Math.min(pickupLocation.lng, destinationLocation.lng), Math.min(pickupLocation.lat, destinationLocation.lat)],
                [Math.max(pickupLocation.lng, destinationLocation.lng), Math.max(pickupLocation.lat, destinationLocation.lat)]
              ];
              mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
            }
          }
        } catch (error) {
          console.error('Erro ao calcular rota:', error);
        }
      };
      
      getRoute();
    } else {
      setRouteData(null);
    }
  }, [showRoute, pickupLocation, destinationLocation]);

  // Center on pickup location
  useEffect(() => {
    if (pickupLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [pickupLocation.lng, pickupLocation.lat],
        zoom: 15,
        duration: 1000
      });
    }
  }, [pickupLocation]);

  const handleToggleFollow = () => {
    const newFollowState = !followUser;
    setFollowUser(newFollowState);
    
    if (newFollowState && userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: userLocation,
        zoom: 16,
        duration: 800
      });
      toast.success('📍 Modo seguir ativado');
    } else if (!newFollowState) {
      toast.info('🗺️ Modo livre - arraste o mapa');
    }
  };

  const onMarkerDrag = useCallback((event, type) => {
    const { lngLat } = event;
    if (type === 'pickup' && onPickupDragEnd) {
      onPickupDragEnd(lngLat.lat, lngLat.lng);
    } else if (type === 'destination' && onDestinationDragEnd) {
      onDestinationDragEnd(lngLat.lat, lngLat.lng);
    }
  }, [onPickupDragEnd, onDestinationDragEnd]);

  const handleMapClick = useCallback((event) => {
    if (onMapClick) {
      onMapClick(event.lngLat.lat, event.lngLat.lng);
    }
  }, [onMapClick]);

  return (
    <div className={`relative rounded-2xl overflow-hidden h-[360px] w-full ${className}`}>
      <style>{`
        @keyframes pulse-user {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
        }
        .mapboxgl-ctrl-logo {
          display: none !important;
        }
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
        className={`follow-button ${followUser ? 'active' : ''}`}
        title={followUser ? 'Modo seguir ativo' : 'Ativar modo seguir'}
      >
        <Target className="w-6 h-6" style={{ color: followUser ? 'white' : '#F22998' }} />
      </button>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onDragStart={() => setFollowUser(false)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/luisbracale/cmlzdk84n003e01s29qedaex4"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="top-left" showCompass={false} />

        {/* Route line */}
        {routeData && (
          <Source type="geojson" data={routeData}>
            <Layer
              id="route"
              type="line"
              paint={{
                'line-color': '#F22998',
                'line-width': 5,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="center">
            <UserMarker />
          </Marker>
        )}

        {/* Pickup marker */}
        {pickupLocation && (
          <Marker
            longitude={pickupLocation.lng}
            latitude={pickupLocation.lat}
            anchor="bottom"
            draggable={pickupDraggable}
            onDragEnd={(e) => onMarkerDrag(e, 'pickup')}
          >
            <PickupMarker />
          </Marker>
        )}

        {/* Destination marker */}
        {destinationLocation && (
          <Marker
            longitude={destinationLocation.lng}
            latitude={destinationLocation.lat}
            anchor="bottom"
            draggable={destinationDraggable}
            onDragEnd={(e) => onMarkerDrag(e, 'destination')}
          >
            <DestinationMarker />
          </Marker>
        )}

        {/* Nearby drivers */}
        {nearbyDrivers.map((driver, index) => (
          <Marker
            key={index}
            longitude={driver.lng}
            latitude={driver.lat}
            anchor="center"
          >
            <CarMarker tags={driver.tags || []} />
          </Marker>
        ))}
      </Map>
    </div>
  );
}