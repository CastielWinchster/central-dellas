import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Car, User, Shield, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import MapView from '../components/map/MapView';
import { base44 } from '@/api/base44Client';

export default function TrackRide() {
  const location = useLocation();
  const [tracking, setTracking] = useState(null);
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [passenger, setPassenger] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extrair token da URL
  const urlParams = new URLSearchParams(location.search);
  const shareToken = urlParams.get('token');

  useEffect(() => {
    if (!shareToken) {
      setError('Link de rastreamento inválido');
      setLoading(false);
      return;
    }

    loadTrackingData();
    const interval = setInterval(loadTrackingData, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [shareToken]);

  const loadTrackingData = async () => {
    try {
      // Buscar dados de rastreamento
      const trackingData = await base44.entities.SharedTracking.filter({
        share_token: shareToken,
        is_active: true
      });

      if (trackingData.length === 0) {
        setError('Rastreamento não encontrado ou expirado');
        setLoading(false);
        return;
      }

      const track = trackingData[0];
      setTracking(track);

      // Verificar se expirou
      if (track.expires_at && new Date(track.expires_at) < new Date()) {
        setError('Este link de rastreamento expirou');
        setLoading(false);
        return;
      }

      // Buscar dados da corrida
      const rideData = await base44.entities.Ride.filter({ id: track.ride_id });
      if (rideData.length > 0) {
        const rideInfo = rideData[0];
        setRide(rideInfo);

        // Buscar motorista
        if (rideInfo.driver_id) {
          const driverData = await base44.entities.User.filter({ id: rideInfo.driver_id });
          if (driverData.length > 0) {
            setDriver(driverData[0]);
          }
        }

        // Buscar passageira
        if (rideInfo.passenger_id) {
          const passengerData = await base44.entities.User.filter({ id: rideInfo.passenger_id });
          if (passengerData.length > 0) {
            setPassenger(passengerData[0]);
          }
        }

        // Usar último ponto GPS se disponível
        if (rideInfo.last_gps_point) {
          setCurrentLocation(rideInfo.last_gps_point);
          calculateETA(rideInfo.last_gps_point, rideInfo);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading tracking data:', err);
      setError('Erro ao carregar dados do rastreamento');
      setLoading(false);
    }
  };

  const calculateETA = (current, rideInfo) => {
    if (!current || !rideInfo.destination_lat || !rideInfo.destination_lng) return;

    // Calcular distância restante
    const distance = haversineDistance(
      current.lat,
      current.lng,
      rideInfo.destination_lat,
      rideInfo.destination_lng
    );

    // Estimar tempo (assumindo velocidade média de 40 km/h no trânsito)
    const avgSpeed = 40;
    const timeInHours = distance / avgSpeed;
    const timeInMinutes = Math.round(timeInHours * 60);

    setEta(timeInMinutes);
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-[#F22998] animate-bounce mx-auto mb-4" />
          <p className="text-[#F2F2F2]">Carregando rastreamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#F2F2F2] mb-2">Erro</h2>
          <p className="text-[#F2F2F2]/60">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#BF3B79] to-[#F22998] p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Central Dellas - Rastreamento</h1>
        </div>
        <p className="text-white/80 text-sm">
          Acompanhe a corrida de {passenger?.full_name || 'passageira'} em tempo real
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[#F2F2F2] font-semibold">
                  {ride?.status === 'arriving' ? 'Motorista a caminho' : 
                   ride?.status === 'in_progress' ? 'Em andamento' : 'Aguardando'}
                </span>
              </div>
              {eta && (
                <div className="flex items-center gap-2 text-[#F22998]">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">{eta} min</span>
                </div>
              )}
            </div>

            {/* Driver Info */}
            {driver && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0D0D0D] border border-[#F22998]/20">
                {driver.photo_url ? (
                  <img 
                    src={driver.photo_url} 
                    alt={driver.full_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#F22998]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-[#F2F2F2] font-semibold">{driver.full_name}</p>
                  <p className="text-[#F2F2F2]/60 text-sm">Motorista Central Dellas</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden rounded-2xl">
            <MapView
              pickupLocation={ride?.pickup_lat && ride?.pickup_lng ? {
                lat: ride.pickup_lat,
                lng: ride.pickup_lng
              } : null}
              destinationLocation={ride?.destination_lat && ride?.destination_lng ? {
                lat: ride.destination_lat,
                lng: ride.destination_lng
              } : null}
              center={currentLocation ? [currentLocation.lat, currentLocation.lng] : undefined}
              className="h-[500px]"
            />
          </Card>
        </motion.div>

        {/* Route Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-6">
            <h3 className="text-[#F2F2F2] font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#F22998]" />
              Trajeto
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500 mt-1" />
                <div>
                  <p className="text-[#F2F2F2]/60 text-sm">Origem</p>
                  <p className="text-[#F2F2F2]">{ride?.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-[#F22998] mt-1" />
                <div>
                  <p className="text-[#F2F2F2]/60 text-sm">Destino</p>
                  <p className="text-[#F2F2F2]">{ride?.destination_address}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Safety Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-[#BF3B79]/10 to-[#F22998]/10 border-[#F22998]/30 p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-[#F22998] mt-1" />
              <div>
                <h3 className="text-[#F2F2F2] font-semibold mb-2">Segurança Central Dellas</h3>
                <p className="text-[#F2F2F2]/60 text-sm">
                  Esta corrida está sendo rastreada em tempo real. Todas as nossas motoristas 
                  são verificadas e certificadas. Em caso de emergência, nossa central está 
                  disponível 24/7.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Marketing Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center pt-4"
        >
          <p className="text-[#F2F2F2]/60 text-sm mb-2">
            Sua filha vai para a festa? Mande uma motorista da Central Dellas
          </p>
          <p className="text-[#F22998] font-semibold">
            Acompanhe o trajeto em tempo real! 💕
          </p>
        </motion.div>
      </div>
    </div>
  );
}