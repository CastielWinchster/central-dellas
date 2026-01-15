import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Car, MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'sonner';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for cars
const carIcon = new L.DivIcon({
  className: 'custom-car-marker',
  html: `<div style="background: linear-gradient(135deg, #BF3B79, #F22998); border-radius: 50%; padding: 8px; box-shadow: 0 0 20px rgba(242, 41, 152, 0.5);">
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

function MapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  
  return null;
}

export default function MapView({ 
  pickupLocation, 
  destinationLocation, 
  nearbyDrivers = [],
  center = [-23.5505, -46.6333], // São Paulo default
  className = ''
}) {
  const [mapCenter, setMapCenter] = useState(center);
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);

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
        .custom-car-marker, .custom-pickup-marker, .custom-destination-marker {
          background: transparent !important;
          border: none !important;
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
        <MapController center={mapCenter} />
        
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
        
        {/* Nearby drivers */}
        {nearbyDrivers.map((driver, index) => (
          <Marker 
            key={index} 
            position={[driver.lat, driver.lng]} 
            icon={carIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-medium">{driver.name || 'Motorista'}</p>
                <p className="text-gray-500">{driver.rating || 5}★</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}