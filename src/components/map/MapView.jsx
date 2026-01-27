import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Car, MapPin, Navigation, Phone, Dog, Package } from 'lucide-react';
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

function MapController({ center, pickup, destination, showRoute }) {
  const map = useMap();
  
  useEffect(() => {
    if (showRoute && pickup && destination) {
      // Ajustar zoom para mostrar toda a rota
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, pickup, destination, showRoute, map]);
  
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

  useEffect(() => {
    // Request user's geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userPos);
          setMapCenter(userPos);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationDenied(true);
        }
      );
    } else {
      setLocationDenied(true);
    }
  }, []);

  useEffect(() => {
    if (userLocation && !pickupLocation) {
      setMapCenter(userLocation);
    } else if (pickupLocation) {
      setMapCenter([pickupLocation.lat, pickupLocation.lng]);
    }
  }, [userLocation, pickupLocation]);

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
    html: `<div style="background: #3b82f6; border: 3px solid white; border-radius: 50%; padding: 8px; box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

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
      `}</style>
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
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup>
              <div className="text-sm font-medium">Você está aqui</div>
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