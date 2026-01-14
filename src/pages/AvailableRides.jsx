import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, DollarSign, Star, Navigation,
  RefreshCw, Filter, ChevronDown, CheckCircle, X, Dog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MapView from '../components/map/MapView';

export default function AvailableRides() {
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
    loadRides();
  }, []);

  const isDark = user?.theme !== 'light';

  const loadRides = () => {
    // Mock available rides
    setRides([
      {
        id: '1',
        passenger: {
          name: 'Carla Mendes',
          rating: 4.9,
          photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
        },
        pickup: { address: 'Av. Paulista, 1000', lat: -23.5605, lng: -46.6533 },
        destination: { address: 'Shopping Ibirapuera', lat: -23.5908, lng: -46.6584 },
        distance: 5.2,
        duration: 15,
        price: 28.50,
        rideType: 'standard',
        hasPet: false,
        createdAt: new Date(Date.now() - 120000).toISOString()
        },
      {
        id: '2',
        passenger: {
          name: 'Beatriz Santos',
          rating: 5.0,
          photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'
        },
        pickup: { address: 'Rua Augusta, 500', lat: -23.5550, lng: -46.6570 },
        destination: { address: 'Aeroporto Congonhas', lat: -23.6261, lng: -46.6564 },
        distance: 10.8,
        duration: 30,
        price: 55.00,
        rideType: 'premium',
        hasPet: false,
        createdAt: new Date(Date.now() - 300000).toISOString()
        },
      {
        id: '3',
        passenger: {
          name: 'Julia Ferreira',
          rating: 4.7,
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
        },
        pickup: { address: 'Shopping Eldorado', lat: -23.5720, lng: -46.6938 },
        destination: { address: 'Vila Madalena', lat: -23.5564, lng: -46.6867 },
        distance: 3.5,
        duration: 12,
        price: 18.00,
        rideType: 'shared',
        hasPet: true,
        createdAt: new Date(Date.now() - 60000).toISOString()
        }
    ]);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadRides();
      setIsRefreshing(false);
    }, 1000);
  };

  const handleAcceptRide = async (ride) => {
    // Accept ride logic
    setRides(rides.filter(r => r.id !== ride.id));
    setSelectedRide(null);
  };

  const rideTypeColors = {
    standard: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Standard' },
    premium: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Premium' },
    shared: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Carona' }
  };

  const filteredRides = filter === 'all' ? rides : rides.filter(r => r.rideType === filter);

  return (
    <div className={`min-h-screen pb-24 md:pb-10 ${isDark ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>Corridas Disponíveis</h1>
            <p className={isDark ? 'text-[#F2F2F2]/60' : 'text-black/80'}>{filteredRides.length} corridas próximas</p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {[
            { id: 'all', label: 'Todas' },
            { id: 'standard', label: 'Standard' },
            { id: 'premium', label: 'Premium' },
            { id: 'shared', label: 'Carona' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white'
                  : isDark ? 'bg-[#F2F2F2]/5 text-[#F2F2F2]/60 hover:bg-[#F22998]/10' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Rides List */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredRides.map((ride, index) => {
                const typeStyle = rideTypeColors[ride.rideType];
                
                return (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    layout
                  >
                    <Card
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedRide?.id === ride.id
                          ? 'bg-[#F22998]/10 border-[#F22998]'
                          : isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10 hover:border-[#F22998]/30' : 'bg-white border-gray-200 hover:border-[#F22998]/30'
                      }`}
                      onClick={() => setSelectedRide(ride)}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={ride.passenger.photo}
                            alt={ride.passenger.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#F22998]"
                          />
                          <div>
            <h3 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
                              {ride.passenger.name}
                              {ride.hasPet && (
                                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center gap-1">
                                  <Dog className="w-3 h-3" />
                                  Pet
                                </span>
                              )}
                            </h3>
                            <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-black'}`}>
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              {ride.passenger.rating}
                            </div>
                          </div>
                        </div>
                        <Badge className={`${typeStyle.bg} ${typeStyle.text} border-0`}>
                          {typeStyle.label}
                        </Badge>
                      </div>

                      {/* Route */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
                          <p className={`text-sm font-medium ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>{ride.pickup.address}</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#F22998] mt-1.5" />
                          <p className={`text-sm ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>{ride.destination.address}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-[#F22998]/10' : 'border-gray-200'}`}>
                        <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-black/70'}`}>
                          <span className="flex items-center gap-1">
                            <Navigation className="w-4 h-4" />
                            {ride.distance} km
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {ride.duration} min
                          </span>
                        </div>
                        <p className="text-xl font-bold text-[#F22998]">R$ {ride.price.toFixed(2)}</p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredRides.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <MapPin className="w-16 h-16 text-[#F22998]/30 mx-auto mb-4" />
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>Nenhuma corrida disponível</h3>
                <p className={isDark ? 'text-[#F2F2F2]/50' : 'text-black/60'}>Novas corridas aparecerão aqui</p>
              </motion.div>
            )}
          </div>

          {/* Map and Details */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className={`rounded-3xl overflow-hidden ${isDark ? 'border-[#F22998]/10' : 'border-gray-200'}`}>
                <MapView
                  pickupLocation={selectedRide ? { lat: selectedRide.pickup.lat, lng: selectedRide.pickup.lng } : null}
                  destinationLocation={selectedRide ? { lat: selectedRide.destination.lat, lng: selectedRide.destination.lng } : null}
                  className="h-[300px]"
                />
              </Card>
            </motion.div>

            {/* Selected Ride Details */}
            {selectedRide && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`p-6 rounded-3xl bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 ${isDark ? 'border-[#F22998]/30' : 'border-[#F22998]/40'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>Detalhes da Corrida</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0D0D0D]/50' : 'bg-white/50'}`}>
                      <p className={`text-sm mb-1 ${isDark ? 'text-[#F2F2F2]/50' : 'text-black/70'}`}>Distância</p>
                      <p className={`text-xl font-bold ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>{selectedRide.distance} km</p>
                    </div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0D0D0D]/50' : 'bg-white/50'}`}>
                      <p className={`text-sm mb-1 ${isDark ? 'text-[#F2F2F2]/50' : 'text-black/70'}`}>Duração</p>
                      <p className={`text-xl font-bold ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>{selectedRide.duration} min</p>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between mb-6 p-4 rounded-xl ${isDark ? 'bg-[#0D0D0D]/50' : 'bg-white/50'}`}>
                    <span className={isDark ? 'text-[#F2F2F2]/60' : 'text-black/70'}>Valor da corrida</span>
                    <span className="text-2xl font-bold text-[#F22998]">R$ {selectedRide.price.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setSelectedRide(null)}
                      variant="outline"
                      className={`py-6 rounded-2xl border-[#F22998]/30 hover:bg-[#F22998]/10 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}
                    >
                      <X className="w-5 h-5 mr-2" />
                      Ignorar
                    </Button>
                    <Button
                      onClick={() => handleAcceptRide(selectedRide)}
                      className="py-6 rounded-2xl btn-gradient"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Aceitar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}