import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MapView from '@/components/map/MapView';
import RideChat from '@/components/chat/RideChat';
import { Phone, MessageCircle, User, Car, Clock, MapPin, Star, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function ActiveRidePassenger() {
  const [searchParams] = useSearchParams();
  const rideId = searchParams.get('id');
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverETA, setDriverETA] = useState(null);
  const [driverDist, setDriverDist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    if (!rideId) return;
    try {
      // Buscar corrida
      const rides = await base44.entities.Ride.filter({ id: rideId });
      if (!rides.length) return;
      const rideData = rides[0];
      setRide(rideData);

      // Se corrida concluída/cancelada sair
      if (rideData.status === 'completed' || rideData.status === 'cancelled') {
        clearInterval(intervalRef.current);
        toast.info('Corrida encerrada');
        navigate('/RequestRide');
        return;
      }

      if (rideData.assigned_driver_id) {
        // Buscar motorista via backend
        try {
          const res = await base44.functions.invoke('getDriverInfo', { driverId: rideData.assigned_driver_id });
          const info = res.data || {};
          setDriver({
            id: rideData.assigned_driver_id,
            name: info.name || 'Motorista',
            photo: info.photo || null,
            phone: info.phone || null,
            rating: info.rating ?? 4.9,
            totalRides: info.totalRides ?? 0,
          });
          if (info.vehicle) setVehicle(info.vehicle);
        } catch (e) {
          console.warn('[ActiveRidePassenger] getDriverInfo error:', e);
        }

        // Buscar localização da motorista
        const presence = await base44.entities.DriverPresence.filter({ driver_id: rideData.assigned_driver_id });
        if (presence.length > 0) {
          const p = presence[0];
          const lat = p.lat ?? p.current_lat;
          const lng = p.lng ?? p.current_lng;
          if (lat && lng) {
            setDriverLocation({ lat, lng });
            const dist = haversine(lat, lng, rideData.pickup_lat, rideData.pickup_lng);
            setDriverDist(dist);
            setDriverETA(Math.max(1, Math.round(dist * 2)));
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('[ActiveRidePassenger]', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 4000);
    return () => clearInterval(intervalRef.current);
  }, [rideId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0D0D]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#F22998]/20 border-t-[#F22998] animate-spin mx-auto mb-4" />
          <p className="text-white">Carregando corrida...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0D0D]">
        <div className="text-center text-white">
          <p>Corrida não encontrada</p>
          <button onClick={() => navigate('/RequestRide')} className="mt-4 text-[#F22998]">Voltar</button>
        </div>
      </div>
    );
  }

  const ridePrice = ride.driver_confirmed_price || ride.agreed_price || ride.estimated_price;

  return (
    <div className="h-screen w-full bg-[#0D0D0D] flex flex-col overflow-hidden">
      {/* MAPA — 65% da tela */}
      <div className="relative" style={{ height: '65vh' }}>
        <MapView
          pickupLocation={{ lat: ride.pickup_lat, lng: ride.pickup_lng }}
          destinationLocation={{ lat: ride.dropoff_lat, lng: ride.dropoff_lng }}
          showRoute={true}
          driverLocation={driverLocation}
          className="h-full w-full"
        />

        {/* Status Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-green-600 text-white px-5 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold"
          >
            <Car className="w-4 h-4" />
            Motorista a caminho
          </motion.div>
        </div>

        {/* ETA */}
        {driverETA != null && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-[#0D0D0D]/90 backdrop-blur text-white px-4 py-3 rounded-2xl shadow-lg border border-[#F22998]/20">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-[#F22998]" />
                <span className="text-xs text-gray-400">Chegada em</span>
              </div>
              <p className="text-2xl font-bold leading-none">{driverETA} min</p>
              {driverDist != null && (
                <p className="text-xs text-gray-400 mt-0.5">{driverDist.toFixed(1)} km</p>
              )}
            </div>
          </div>
        )}

        {/* Segurança */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-[#0D0D0D]/80 backdrop-blur text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs">
            <Shield className="w-3.5 h-3.5 text-[#F22998]" />
            Motorista verificada
          </div>
        </div>
      </div>

      {/* CARD — restante da tela */}
      <div className="flex-1 bg-[#111118] rounded-t-3xl -mt-5 relative z-20 overflow-y-auto px-5 pt-5 pb-6">

        {/* Motorista */}
        {driver && (
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-[#F22998] overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
              {driver.photo
                ? <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover" />
                : <User className="w-7 h-7 text-white" />
              }
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg leading-tight">{driver.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span>{driver.rating?.toFixed(1)}</span>
                {driver.totalRides > 0 && <span>• {driver.totalRides} corridas</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {driver.phone && (
                <a
                  href={`tel:+55${driver.phone.replace(/\D/g, '')}`}
                  className="w-11 h-11 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
                >
                  <Phone className="w-5 h-5 text-white" />
                </a>
              )}
              <button
                onClick={() => setIsChatOpen(true)}
                className="w-11 h-11 rounded-full bg-[#F22998] hover:bg-[#BF3B79] flex items-center justify-center transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Veículo */}
        {vehicle && (
          <div className="bg-[#0D0D0D] rounded-2xl mb-4 overflow-hidden">
            {vehicle.photo_url && (
              <img
                src={vehicle.photo_url}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-32 object-cover"
              />
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-white font-semibold">{vehicle.brand} {vehicle.model}</p>
                <p className="text-gray-400 text-sm">{vehicle.color} • {vehicle.year}</p>
              </div>
              <div className="bg-[#1a1a2e] px-4 py-2 rounded-lg border border-[#F22998]/30">
                <p className="text-[#F22998] font-bold text-sm tracking-wider">{vehicle.plate}</p>
              </div>
            </div>
          </div>
        )}

        {/* Rota */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Origem</p>
              <p className="text-white text-sm">{ride.pickup_text}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
            <MapPin className="w-3.5 h-3.5 text-[#F22998] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Destino</p>
              <p className="text-white text-sm">{ride.dropoff_text}</p>
            </div>
          </div>
        </div>

        {/* Preço */}
        {ridePrice && (
          <div className="flex items-center justify-between bg-gradient-to-r from-[#BF3B79]/20 to-[#F22998]/20 border border-[#F22998]/20 rounded-xl px-4 py-3">
            <span className="text-gray-400 text-sm">Valor da corrida</span>
            <span className="text-[#F22998] font-bold text-lg">R$ {Number(ridePrice).toFixed(2).replace('.', ',')}</span>
          </div>
        )}
      </div>

      {/* Chat */}
      <RideChat
        rideId={ride.id}
        currentUserId={ride.passenger_id}
        otherUser={{ name: driver?.name, photo: driver?.photo }}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        rideStatus={ride.status || 'accepted'}
      />
    </div>
  );
}