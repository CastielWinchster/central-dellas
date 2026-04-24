import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Navigation, Star, RefreshCw, CheckCircle, X, Dog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

const PROXIMITY_KM = 15; // raio máximo para mostrar corridas

const rideTypeColors = {
  standard:   { bg: 'bg-blue-500/20',   text: 'text-blue-400',   label: 'Standard' },
  rotta_roza: { bg: 'bg-pink-500/20',   text: 'text-pink-400',   label: 'Rotta Roza' },
  premium:    { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Premium' },
  shared:     { bg: 'bg-green-500/20',  text: 'text-green-400',  label: 'Carona' },
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AvailableRidesList({ onRideSelect, onRideAccepted, selectedRideId, driverLocation }) {
  const [rides, setRides] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingRef = useRef(null);
  // Ref para sempre capturar o driverLocation mais recente dentro da closure do polling
  const driverLocationRef = useRef(driverLocation);
  useEffect(() => { driverLocationRef.current = driverLocation; }, [driverLocation]);

  const fetchRides = async () => {
    const loc = driverLocationRef.current;
    try {
      const response = await base44.functions.invoke('getAvailableRides', {
        driverLat: loc?.lat ?? null,
        driverLng: loc?.lng ?? null,
        radiusKm: PROXIMITY_KM,
      });

      const raw = response.data?.rides || [];

      // Deduplicar por ride.id
      const seen = new Map();
      raw.forEach(r => { if (!seen.has(r.id)) seen.set(r.id, r); });
      const fetched = Array.from(seen.values())
        .filter(r => r.ride_type !== 'delivery');

      const enriched = fetched.map(ride => {
        const distKm = ride.distance ?? (loc
          ? haversine(loc.lat, loc.lng, ride.pickup_lat, ride.pickup_lng)
          : null);
        // ETA em tempo real: distância motorista→passageira a 30 km/h
        let etaMin = null;
        if (distKm !== null) {
          if (distKm < 0.1) {
            etaMin = 'Chegando';
          } else {
            etaMin = Math.ceil((distKm / 30) * 60);
          }
        }
        return {
          ...ride,
          passengerRating: 4.8,
          distance: distKm,
          etaMin,
        };
      });

      setRides(enriched);
      console.log(`[AvailableRidesList] ${enriched.length} corridas encontradas | GPS: ${loc?.lat ?? 'sem GPS'}`);
    } catch (e) {
      console.error('[AvailableRidesList] Erro ao buscar corridas:', e);
    }
  };

  useEffect(() => {
    fetchRides();
    pollingRef.current = setInterval(fetchRides, 5000);
    return () => clearInterval(pollingRef.current);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRides();
    setIsRefreshing(false);
  };

  const handleAccept = async (ride, e) => {
    e.stopPropagation();
    try {
      const response = await base44.functions.invoke('acceptRideOffer', {
        rideId: ride.id,
        offerId: null
      });
      if (response.data?.success) {
        const acceptedRide = response.data.ride;
        setRides(prev => prev.filter(r => r.id !== ride.id));
        if (onRideAccepted) {
          onRideAccepted(acceptedRide);
        } else {
          onRideSelect(acceptedRide);
        }
      }
    } catch (err) {
      console.error('Erro ao aceitar corrida:', err);
    }
  };

  const filteredRides = filter === 'all' ? rides : rides.filter(r => r.ride_type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F2F2F2]">Passageiras disponíveis</h2>
          <p className="text-[#F2F2F2]/50 text-sm">{filteredRides.length} corridas próximas</p>
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'standard', label: 'Standard' },
          { id: 'rotta_roza', label: 'Rotta Roza' },
          { id: 'shared', label: 'Carona' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white'
                : 'bg-[#F2F2F2]/5 text-[#F2F2F2]/60 hover:bg-[#F22998]/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filteredRides.map((ride, index) => {
            const typeStyle = rideTypeColors[ride.ride_type] || rideTypeColors.standard;
            const isSelected = selectedRideId === ride.id;

            return (
              <motion.div
                key={ride.id}
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
                  onClick={() => onRideSelect(isSelected ? null : ride)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {ride.passengerPhoto ? (
                        <img src={ride.passengerPhoto} alt={ride.passengerName} className="w-11 h-11 rounded-full object-cover border-2 border-[#F22998]" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center border-2 border-[#F22998]">
                          <span className="text-white text-sm font-bold">{ride.passengerName[0]}</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-[#F2F2F2] flex items-center gap-2">
                          {ride.passengerName}
                          {ride.has_pet && (
                            <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center gap-1">
                              <Dog className="w-3 h-3" /> Pet
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-[#F2F2F2]/60">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          {ride.passengerRating}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${typeStyle.bg} ${typeStyle.text} border-0`}>
                      {typeStyle.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-[#F2F2F2]">{ride.pickup_text}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F22998] mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-[#F2F2F2]/80">{ride.dropoff_text}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#F22998]/10">
                    <div className="flex items-center gap-3 text-sm text-[#F2F2F2]/50">
                      {ride.distance !== null && (
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5" />
                          {ride.distance.toFixed(1)} km
                        </span>
                      )}
                      {ride.etaMin !== null && ride.etaMin !== undefined ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {typeof ride.etaMin === 'string' ? ride.etaMin : `${ride.etaMin} min`}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#F2F2F2]/30">
                          <Clock className="w-3.5 h-3.5" />
                          Tempo indisponível
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-[#F22998]">
                      R$ {ride.estimated_price ? parseFloat(ride.estimated_price).toFixed(2) : '—'}
                    </p>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#F22998]/10"
                    >
                      <Button
                        onClick={(e) => { e.stopPropagation(); onRideSelect(null); }}
                        variant="outline"
                        className="py-2 rounded-xl border-[#F22998]/30 text-[#F2F2F2]/60 hover:bg-[#F22998]/10"
                      >
                        <X className="w-4 h-4 mr-1" /> Ignorar
                      </Button>
                      <Button
                        onClick={(e) => handleAccept(ride, e)}
                        className="py-2 rounded-xl btn-gradient"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Aceitar
                      </Button>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredRides.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
            <MapPin className="w-12 h-12 text-[#F22998]/20 mx-auto mb-3" />
            <p className="text-[#F2F2F2]/50">Nenhuma corrida próxima no momento</p>
            <p className="text-[#F2F2F2]/30 text-xs mt-1">Raio de busca: {PROXIMITY_KM} km</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}