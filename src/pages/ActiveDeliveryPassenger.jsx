import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MapView from '@/components/map/MapView';
import { Phone, MessageCircle, Package, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const DELIVERY_STEPS = [
  { key: 'requested', label: 'Pedido confirmado', icon: '📦' },
  { key: 'accepted',  label: 'Entregador a caminho', icon: '🚗' },
  { key: 'picked_up', label: 'Coletado', icon: '✅' },
  { key: 'in_transit', label: 'Em rota', icon: '🚚' },
  { key: 'delivered', label: 'Entregue!', icon: '🎉' },
];

const PACKAGE_SIZE_LABELS = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };
const PAYMENT_LABELS = { pix: 'PIX', credit_card: 'Cartão', cash: 'Dinheiro' };

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function ActiveDeliveryPassenger() {
  const [searchParams] = useSearchParams();
  const rideId = searchParams.get('id');
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverETA, setDriverETA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const intervalRef = useRef(null);

  const pickupLocationMemo = useMemo(() => ride ? { lat: ride.pickup_lat, lng: ride.pickup_lng } : null, [ride?.pickup_lat, ride?.pickup_lng]);
  const destinationLocationMemo = useMemo(() => ride ? { lat: ride.dropoff_lat, lng: ride.dropoff_lng } : null, [ride?.dropoff_lat, ride?.dropoff_lng]);

  const fetchData = async () => {
    if (!rideId) return;
    try {
      const rides = await base44.entities.Ride.filter({ id: rideId });
      if (!rides.length) return;
      const rideData = rides[0];
      setRide(rideData);

      if (rideData.status === 'delivered' || rideData.status === 'cancelled') {
        clearInterval(intervalRef.current);
        if (rideData.status === 'delivered') {
          toast.success('🎉 Entrega realizada com sucesso!');
        } else if (rideData.status === 'cancelled') {
          toast.error('A entrega foi cancelada pelo entregador.');
          navigate('/');
          return;
        }
        return;
      }

      if (rideData.assigned_driver_id) {
        try {
          const res = await base44.functions.invoke('getDriverInfo', { driverId: rideData.assigned_driver_id });
          const info = res.data || {};
          setDriver({ id: rideData.assigned_driver_id, name: info.name || 'Entregador', photo: info.photo || null, phone: info.phone || null });
        } catch (_) {}

        const presence = await base44.entities.DriverPresence.filter({ driver_id: rideData.assigned_driver_id });
        if (presence.length > 0) {
          const p = presence[0];
          const lat = p.lat ?? p.current_lat;
          const lng = p.lng ?? p.current_lng;
          if (lat && lng) {
            setDriverLocation({ lat, lng });
            const dist = haversine(lat, lng, rideData.pickup_lat, rideData.pickup_lng);
            setDriverETA(Math.max(1, Math.round(dist * 2)));
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('[ActiveDeliveryPassenger]', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 4000);
    return () => clearInterval(intervalRef.current);
  }, [rideId]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await base44.entities.Ride.update(rideId, { status: 'cancelled' });
      toast.info('Entrega cancelada');
      navigate('/');
    } catch (_) {
      toast.error('Erro ao cancelar');
    } finally {
      setCancelling(false);
    }
  };

  const currentStepIndex = ride ? DELIVERY_STEPS.findIndex(s => s.key === ride.status) : 0;

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
          <button onClick={() => navigate('/RequestDelivery')} className="mt-4 text-[#F22998]">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0D0D0D] flex flex-col overflow-hidden">
      {/* Mapa — 55% */}
      <div className="relative" style={{ height: '55vh' }}>
        <MapView
          pickupLocation={pickupLocationMemo}
          destinationLocation={destinationLocationMemo}
          showRoute={true}
          driverLocation={driverLocation}
          nearbyDrivers={driverLocation ? [{ id: ride.assigned_driver_id || 'driver', lat: driverLocation.lat, lng: driverLocation.lng, tags: [] }] : []}
          className="h-full w-full"
        />

        {/* ETA badge */}
        {driverETA && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-[#0D0D0D]/90 backdrop-blur text-white px-4 py-3 rounded-2xl shadow-lg border border-[#F22998]/20">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-[#F22998]" />
                <span className="text-xs text-gray-400">Chegada em</span>
              </div>
              <p className="text-2xl font-bold leading-none">{driverETA} min</p>
            </div>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="flex-1 bg-[#111118] rounded-t-3xl -mt-5 relative z-20 overflow-y-auto px-5 pt-5 pb-6">

        {/* Timeline de status */}
        <div className="mb-5">
          <div className="flex items-center justify-between relative">
            {/* linha de fundo */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/10" />
            {/* linha de progresso */}
            <div
              className="absolute top-4 left-4 h-0.5 bg-[#F22998] transition-all duration-500"
              style={{ width: currentStepIndex > 0 ? `${(currentStepIndex / (DELIVERY_STEPS.length - 1)) * (100 - (8 / DELIVERY_STEPS.length * 100))}%` : '0%' }}
            />
            {DELIVERY_STEPS.map((step, i) => {
              const done = i < currentStepIndex;
              const active = i === currentStepIndex;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    done ? 'bg-[#F22998]' : active ? 'bg-[#F22998]/30 border-2 border-[#F22998]' : 'bg-white/10'
                  } ${active ? 'animate-pulse' : ''}`}>
                    {step.icon}
                  </div>
                  <span className={`text-[9px] font-medium text-center max-w-[52px] leading-tight ${active ? 'text-[#F22998]' : done ? 'text-white/70' : 'text-white/30'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Entregador */}
        {driver && (
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full border-2 border-[#F22998] overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
              {driver.photo
                ? <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover" />
                : <span className="text-white text-xl font-bold">{driver.name?.charAt(0) || 'E'}</span>
              }
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold leading-tight">{driver.name}</h3>
              <p className="text-gray-400 text-sm mt-0.5">Entregador</p>
            </div>
            {driver.phone && (
              <a href={`tel:+55${driver.phone.replace(/\D/g, '')}`}
                className="w-11 h-11 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors">
                <Phone className="w-5 h-5 text-white" />
              </a>
            )}
          </div>
        )}

        {/* Dados da entrega */}
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

        {/* Info do pacote + preço */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[#0D0D0D] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Pacote</p>
            <p className="text-white text-xs font-medium">{PACKAGE_SIZE_LABELS[ride.package_size] || ride.package_size || '—'}</p>
          </div>
          <div className="bg-[#0D0D0D] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Valor</p>
            <p className="text-green-400 font-bold text-sm">R$ {Number(ride.driver_price || ride.estimated_price || 0).toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="bg-[#0D0D0D] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Pagamento</p>
            <p className="text-white text-xs font-medium">{PAYMENT_LABELS[ride.payment_method] || ride.payment_method || '—'}</p>
          </div>
        </div>

        {/* Cancelar — apenas se antes da coleta */}
        {(ride.status === 'requested' || ride.status === 'accepted') && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 rounded-xl border border-red-500/50 text-red-400 font-medium text-sm hover:bg-red-500/10 transition-colors"
          >
            {cancelling ? 'Cancelando...' : 'Cancelar Entrega'}
          </button>
        )}

        {/* Entregue */}
        {ride.status === 'delivered' && (
          <div className="text-center py-4">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-white font-bold text-lg">Entrega realizada!</p>
            <button onClick={() => navigate('/RequestDelivery')} className="mt-3 text-[#F22998] text-sm">Fazer nova entrega</button>
          </div>
        )}
      </div>
    </div>
  );
}