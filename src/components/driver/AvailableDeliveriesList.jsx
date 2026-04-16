import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Navigation, RefreshCw, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

const PROXIMITY_KM = 15;

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PACKAGE_SIZE_LABELS = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
};

export default function AvailableDeliveriesList({ onRideSelect, onRideAccepted, selectedRideId, driverLocation }) {
  const [deliveries, setDeliveries] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingRef = useRef(null);
  const driverLocationRef = useRef(driverLocation);
  useEffect(() => { driverLocationRef.current = driverLocation; }, [driverLocation]);

  const fetchDeliveries = async () => {
    const loc = driverLocationRef.current;
    try {
      const results = await base44.entities.Ride.filter({
        status: 'requested',
        ride_type: 'delivery',
      }, '-created_date', 30);

      const enriched = results
        .map(ride => {
          const distKm = loc
            ? haversine(loc.lat, loc.lng, ride.pickup_lat, ride.pickup_lng)
            : null;
          const etaMin = distKm === null ? null
            : distKm < 0.1 ? 'Chegando'
            : Math.ceil((distKm / 30) * 60);
          return { ...ride, distance: distKm, etaMin };
        })
        .filter(r => r.distance === null || r.distance <= PROXIMITY_KM);

      setDeliveries(enriched);
    } catch (e) {
      console.error('[AvailableDeliveriesList] Erro:', e);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    pollingRef.current = setInterval(fetchDeliveries, 5000);
    return () => clearInterval(pollingRef.current);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDeliveries();
    setIsRefreshing(false);
  };

  const handleAccept = async (delivery, e) => {
    e.stopPropagation();
    try {
      const response = await base44.functions.invoke('acceptRideOffer', {
        rideId: delivery.id,
        offerId: null,
      });
      if (response.data?.success) {
        const accepted = response.data.ride;
        setDeliveries(prev => prev.filter(d => d.id !== delivery.id));
        if (onRideAccepted) {
          onRideAccepted(accepted);
        } else if (onRideSelect) {
          onRideSelect(accepted);
        }
      }
    } catch (err) {
      console.error('[AvailableDeliveriesList] Erro ao aceitar:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F2F2F2]">Entregas disponíveis</h2>
          <p className="text-[#F2F2F2]/50 text-sm">{deliveries.length} entregas próximas</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {deliveries.map((delivery, index) => {
            const isSelected = selectedRideId === delivery.id;
            const sizeLabel = PACKAGE_SIZE_LABELS[delivery.package_size] || delivery.package_size || null;

            return (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ delay: index * 0.07 }}
                layout
              >
                <Card
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#F22998]/10 border-[#F22998]'
                      : 'bg-[#F2F2F2]/5 border-[#F22998]/10 hover:border-[#F22998]/40'
                  }`}
                  onClick={() => onRideSelect && onRideSelect(isSelected ? null : delivery)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📦</span>
                      <div>
                        <p className="font-semibold text-[#F2F2F2] text-sm">Entrega</p>
                        {sizeLabel && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                            {sizeLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-lg font-bold text-[#F22998]">
                      R$ {delivery.estimated_price ? parseFloat(delivery.estimated_price).toFixed(2) : '—'}
                    </p>
                  </div>

                  {/* Rota */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-[#F2F2F2]">{delivery.pickup_text}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F22998] mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-[#F2F2F2]/80">{delivery.dropoff_text}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-3 pt-3 border-t border-[#F22998]/10 text-sm text-[#F2F2F2]/50">
                    {delivery.distance !== null && delivery.distance !== undefined && (
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5" />
                        {delivery.distance.toFixed(1)} km
                      </span>
                    )}
                    {delivery.etaMin !== null && delivery.etaMin !== undefined && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {typeof delivery.etaMin === 'string' ? delivery.etaMin : `${delivery.etaMin} min`}
                      </span>
                    )}
                  </div>

                  {/* Ações ao selecionar */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#F22998]/10"
                    >
                      <Button
                        onClick={(e) => { e.stopPropagation(); onRideSelect && onRideSelect(null); }}
                        variant="outline"
                        className="py-2 rounded-xl border-[#F22998]/30 text-[#F2F2F2]/60 hover:bg-[#F22998]/10"
                      >
                        <X className="w-4 h-4 mr-1" /> Ignorar
                      </Button>
                      <Button
                        onClick={(e) => handleAccept(delivery, e)}
                        className="py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Aceitar Entrega
                      </Button>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {deliveries.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <span className="text-4xl">📦</span>
            <p className="mt-2 text-sm text-[#F2F2F2]/50">Nenhuma entrega disponível no momento</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}