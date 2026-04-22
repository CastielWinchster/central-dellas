import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MapView from '@/components/map/MapView';
import RideChat from '@/components/chat/RideChat';
import { Phone, MessageCircle, User, MapPin, CheckCircle, Navigation, Star } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function ActiveRideDriver() {
  const [searchParams] = useSearchParams();
  const rideId = searchParams.get('id');
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [passenger, setPassenger] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [distToPickup, setDistToPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const watchIdRef = useRef(null);

  // Memoizar objetos de localização — DEVE ficar antes dos early returns (regra dos Hooks)
  const pickupLocationMemo = useMemo(() => ride ? { lat: ride.pickup_lat, lng: ride.pickup_lng } : null, [ride?.pickup_lat, ride?.pickup_lng]);
  const destinationLocationMemo = useMemo(() => ride ? { lat: ride.dropoff_lat, lng: ride.dropoff_lng } : null, [ride?.dropoff_lat, ride?.dropoff_lng]);
  const passengerPhoto = passenger?.photo_url || passenger?.profile_image || passenger?.avatar_url || passenger?.avatar || passenger?.photo || passenger?.picture || null;

  // Buscar dados da corrida
  useEffect(() => {
    const fetchData = async () => {
      if (!rideId) return;
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        const rides = await base44.entities.Ride.filter({ id: rideId });
        if (!rides.length) { setLoading(false); return; }
        const rideData = rides[0];
        setRide(rideData);

        // Buscar passageiro
        const passengers = await base44.entities.User.filter({ id: rideData.passenger_id });
        setPassenger(passengers[0] || null);

        setLoading(false);
      } catch (error) {
        console.error('[ActiveRideDriver]', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [rideId]);

  // GPS da motorista
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
      },
      (err) => console.warn('[GPS]', err),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Calcular distância até origem
  useEffect(() => {
    if (!ride || !myLocation) return;
    const dist = haversine(myLocation.lat, myLocation.lng, ride.pickup_lat, ride.pickup_lng);
    setDistToPickup(dist);

    // Atualizar presença no banco
    if (currentUser) {
      base44.entities.DriverPresence.filter({ driver_id: currentUser.id }).then(rows => {
        if (rows.length > 0) {
          base44.entities.DriverPresence.update(rows[0].id, {
            lat: myLocation.lat, lng: myLocation.lng,
            last_seen_at: new Date().toISOString()
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [myLocation, ride, currentUser]);

  const handleCompleteRide = async () => {
    setCompleting(true);
    try {
      await base44.entities.Ride.update(rideId, {
        status: 'completed',
      });
      toast.success('✅ Corrida concluída!');
      navigate('/DriverDashboard');
    } catch (error) {
      console.error('[handleCompleteRide]', error);
      toast.error('Erro ao concluir corrida');
    } finally {
      setCompleting(false);
    }
  };

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
          <button onClick={() => navigate('/DriverDashboard')} className="mt-4 text-[#F22998]">Voltar</button>
        </div>
      </div>
    );
  }

  const ridePrice = ride.driver_confirmed_price || ride.agreed_price || ride.estimated_price;

  return (
    <div className="h-screen w-full bg-[#0D0D0D] flex flex-col overflow-hidden">
      {/* MAPA — 65% */}
      <div className="relative" style={{ height: '65vh' }}>
        <MapView
          pickupLocation={pickupLocationMemo}
          destinationLocation={destinationLocationMemo}
          showRoute={true}
          driverLocation={myLocation}
          className="h-full w-full"
        />

        {/* Status Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#F22998] text-white px-5 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold"
          >
            <Navigation className="w-4 h-4" />
            Em rota
          </motion.div>
        </div>

        {/* Distância até passageiro */}
        {distToPickup != null && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-[#0D0D0D]/90 backdrop-blur text-white px-4 py-3 rounded-2xl shadow-lg border border-[#F22998]/20">
              <p className="text-xs text-gray-400 mb-0.5">Até passageira</p>
              <p className="text-xl font-bold leading-none">{distToPickup.toFixed(1)} km</p>
              <p className="text-xs text-gray-400 mt-0.5">~{Math.max(1, Math.round(distToPickup * 2))} min</p>
            </div>
          </div>
        )}
      </div>

      {/* CARD — restante */}
      <div className="flex-1 bg-[#111118] rounded-t-3xl -mt-5 relative z-20 overflow-y-auto px-5 pt-5 pb-6">

        {/* Passageiro */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full border-2 border-[#F22998] overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
            {passengerPhoto
              ? <img src={passengerPhoto} alt={passenger?.full_name || 'Passageiro'} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              : null
            }
            <span className="text-white text-2xl font-bold" style={{ display: passengerPhoto ? 'none' : 'flex' }}>
              {passenger?.full_name?.charAt(0)?.toUpperCase() || 'P'}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg leading-tight">{passenger?.full_name || 'Passageiro(a)'}</h3>
            {passenger?.phone && <p className="text-gray-400 text-sm mt-0.5">{passenger.phone}</p>}
          </div>
          <div className="flex gap-2">
            {passenger?.phone && (
              <a
                href={`tel:+55${passenger.phone.replace(/\D/g, '')}`}
                className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
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

        {/* Rota */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Ponto de Partida</p>
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

        {/* Grid de info */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[#0D0D0D] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Valor</p>
            <p className="text-green-400 font-bold text-sm">R$ {Number(ridePrice || 0).toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="bg-[#0D0D0D] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Pagamento</p>
            <p className="text-white text-xs font-medium">
              {(() => {
                const pm = ride.payment_method || ride.paymentMethod;
                if (!pm) return 'Não inf.';
                const labels = { pix: '💜 Pix', card: '💳 Cartão', cash: '💵 Dinheiro', credit_card: '💳 Crédito', debit_card: '💳 Débito' };
                return labels[pm] || pm;
              })()}
            </p>
          </div>
          <div className="bg-[#0D0D0D] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Tipo</p>
            <p className="text-white text-xs font-medium">
              {ride.ride_type === 'rotta_roza' ? '🏍 Moto' : ride.ride_type === 'delivery' ? '📦 Entrega' : '🚗 Carro'}
            </p>
          </div>
        </div>

        {/* Badge Intermunicipal */}
        {ride.is_intercity && (
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
            <span className="text-xl">🚗</span>
            <div>
              <p className="text-yellow-400 font-semibold text-sm">Corrida Intermunicipal</p>
              {ride.pickup_city && ride.dropoff_city && (
                <p className="text-gray-400 text-xs">{ride.pickup_city} → {ride.dropoff_city}</p>
              )}
            </div>
          </div>
        )}

        {/* Botão concluir */}
        <button
          onClick={handleCompleteRide}
          disabled={completing}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2"
        >
          {completing ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Concluindo...</>
          ) : (
            <><CheckCircle className="w-5 h-5" />Concluir Corrida</>
          )}
        </button>
        <p className="text-center text-gray-500 text-xs mt-2">Certifique-se de que a passageira chegou ao destino</p>
      </div>

      {/* Chat */}
      {currentUser && (
        <RideChat
          rideId={ride.id}
          currentUserId={currentUser.id}
          otherUser={{ name: passenger?.full_name, photo: passenger?.photo_url }}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          rideStatus={ride.status || 'accepted'}
        />
      )}
    </div>
  );
}