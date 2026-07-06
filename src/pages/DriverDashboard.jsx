import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Car, Power, Clock, DollarSign, Star, 
  TrendingUp, Users, ChevronRight, Bell, Shield,
  Navigation, CheckCircle, XCircle, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import MapView from '../components/map/MapView';
import { toast } from 'sonner';
import AvailableRidesList from '../components/driver/AvailableRidesList';
import { ensureDriverPushSubscription } from '@/hooks/useNotifications';
import { verifyPushRegistration } from '@/lib/pushRegistration';
import { fetchDriverCompletedRides } from '@/utils/rideEarnings';
import { isDriverOnlineLocal, setDriverOnlineLocal, hasActiveRideLocal, setDriverAvailableIfOnline, setDriverLastLocation, getActiveRideLocal, setActiveRideLocal, setDriverBusyOnRide } from '@/lib/driverSession';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [onlineReady, setOnlineReady] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [todayStats, setTodayStats] = useState({
    rides: 0,
    earnings: 0,
  });

  const [selectedRide, setSelectedRide] = useState(null);
  const [pendingRide, setPendingRide] = useState(null);
  const [currentLocation, setCurrentLocation] = useState({ lat: -23.5505, lng: -46.6333 });
  const [presenceRecord, setPresenceRecord] = useState(null);
  const presenceRecordRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastLocationRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const [liveEta, setLiveEta] = useState(null);
  const etaIntervalRef = useRef(null);
  const lastGpsUpdateRef = useRef(0);
  const trackingGenRef = useRef(0);

  // Haversine local para ETA em tempo real
  const haversineLocal = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const calcEta = (driverLoc, ride) => {
    if (!driverLoc?.lat || !driverLoc?.lng || !ride?.pickup_lat || !ride?.pickup_lng) return null;
    const distKm = haversineLocal(driverLoc.lat, driverLoc.lng, ride.pickup_lat, ride.pickup_lng);
    if (distKm < 0.1) return 'Chegando';
    return Math.ceil((distKm / 30) * 60);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Simulate updating user type
        if (userData.user_type !== 'driver' && userData.user_type !== 'both') {
          await base44.auth.updateMe({ user_type: 'both' });
        }
        
        // Presença inicial vem do toggle online — sem poll extra de ofertas no mount

        // Estatísticas de hoje via backend (service role — contorna RLS)
        try {
          const { today } = await fetchDriverCompletedRides(base44);
          setTodayStats({ rides: today.rides, earnings: today.earnings });
        } catch (_) {
          setTodayStats({ rides: 0, earnings: 0 });
        }

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

  // Atualizar stats ao voltar para o dashboard (ex.: após concluir corrida)
  useEffect(() => {
    if (!user?.id) return;
    const refreshStats = async () => {
      try {
        const { today } = await fetchDriverCompletedRides(base44);
        setTodayStats({ rides: today.rides, earnings: today.earnings });
      } catch (_) {}
    };
    refreshStats();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshStats();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refreshStats);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refreshStats);
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      setIsOnline(isDriverOnlineLocal(user.id));
      setOnlineReady(true);
    } else {
      setOnlineReady(false);
    }
  }, [user?.id]);

  // Redirecionar para corrida ativa se existir no localStorage
  useEffect(() => {
    const active = getActiveRideLocal();
    if (active?.id) {
      navigate(`/ActiveRideDriver?id=${active.id}`);
    }
  }, [navigate]);

  // Sincronizar switch com outras abas / DriverRideOfferLayer
  useEffect(() => {
    if (!user?.id) return;
    const syncFromStorage = () => setIsOnline(isDriverOnlineLocal(user.id));
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('driver-online-changed', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('driver-online-changed', syncFromStorage);
    };
  }, [user?.id]);

  // Sincronizar ref com state para uso dentro do effect sem causar re-render
  useEffect(() => {
    presenceRecordRef.current = presenceRecord;
  }, [presenceRecord]);

  // Gerenciar presença online/offline
  // IMPORTANTE: presenceRecord NÃO está nas deps — usa presenceRecordRef para evitar loop
  useEffect(() => {
    if (!user || !onlineReady) return;

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
      setDriverLastLocation(user.id, { lat: latitude, lng: longitude, accuracy, heading, speed });

      // Criar/atualizar presença via função (contorna RLS)
      try {
        const res = await base44.functions.invoke('setDriverPresence', {
          isOnline: true,
          isAvailable: true,
          lat: latitude,
          lng: longitude,
          accuracy,
          heading,
          speed,
        });
        const data = res?.data || res;
        if (data?.presence) {
          presenceRecordRef.current = data.presence;
          setPresenceRecord(data.presence);
        }
      } catch (dbError) {
        console.error('Erro ao salvar presença:', dbError);
        toast.warning('Conexão instável — continuando online, tentando reconectar...');
        // Não desliga o switch; segue com GPS e re-tentativas no intervalo abaixo
      }

      // Iniciar watchPosition se disponível
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            const { latitude: lat, longitude: lng, accuracy: acc, heading: h, speed: s } = pos.coords;
            // Ignorar leituras com precisão ruim
            if (acc > 50) return;
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
            setDriverLastLocation(user.id, { lat, lng, accuracy: acc || 0, heading: h || 0, speed: s || 0 });

            // Throttle de 15s para writes no banco (evita rate limit)
            const now = Date.now();
            if (now - lastGpsUpdateRef.current < 15000) return;
            lastGpsUpdateRef.current = now;

            try {
              await base44.functions.invoke('setDriverPresence', {
                isOnline: true,
                isAvailable: true,
                lat,
                lng,
                accuracy: acc || 0,
                heading: h || 0,
                speed: s || 0,
              });
            } catch (error) {
              console.error('Erro ao atualizar localização:', error);
            }
          },
          (error) => {
            console.warn('Erro no watchPosition (não crítico):', error.message);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
        );
      }

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

      if (hasActiveRideLocal()) {
        try {
          await base44.functions.invoke('setDriverPresence', {
            isOnline: true,
            isAvailable: false,
          });
        } catch (error) {
          console.error('Erro ao marcar indisponível:', error);
        }
        return;
      }

      if (user?.id && isDriverOnlineLocal(user.id)) {
        return;
      }

      try {
        await base44.functions.invoke('setDriverPresence', { isOnline: false });
        toast.info('Você está offline');
      } catch (error) {
        console.error('Erro ao atualizar status offline:', error);
      }
    };

    const gen = ++trackingGenRef.current;

    if (isOnline) {
      startTracking().then(() => {
        if (gen !== trackingGenRef.current) {
          if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        }
      });
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
  }, [isOnline, user?.id, onlineReady]); // presenceRecord removido das deps intencionalmente
  
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
  
  // Polling de ETA em tempo real (motorista → passageira)
  useEffect(() => {
    if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);

    if (!selectedRide) {
      setLiveEta(null);
      return;
    }

    const update = () => setLiveEta(calcEta(currentLocation, selectedRide));
    update();
    etaIntervalRef.current = setInterval(update, 5000);

    return () => clearInterval(etaIntervalRef.current);
  }, [selectedRide, currentLocation]);

  useEffect(() => {
    if (user && isOnline) {
      ensureDriverPushSubscription().then(async (result) => {
        if (!result?.ok) {
          toast.warning('Ative as notificações para receber corridas com o app fechado.', { duration: 5000 });
          return;
        }
        const check = await verifyPushRegistration();
        const serverOk = check.server?.has_subscription || check.server?.has_fcm_token;
        if (!serverOk) {
          toast.warning('Push não registrado no servidor. Abra as configurações e permita notificações.', { duration: 6000 });
        }
      }).catch(() => {});
    }
  }, [user, isOnline]);

  const handleAcceptRide = async () => {
    setPendingRide(null);
  };

  // Chamado pelo AvailableRidesList quando aceita via lista
  const handleRideAcceptedFromList = async (acceptedRideData) => {
    setActiveRideLocal(acceptedRideData);
    await setDriverBusyOnRide(base44);
    toast.success('🎉 Corrida aceita!');
    navigate(`/ActiveRideDriver?id=${acceptedRideData.id}`);
  };

  const handleRejectRide = () => {
    setPendingRide(null);
  };

  const statsCards = [
    { 
      label: 'Corridas Hoje', 
      value: todayStats.rides, 
      icon: Car, 
      color: 'from-[#EC4899] to-[#F472B6]',
      trend: null
    },
    { 
      label: 'Ganhos Hoje', 
      value: `R$ ${todayStats.earnings.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'from-[#F472B6] to-[#BE185D]',
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
              ? 'bg-gradient-to-r from-[#EC4899]/20 to-[#F472B6]/20 border-[#F472B6]' 
              : 'bg-[#F2F2F2]/5 border-[#F472B6]/10'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isOnline 
                    ? 'bg-gradient-to-br from-[#EC4899] to-[#F472B6] pulse-animation' 
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
                  onCheckedChange={async (val) => {
                    if (!user?.id) return;
                    if (val) {
                      setDriverOnlineLocal(user.id, true);
                      setDriverAvailableIfOnline(base44, user.id).catch(() => {});
                      const push = await ensureDriverPushSubscription();
                      if (!push?.ok) {
                        toast.warning('Permita notificações — sem isso você não recebe corridas com o app fechado.');
                      }
                    } else {
                      if (hasActiveRideLocal()) {
                        toast.warning('Conclua ou cancele a corrida ativa antes de ficar offline.');
                        return;
                      }
                      setDriverOnlineLocal(user.id, false);
                    }
                    setIsOnline(val);
                  }}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#EC4899] data-[state=checked]:to-[#F472B6]"
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
            <Card className="p-6 rounded-3xl bg-gradient-to-r from-[#EC4899]/30 to-[#F472B6]/30 border-2 border-[#F472B6] glow-pink">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F472B6] text-white text-sm font-medium">
                  <Bell className="w-4 h-4" />
                  Nova Corrida!
                </div>
                <p className="text-[#F472B6] font-bold">R$ {pendingRide.estimatedPrice.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={pendingRide.passenger.photo}
                  alt={pendingRide.passenger.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#F472B6]"
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
                  <div className="w-3 h-3 rounded-full bg-[#F472B6]" />
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
          <Card className="rounded-3xl overflow-hidden border-[#F472B6]/10 relative">
            <MapView
              pickupLocation={selectedRide ? { lat: selectedRide.pickup_lat, lng: selectedRide.pickup_lng } : currentLocation}
              destinationLocation={selectedRide ? { lat: selectedRide.dropoff_lat, lng: selectedRide.dropoff_lng } : null}
              showRoute={!!selectedRide}
              className="h-[460px]"
              driverLocation={isOnline ? currentLocation : null}
            />
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
              <Card className="p-5 rounded-2xl bg-[#F2F2F2]/5 border-[#F472B6]/10 hover:border-[#F472B6]/30 transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-[#F2F2F2]">{stat.value}</p>
                <p className="text-sm text-[#F2F2F2]/50">{stat.label}</p>
                {stat.trend && (
                  <p className="text-xs text-[#F472B6] mt-2">{stat.trend}</p>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Corridas/Entregas disponíveis — só quando online */}
        {isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F472B6]/10">
              <AvailableRidesList
                onRideSelect={setSelectedRide}
                onRideAccepted={handleRideAcceptedFromList}
                selectedRideId={selectedRide?.id}
                driverLocation={currentLocation}
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
              <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F472B6]/10">
                <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Ações Rápidas</h3>
                <div className="space-y-3">
                  <Link to={createPageUrl('Earnings')}>
                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#F472B6]/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-[#F472B6]" />
                        <span className="text-[#F2F2F2]">Meus Ganhos</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F472B6] transition-colors" />
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
                <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F472B6]/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-[#F472B6]" />
                    <h3 className="text-lg font-semibold text-[#F2F2F2]">Suas Badges</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Top Motorista', 'Sempre Pontual', '100 Corridas'].map((badge, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 rounded-full bg-[#F472B6]/20 text-[#F472B6] text-sm font-medium"
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
    </div>
  );
}