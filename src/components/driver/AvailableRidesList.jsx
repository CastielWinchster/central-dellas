import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, Navigation, Star, RefreshCw, CheckCircle, X, Dog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Locais reais de Orlândia - SP
const MOCK_RIDES = [
  {
    id: '1',
    passenger: {
      name: 'Carla Mendes',
      rating: 4.9,
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
    },
    pickup:      { address: 'Praça Coronel Almeida, Centro', lat: -20.7200, lng: -47.8865 },
    destination: { address: 'UPA Orlândia, Av. Brasil', lat: -20.7255, lng: -47.8920 },
    distance: 1.2,
    duration: 5,
    price: 12.00,
    rideType: 'standard',
    hasPet: false,
  },
  {
    id: '2',
    passenger: {
      name: 'Beatriz Santos',
      rating: 5.0,
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'
    },
    pickup:      { address: 'Terminal Rodoviário de Orlândia', lat: -20.7179, lng: -47.8830 },
    destination: { address: 'Hospital Nossa Senhora de Fátima', lat: -20.7310, lng: -47.8950 },
    distance: 2.4,
    duration: 9,
    price: 18.50,
    rideType: 'premium',
    hasPet: false,
  },
  {
    id: '3',
    passenger: {
      name: 'Julia Ferreira',
      rating: 4.7,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
    },
    pickup:      { address: 'Supermercado Beira Rio, Orlândia', lat: -20.7240, lng: -47.8800 },
    destination: { address: 'Parque Municipal de Orlândia', lat: -20.7160, lng: -47.8760 },
    distance: 1.5,
    duration: 7,
    price: 13.00,
    rideType: 'shared',
    hasPet: true,
  },
];

const rideTypeColors = {
  standard: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Standard' },
  premium:  { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Premium' },
  shared:   { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Carona' },
};

export default function AvailableRidesList({ onRideSelect, selectedRideId }) {
  const [rides, setRides] = useState(MOCK_RIDES);
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => { setRides(MOCK_RIDES); setIsRefreshing(false); }, 800);
  };

  const handleAccept = (ride) => {
    setRides(prev => prev.filter(r => r.id !== ride.id));
    onRideSelect(null);
  };

  const filteredRides = filter === 'all' ? rides : rides.filter(r => r.rideType === filter);

  return (
    <div className="space-y-4">
      {/* Header + Filtros */}
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
          { id: 'premium', label: 'Premium' },
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

      {/* Lista */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredRides.map((ride, index) => {
            const typeStyle = rideTypeColors[ride.rideType];
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
                      <img
                        src={ride.passenger.photo}
                        alt={ride.passenger.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-[#F22998]"
                      />
                      <div>
                        <h3 className="font-semibold text-[#F2F2F2] flex items-center gap-2">
                          {ride.passenger.name}
                          {ride.hasPet && (
                            <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center gap-1">
                              <Dog className="w-3 h-3" /> Pet
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-[#F2F2F2]/60">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          {ride.passenger.rating}
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
                      <p className="text-sm text-[#F2F2F2]">{ride.pickup.address}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F22998] mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-[#F2F2F2]/80">{ride.destination.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#F22998]/10">
                    <div className="flex items-center gap-3 text-sm text-[#F2F2F2]/50">
                      <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5" />{ride.distance} km</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{ride.duration} min</span>
                    </div>
                    <p className="text-lg font-bold text-[#F22998]">R$ {ride.price.toFixed(2)}</p>
                  </div>

                  {/* Botões quando selecionado */}
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
                        onClick={(e) => { e.stopPropagation(); handleAccept(ride); }}
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
            <p className="text-[#F2F2F2]/50">Nenhuma corrida disponível no momento</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}