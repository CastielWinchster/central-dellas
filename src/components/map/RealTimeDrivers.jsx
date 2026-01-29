import React, { useEffect, useState, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { Car, MapPin, Phone, Star, Dog, Package } from 'lucide-react';
import L from 'leaflet';

// Criar ícone de carro personalizado
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

export default function RealTimeDrivers({ filterPets = false }) {
  const [drivers, setDrivers] = useState([]);
  const markersRef = useRef(new Map());
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        // Buscar motoristas online nos últimos 30 segundos
        const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
        const allDrivers = await base44.entities.DriverPresence.filter({
          is_online: true,
          last_seen_at: { $gte: thirtySecondsAgo }
        });

        // Buscar informações completas de cada motorista
        const driversWithInfo = await Promise.all(
          allDrivers.map(async (presence) => {
            try {
              // Buscar dados do usuário
              const userInfo = await base44.entities.User.filter({ id: presence.driver_id });
              const user = userInfo[0];
              
              // Buscar veículo
              const vehicles = await base44.entities.Vehicle.filter({ driver_id: presence.driver_id });
              const vehicle = vehicles[0];
              
              // Buscar avaliações
              const reviews = await base44.entities.Review.filter({ reviewed_id: presence.driver_id });
              const avgRating = reviews.length > 0 
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                : 5.0;
              
              // Buscar documento (para tags)
              const docs = await base44.entities.DriverDocument.filter({ user_id: presence.driver_id });
              const tags = [];
              // Adicionar lógica de tags se necessário
              
              return {
                ...presence,
                name: user?.full_name || 'Motorista',
                phone: user?.phone || 'Não informado',
                vehicle: vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.color}` : 'Não informado',
                rating: avgRating.toFixed(1),
                tags,
                location: 'Disponível' // Pode ser geocodificado reverso se necessário
              };
            } catch (error) {
              console.error('Erro ao buscar info do motorista:', error);
              return {
                ...presence,
                name: 'Motorista',
                phone: 'Não disponível',
                vehicle: 'Não informado',
                rating: '5.0',
                tags: [],
                location: 'Disponível'
              };
            }
          })
        );

        // Filtrar por pets se necessário
        const filtered = filterPets 
          ? driversWithInfo.filter(d => d.tags?.includes('aceita_pet'))
          : driversWithInfo;

        setDrivers(filtered);
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
      }
    };

    // Polling a cada 4 segundos
    fetchDrivers();
    pollingIntervalRef.current = setInterval(fetchDrivers, 4000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [filterPets]);

  // Animar markers suavemente
  const animateMarkerTo = (marker, fromLatLng, toLatLng, duration = 800) => {
    if (!marker || !fromLatLng || !toLatLng) return;
    
    const startTime = Date.now();
    const startLat = fromLatLng.lat;
    const startLng = fromLatLng.lng;
    const endLat = toLatLng.lat;
    const endLng = toLatLng.lng;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Interpolação suave
      const eased = 1 - Math.pow(1 - progress, 2);
      
      const currentLat = startLat + (endLat - startLat) * eased;
      const currentLng = startLng + (endLng - startLng) * eased;
      
      marker.setLatLng([currentLat, currentLng]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  return (
    <>
      {drivers.map((driver) => {
        const key = driver.driver_id;
        const existingMarker = markersRef.current.get(key);
        const newPosition = { lat: driver.lat, lng: driver.lng };

        // Se marker já existe, animar para nova posição
        if (existingMarker && existingMarker.position) {
          const oldPosition = existingMarker.position;
          const distance = Math.sqrt(
            Math.pow(oldPosition.lat - newPosition.lat, 2) +
            Math.pow(oldPosition.lng - newPosition.lng, 2)
          ) * 111000; // Aproximação em metros

          // Só animar se moveu mais de 10 metros
          if (distance > 10 && existingMarker.markerRef) {
            animateMarkerTo(
              existingMarker.markerRef,
              L.latLng(oldPosition.lat, oldPosition.lng),
              L.latLng(newPosition.lat, newPosition.lng)
            );
          }
        }

        // Atualizar registro
        markersRef.current.set(key, { position: newPosition, markerRef: null });

        return (
          <Marker
            key={key}
            position={[driver.lat, driver.lng]}
            icon={createCarIcon(driver.tags || [])}
            ref={(ref) => {
              if (ref) {
                const existing = markersRef.current.get(key);
                if (existing) {
                  existing.markerRef = ref;
                }
              }
            }}
          >
            <Popup className="custom-driver-popup">
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-base mb-2">{driver.name}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{driver.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-xs">{driver.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span className="text-xs">{driver.vehicle}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{driver.rating}</span>
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
        );
      })}
    </>
  );
}