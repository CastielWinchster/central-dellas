import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Car, Power, MapPin, Clock, DollarSign, Star, 
  TrendingUp, Users, ChevronRight, Bell, Shield,
  Navigation, CheckCircle, XCircle, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import MapView from '../components/map/MapView';
import { toast } from 'sonner';
import RideOfferModal from '../components/driver/RideOfferModal';
import AvailableRidesList from '../components/driver/AvailableRidesList';

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [todayStats, setTodayStats] = useState({
    rides: 0,
    earnings: 0,
  });
  const [mapTopView, setMapTopView] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [pendingRide, setPendingRide] = useState(null);
  const [currentLocation, setCurrentLocation] = useState({ lat: -23.5505, lng: -46.6333 });
  const [presenceRecord, setPresenceRecord] = useState(null);
  const presenceRecordRef = React.useRef(null);
  const watchIdRef = React.useRef(null);
  const lastLocationRef = React.useRef(null);
  const updateIntervalRef = React.useRef(null);
  const [rideOffer, setRideOffer] = useState(null);
  const [offerRide, setOfferRide] = useState(null);
  const [offerPassenger, setOfferPassenger] = useState(null);
  const offerPollingRef = React.useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Simulate updating user type
        if (userData.user_type !== 'driver' && userData.user_type !== 'both') {
          await base44.auth.updateMe({ user_type: 'both' });
        }
        
        // Verificar presença existente
        const existingPresence = await base44.entities.DriverPresence.filter({ driver_id: userData.id });
        if (existingPresence.length > 0) {
          setPresenceRecord(existingPresence[0]);
          presenceRecordRef.current = existingPresence[0];
          // Não restaura isOnline=true do banco — motorista sempre começa offline ao entrar
        }

        // Buscar corridas reais de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const allRides = await base44.entities.Ride.filter({
          assigned_driver_id: userData.id,
          status: 'completed'
        });
        const todayRides = allRides.filter(r => new Date(r.created_date) >= today);
        const todayEarnings = todayRides.reduce((sum, r) => sum + (r.estimated_price || 0), 0);
        setTodayStats({ rides: todayRides.length, earnings: todayEarnings });

      } catch (e) {
        if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
          base44.auth.redirectToLogin();
        } else {
          toast.error('Erro ao carregar dados');
        }
      }
    };
    loadUser();
  }, []);

  // Sincronizar ref com state para uso dentro do effect sem causar re-render
  useEffect(() => {
    presenceRecordRef.current = presenceRecord;
  }, [presenceRecord]);

  // Gerenciar presença online/offline
  // IMPORTANTE: presenceRecord NÃO está nas deps — usa presenceRecordRef para evitar loop
  useEffect(() => {
    if (!user) return;

    const startTracking = async () => {
      // Fallback de coordenadas caso geolocalização não esteja disponível
      let latitude = -20.7195;
      let longitude = -47.8864;
      let accuracy = 0;
      let heading = 0;
      let speed = 0;

      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          accuracy = position.coords.accuracy || 0;
          heading = position.coords.heading || 0;
          speed = position.coords.speed || 0;
        } catch (geoError) {
          // Geolocalização falhou — continua online com coordenadas padrão
          console.warn('Geolocalização indisponível, usando coordenadas padrão:', geoError.message);
          toast.info('📍 Localização indisponível. Você está online sem GPS.');
        }
      }

      setCurrentLocation({ lat: latitude, lng: longitude });
      lastLocationRef.current = { lat: latitude, lng: longitude };

      // Criar/atualizar presença usando a ref (não o state, para não gerar dependência)
      let record = presenceRecordRef.current;
      try {
        if (!record) {
          record = await base44.entities.DriverPresence.create({
            driver_id: user.id,
            is_online: true,
            lat: latitude,
            lng: longitude,
            accuracy,
            heading,
            speed,
            last_seen_at: new Date().toISOString()
          });
          presenceRecordRef.current = record;
          setPresenceRecord(record);
        } else {
          await base44.entities.DriverPresence.update(record.id, {
            is_online: true,
            lat: latitude,
            lng: longitude,
            accuracy,
            heading,
            speed,
            last_seen_at: new Date().toISOString()
          });
        }
      } catch (dbError) {
        console.error('Erro ao salvar presença:', dbError);
      }

      // Iniciar watchPosition se disponível
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            const { latitude: lat, longitude: lng, accuracy: acc, heading: h, speed: s } = pos.coords;
            const newLocation = { lat, lng };

            if (lastLocationRef.current) {
              const distance = calculateDistance(
                lastLocationRef.current.lat,
                lastLocationRef.current.lng,
                lat,
                lng
              );
              if (distance < 15) return;
            }

            setCurrentLocation(newLocation);
            lastLocationRef.current = newLocation;

            const currentRecord = presenceRecordRef.current;
            if (currentRecord) {
              try {
                await base44.entities.DriverPresence.update(currentRecord.id, {
                  lat, lng,
                  accuracy: acc || 0,
                  heading: h || 0,
                  speed: s || 0,
                  last_seen_at: new Date().toISOString()
                });
              } catch (error) {
                console.error('Erro ao atualizar localização:', error);
              }
            }
          },
          (error) => {
            // Erro no watchPosition — apenas loga, NÃO derruba o status online
            console.warn('Erro no watchPosition (não crítico):', error.message);
          },
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
        );
      }

      // Atualizar timestamp a cada 3 segundos
      updateIntervalRef.current = setInterval(async () => {
        const currentRecord = presenceRecordRef.current;
        if (currentRecord) {
          try {
            await base44.entities.DriverPresence.update(currentRecord.id, {
              last_seen_at: new Date().toISOString()
            });
          } catch (error) {
            console.error('Erro ao atualizar timestamp:', error);
          }
        }
      }, 3000);

      toast.success('🚗 Você está online e visível para passageiras!');
    };

    const stopTracking = async () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      const currentRecord = presenceRecordRef.current;
      if (currentRecord) {
        try {
          await base44.entities.DriverPresence.update(currentRecord.id, {
            is_online: false,
            last_seen_at: new Date().toISOString()
          });
          toast.info('Você está offline');
        } catch (error) {
          console.error('Erro ao atualizar status offline:', error);
        }
      }
    };

    if (isOnline) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      // Cleanup só para watchers/intervals, não chama stopTracking completo
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [isOnline, user]); // presenceRecord removido das deps intencionalmente
  
  // Calcular distância entre dois pontos (em metros)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };
  
  // Polling de ofertas quando online
  useEffect(() => {
    if (!isOnline || !user) {
      if (offerPollingRef.current) {
        clearInterval(offerPollingRef.current);
      }
      return;
    }
    
    const checkOffers = async () => {
      try {
        const now = new Date().toISOString();
        const offers = await base44.entities.RideOffer.filter({
          driver_id: user.id,
          status: 'sent',
          expires_at: { $gte: now }
        });
        
        if (offers.length > 0) {
          const offer = offers[0];
          
          // Buscar dados da corrida
          const rides = await base44.entities.Ride.filter({ id: offer.ride_id });
          if (rides.length === 0) return;
          const ride = rides[0];
          
          // Buscar dados da passageira
          const passengers = await base44.entities.User.filter({ id: ride.passenger_id });
          
          setRideOffer(offer);
          setOfferRide(ride);
          setOfferPassenger(passengers[0] || null);
          
          // Marcar como vista
          await base44.entities.RideOffer.update(offer.id, { status: 'seen' });
        }
      } catch (error) {
        console.error('Erro ao verificar ofertas:', error);
      }
    };
    
    checkOffers();
    offerPollingRef.current = setInterval(checkOffers, 2000);
    
    return () => {
      if (offerPollingRef.current) {
        clearInterval(offerPollingRef.current);
      }
    };
  }, [isOnline, user]);
  
  const handleAcceptOffer = async (offer, ride) => {
    try {
      const response = await base44.functions.invoke('acceptRideOffer', {
        rideId: ride.id,
        offerId: offer.id
      });
      
      if (response.data.success) {
        toast.success('🎉 Corrida aceita! Navegue até a passageira');
        setRideOffer(null);
        setOfferRide(null);
        setOfferPassenger(null);
      } else if (response.data.expired) {
        toast.warning('Oferta expirada');
        setRideOffer(null);
      } else {
        toast.error(response.data.error || 'Não foi possível aceitar');
        setRideOffer(null);
      }
    } catch (error) {
      console.error('Erro ao aceitar:', error);
      toast.error('Erro ao aceitar corrida');
      setRideOffer(null);
    }
  };
  
  const handleRejectOffer = async (offer) => {
    try {
      await base44.entities.RideOffer.update(offer.id, {
        status: 'rejected',
        responded_at: new Date().toISOString()
      });
      toast.info('Corrida recusada');
      setRideOffer(null);
      setOfferRide(null);
      setOfferPassenger(null);
    } catch (error) {
      console.error('Erro ao recusar:', error);
    }
  };

  const handleAcceptRide = async () => {
    // Accept ride logic
    setPendingRide(null);
  };

  const handleRejectRide = () => {
    setPendingRide(null);
  };

  const statsCards = [
    { 
      label: 'Corridas Hoje', 
      value: todayStats.rides, 
      icon: Car, 
      color: 'from-[#BF3B79] to-[#F22998]',
      trend: null
    },
    { 
      label: 'Ganhos Hoje', 
      value: `R$ ${todayStats.earnings.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'from-[#F22998] to-[#8C0D60]',
      trend: null
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F2F2F2] pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className={`p-6 rounded-3xl border-2 transition-all duration-500 ${
            isOnline 
              ? 'bg-gradient-to-r from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]' 
              : 'bg-[#F2F2F2]/5 border-[#F22998]/10'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isOnline 
                    ? 'bg-gradient-to-br from-[#BF3B79] to-[#F22998] pulse-animation' 
                    : 'bg-[#F2F2F2]/10'
                }`}>
                  <Power className={`w-8 h-8 ${isOnline ? 'text-white' : 'text-[#F2F2F2]/50'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F2F2F2]">
                    {isOnline ? 'Você está online!' : 'Você está offline'}
                  </h2>
                  <p className="text-[#F2F2F2]/60">
                    {isOnline ? 'Aguardando corridas próximas...' : 'Ative para receber corridas'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#F2F2F2]/60 font-medium">
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
                <Switch
                  checked={isOnline}
                  onCheckedChange={setIsOnline}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#BF3B79] data-[state=checked]:to-[#F22998]"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Pending Ride Request */}
        {pendingRide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="mb-6"
          >
            <Card className="p-6 rounded-3xl bg-gradient-to-r from-[#BF3B79]/30 to-[#F22998]/30 border-2 border-[#F22998] glow-pink">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F22998] text-white text-sm font-medium">
                  <Bell className="w-4 h-4" />
                  Nova Corrida!
                </div>
                <p className="text-[#F22998] font-bold">R$ {pendingRide.estimatedPrice.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={pendingRide.passenger.photo}
                  alt={pendingRide.passenger.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#F22998]"
                />
                <div>
                  <h3 className="font-bold text-[#F2F2F2]">{pendingRide.passenger.name}</h3>
                  <div className="flex items-center gap-1 text-[#F2F2F2]/60 text-sm">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {pendingRide.passenger.rating}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <p className="text-[#F2F2F2]">{pendingRide.pickup}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#F22998]" />
                  <p className="text-[#F2F2F2]">{pendingRide.destination}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-[#F2F2F2]/60 mb-6">
                <span>{pendingRide.distance} km</span>
                <span>~{pendingRide.estimatedDuration} min</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleRejectRide}
                  variant="outline"
                  className="py-6 rounded-2xl border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Recusar
                </Button>
                <Button
                  onClick={handleAcceptRide}
                  className="py-6 rounded-2xl btn-gradient"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Aceitar
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Map - topo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="rounded-3xl overflow-hidden border-[#F22998]/10 relative">
            <MapView
              pickupLocation={selectedRide ? { lat: selectedRide.pickup.lat, lng: selectedRide.pickup.lng } : currentLocation}
              destinationLocation={selectedRide ? { lat: selectedRide.destination.lat, lng: selectedRide.destination.lng } : null}
              showRoute={!!selectedRide}
              className="h-[460px]"
              forcePitch={mapTopView ? 0 : undefined}
            />
            {/* Botão vista aérea */}
            <button
              onClick={() => setMapTopView(v => !v)}
              className={`absolute top-4 right-4 z-10 px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all ${
                mapTopView
                  ? 'bg-[#F22998] border-[#F22998] text-white'
                  : 'bg-[#0D0D0D]/80 border-[#F22998]/40 text-[#F22998]'
              }`}
            >
              {mapTopView ? '🗺️ Vista 3D' : '🛰️ Vista Aérea'}
            </button>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-5 rounded-2xl bg-[#F2F2F2]/5 border-[#F22998]/10 hover:border-[#F22998]/30 transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-[#F2F2F2]">{stat.value}</p>
                <p className="text-sm text-[#F2F2F2]/50">{stat.label}</p>
                {stat.trend && (
                  <p className="text-xs text-[#F22998] mt-2">{stat.trend}</p>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Corridas disponíveis — só quando online */}
        {isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10">
              <AvailableRidesList
                onRideSelect={setSelectedRide}
                selectedRideId={selectedRide?.id}
              />
            </Card>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10">
                <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Ações Rápidas</h3>
                <div className="space-y-3">
                  <Link to={createPageUrl('AvailableRides')}>
                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#F22998]/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#F22998]" />
                        <span className="text-[#F2F2F2]">Ver Corridas Disponíveis</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998] transition-colors" />
                    </button>
                  </Link>
                  
                  <Link to={createPageUrl('Earnings')}>
                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#F22998]/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-[#F22998]" />
                        <span className="text-[#F2F2F2]">Meus Ganhos</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998] transition-colors" />
                    </button>
                  </Link>
                  
                  <Link to={createPageUrl('MyReviews')}>
                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#F22998]/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-[#F22998]" />
                        <span className="text-[#F2F2F2]">Minhas Avaliações</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998] transition-colors" />
                    </button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* Badge Highlight */}
            {user?.badges?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-[#F22998]" />
                    <h3 className="text-lg font-semibold text-[#F2F2F2]">Suas Badges</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Top Motorista', 'Sempre Pontual', '100 Corridas'].map((badge, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 rounded-full bg-[#F22998]/20 text-[#F22998] text-sm font-medium"
                      >
                        ✨ {badge}
                      </span>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Ride Offer Modal */}
      {rideOffer && offerRide && (
        <RideOfferModal
          offer={rideOffer}
          ride={offerRide}
          passenger={offerPassenger}
          onAccept={handleAcceptOffer}
          onReject={handleRejectOffer}
          onClose={() => {
            setRideOffer(null);
            setOfferRide(null);
            setOfferPassenger(null);
          }}
        />
      )}
    </div>
  );
}