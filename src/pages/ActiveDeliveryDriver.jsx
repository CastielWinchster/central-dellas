import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MapView from '@/components/map/MapView';
import { Phone, MapPin, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const PACKAGE_SIZE_LABELS = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };
const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão', cash: 'Dinheiro' };

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function ActiveDeliveryDriver() {
  const [searchParams] = useSearchParams();
  const rideId = searchParams.get('id');
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [passenger, setPassenger] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [distToPickup, setDistToPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const watchIdRef = useRef(null);
  const lastGpsPosRef = useRef(null);

  const pickupLocationMemo = useMemo(() => ride ? { lat: ride.pickup_lat, lng: ride.pickup_lng } : null, [ride?.pickup_lat, ride?.pickup_lng]);
  const destinationLocationMemo = useMemo(() => ride ? { lat: ride.dropoff_lat, lng: ride.dropoff_lng } : null, [ride?.dropoff_lat, ride?.dropoff_lng]);

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
        const passengers = await base44.entities.User.filter({ id: rideData.passenger_id });
        setPassenger(passengers[0] || null);
        setLoading(false);
      } catch (error) {
        console.error('[ActiveDeliveryDriver]', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [rideId]);

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) return;
    const haversineMeters = (lat1, lng1, lat2, lng2) => {
      const R = 6371000;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 50) return;
        if (lastGpsPosRef.current) {
          const dist = haversineMeters(lastGpsPosRef.current.lat, lastGpsPosRef.current.lng, latitude, longitude);
          if (dist < 5) return;
        }
        const loc = { lat: latitude, lng: longitude };
        lastGpsPosRef.current = loc;
        setMyLocation(loc);
      },
      (err) => console.warn('[GPS]', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
    );
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  // Atualizar distância e presença
  useEffect(() => {
    if (!ride || !myLocation) return;
    const dist = haversine(myLocation.lat, myLocation.lng, ride.pickup_lat, ride.pickup_lng);
    setDistToPickup(dist);
    if (currentUser) {
      base44.entities.DriverPresence.filter({ driver_id: currentUser.id }).then(rows => {
        if (rows.length > 0) {
          base44.entities.DriverPresence.update(rows[0].id, { lat: myLocation.lat, lng: myLocation.lng, last_seen_at: new Date().toISOString() }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [myLocation, ride, currentUser]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await base44.entities.Ride.update(rideId, { status: newStatus });
      setRide(prev => ({ ...prev, status: newStatus }));
      if (newStatus === 'delivered') {
        toast.success('✅ Entrega confirmada!');
        navigate('/DriverDashboard');
      } else {
        toast.success('Status atualizado!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0D0D]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#F22998]/20 border-t-[#F22998] animate-spin mx-auto mb-4" />
          <p className="text-white">Carregando entrega...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0D0D]">
        <div className="text-center text-white">
          <p>Entrega não encontrada</p>
          <button onClick={() => navigate('/DriverDashboard')} className="mt-4 text-[#F22998]">Voltar</button>
        </div>
      </div>
    );
  }

  const ridePrice = ride.driver_price || ride.driver_confirmed_price || ride.estimated_price;

  return (
    <div className="h-screen w-full bg-[#0D0D0D] flex flex-col overflow-hidden">
      {/* Mapa — 60% */}
      <div className="relative" style={{ height: '60vh' }}>
        <MapView
          pickupLocation={pickupLocationMemo}
          destinationLocation={destinationLocationMemo}
          showRoute={true}
          driverLocation={myLocation}
          className="h-full w-full"
        />

        {/* Badge status */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-amber-500 text-white px-5 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold"
          >
            📦 Entrega em andamento
          </motion.div>
        </div>

        {/* Distância até coleta */}
        {distToPickup != null && ride.status === 'accepted' && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-[#0D0D0D]/90 backdrop-blur text-white px-4 py-3 rounded-2xl shadow-lg border border-[#F22998]/20">
              <p className="text-xs text-gray-400 mb-0.5">Até coleta</p>
              <p className="text-xl font-bold leading-none">{distToPickup.toFixed(1)} km</p>
            </div>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="flex-1 bg-[#111118] rounded-t-3xl -mt-5 relative z-20 overflow-y-auto px-5 pt-5 pb-6">

        {/* Cliente */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full border-2 border-[#F22998] overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
            {(() => {
              const foto = passenger?.photo_url || passenger?.profile_picture || passenger?.avatar || null;
              const nome = passenger?.full_name || passenger?.name || 'Cliente';
              return foto
                ? <img src={foto} alt={nome} className="w-full h-full object-cover" />
                : <span className="text-white text-xl font-bold">{nome.charAt(0)}</span>;
            })()}
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold leading-tight">{passenger?.full_name || passenger?.name || 'Cliente'}</h3>
            <p className="text-gray-400 text-sm mt-0.5">Cliente</p>
          </div>
          {passenger?.phone && (
            <a href={`tel:+55${passenger.phone.replace(/\D/g, '')}`}
              className="w-11 h-11 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors">
              <Phone className="w-5 h-5 text-white" />
            </a>
          )}
        </div>

        {/* Rota */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Coleta</p>
              <p className="text-white text-sm">{ride.pickup_text}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
            <MapPin className="w-3.5 h-3.5 text-[#F22998] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Entrega</p>
              <p className="text-white text-sm">{ride.dropoff_text}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[#0D0D0D] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Pacote</p>
            <p className="text-white text-xs font-medium">{PACKAGE_SIZE_LABELS[ride.package_size] || '—'}</p>
          </div>
          <div className="bg-[#0D0D0D] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Valor</p>
            <p className="text-green-400 font-bold text-sm">R$ {Number(ridePrice || 0).toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="bg-[#0D0D0D] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Pagamento</p>
            <p className="text-white text-xs font-medium">{PAYMENT_LABELS[ride.payment_method] || ride.payment_method || '—'}</p>
          </div>
        </div>

        {/* Botões de avanço de status */}
        {ride.status === 'accepted' && (
          <button
            onClick={() => handleStatusUpdate('picked_up')}
            disabled={updating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2"
          >
            {updating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Cheguei ao local de coleta
          </button>
        )}

        {ride.status === 'picked_up' && (
          <button
            onClick={() => handleStatusUpdate('in_transit')}
            disabled={updating}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2"
          >
            {updating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>🚚</span>}
            Iniciar entrega (saí para entregar)
          </button>
        )}

        {ride.status === 'in_transit' && (
          <button
            onClick={() => handleStatusUpdate('delivered')}
            disabled={updating}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2"
          >
            {updating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>🎉</span>}
            Confirmar entrega realizada
          </button>
        )}

        {/* Cancelar — apenas se ainda não coletou */}
        {ride.status === 'accepted' && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full mt-3 py-3 rounded-xl border border-red-500/50 text-red-400 font-medium text-sm hover:bg-red-500/10 transition-colors"
          >
            Cancelar Entrega
          </button>
        )}

        {/* Modal confirmação cancelamento */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm border border-red-500/30">
              <h3 className="text-white font-bold text-lg mb-2">Cancelar entrega?</h3>
              <p className="text-gray-400 text-sm mb-6">Tem certeza que deseja cancelar esta entrega? O cliente será notificado.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-medium">Voltar</button>
                <button
                  onClick={async () => {
                    try {
                      await base44.entities.Ride.update(rideId, { status: 'cancelled' });
                      toast.info('Entrega cancelada.');
                      navigate('/DriverDashboard');
                    } catch (_) { toast.error('Erro ao cancelar.'); }
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                >
                  Cancelar Entrega
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}