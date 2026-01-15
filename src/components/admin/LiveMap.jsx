import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin, Clock, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import L from 'leaflet';

// Configurar ícone personalizado para motoristas
const driverIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #BF3B79, #F22998); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(242,41,152,0.5);">
    <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
  </div>`,
  className: 'custom-driver-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const activeRideIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #10b981, #059669); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(16,185,129,0.5); animation: pulse 2s infinite;">
    <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
  </div>`,
  className: 'custom-active-ride-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

export default function LiveMap() {
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);
  const [center, setCenter] = useState([-23.5505, -46.6333]); // São Paulo

  useEffect(() => {
    loadDriversAndRides();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(loadDriversAndRides, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDriversAndRides = async () => {
    try {
      // Buscar motoristas ativas
      const allDrivers = await base44.entities.User.filter({ 
        user_type: 'driver'
      });
      
      const activeDrivers = allDrivers.filter(d => d.is_online && d.current_lat && d.current_lng);
      setDrivers(activeDrivers);

      // Buscar corridas ativas
      const allRides = await base44.entities.Ride.list();
      const activeRides = allRides.filter(r => 
        ['searching', 'accepted', 'arriving', 'in_progress'].includes(r.status)
      );
      setRides(activeRides);

      // Centralizar mapa na primeira motorista ativa
      if (activeDrivers.length > 0) {
        setCenter([activeDrivers[0].current_lat, activeDrivers[0].current_lng]);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-[#F2F2F2]/60 text-sm">Motoristas Online</p>
              <p className="text-2xl font-bold text-[#F2F2F2]">{drivers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[#F2F2F2]/60 text-sm">Corridas Ativas</p>
              <p className="text-2xl font-bold text-[#F2F2F2]">{rides.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F22998]/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#F22998]" />
            </div>
            <div>
              <p className="text-[#F2F2F2]/60 text-sm">Última Atualização</p>
              <p className="text-sm font-semibold text-[#F2F2F2]">
                {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Map */}
      <Card className="overflow-hidden rounded-2xl">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '600px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Motoristas disponíveis */}
          {drivers.map((driver) => {
            const hasActiveRide = rides.some(r => r.driver_id === driver.id);
            
            return (
              <Marker
                key={driver.id}
                position={[driver.current_lat, driver.current_lng]}
                icon={hasActiveRide ? activeRideIcon : driverIcon}
              >
                <Popup>
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      {driver.photo_url ? (
                        <img 
                          src={driver.photo_url} 
                          alt={driver.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#F22998] flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{driver.full_name}</p>
                        <Badge className={hasActiveRide ? 'bg-green-500' : 'bg-[#F22998]'}>
                          {hasActiveRide ? 'Em corrida' : 'Disponível'}
                        </Badge>
                      </div>
                    </div>
                    {driver.vehicle_model && (
                      <p className="text-xs text-gray-600">
                        🚗 {driver.vehicle_model} - {driver.vehicle_plate}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Círculos de cobertura */}
          {drivers.map((driver) => (
            <Circle
              key={`circle-${driver.id}`}
              center={[driver.current_lat, driver.current_lng]}
              radius={2000}
              pathOptions={{
                color: '#F22998',
                fillColor: '#F22998',
                fillOpacity: 0.1,
                weight: 1
              }}
            />
          ))}
        </MapContainer>
      </Card>
    </div>
  );
}