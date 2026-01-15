import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, MapPin, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function OfflineTracker({ rideId, isActive }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [trackingPoints, setTrackingPoints] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const intervalRef = useRef(null);
  const storageKey = `ride_tracking_${rideId}`;

  // Detectar mudanças na conectividade
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('Conexão restaurada');
      await syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Sinal perdido. Trajeto sendo salvo localmente.', {
        duration: 5000,
        icon: <WifiOff className="w-5 h-5" />
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [rideId]);

  // Iniciar rastreamento GPS quando corrida está ativa
  useEffect(() => {
    if (!isActive || !rideId) {
      stopTracking();
      return;
    }

    // Carregar pontos salvos anteriormente
    loadSavedPoints();

    // Iniciar rastreamento a cada 10 segundos
    intervalRef.current = setInterval(() => {
      captureGPSPoint();
    }, 10000);

    return () => stopTracking();
  }, [isActive, rideId]);

  const captureGPSPoint = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          speed: position.coords.speed || 0,
          accuracy: position.coords.accuracy
        };

        setTrackingPoints(prev => {
          const updated = [...prev, point];
          saveToLocalStorage(updated);
          return updated;
        });

        // Se estiver online, tentar enviar imediatamente
        if (isOnline) {
          sendPointToServer(point);
        }
      },
      (error) => {
        console.error('GPS error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const saveToLocalStorage = (points) => {
    try {
      const data = {
        rideId,
        points,
        lastUpdate: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 horas
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const loadSavedPoints = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;

      const data = JSON.parse(saved);
      
      // Verificar se não expirou
      if (new Date(data.expiresAt) < new Date()) {
        localStorage.removeItem(storageKey);
        return;
      }

      setTrackingPoints(data.points || []);
    } catch (error) {
      console.error('Error loading saved points:', error);
    }
  };

  const sendPointToServer = async (point) => {
    try {
      // Enviar ponto para o servidor
      await base44.entities.Ride.update(rideId, {
        last_gps_point: point,
        tracking_points_count: trackingPoints.length + 1
      });
    } catch (error) {
      console.error('Error sending point to server:', error);
    }
  };

  const syncOfflineData = async () => {
    if (trackingPoints.length === 0) return;

    setIsSyncing(true);
    
    try {
      // Calcular distância total do trajeto
      const totalDistance = calculateTotalDistance(trackingPoints);

      // Enviar todos os pontos para o servidor
      await base44.entities.Ride.update(rideId, {
        offline_tracking_points: trackingPoints,
        offline_distance_km: totalDistance,
        synced_at: new Date().toISOString()
      });

      // Limpar dados locais após sincronização bem-sucedida
      localStorage.removeItem(storageKey);
      setTrackingPoints([]);

      toast.success('Trajeto sincronizado com sucesso', {
        duration: 4000,
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      });
    } catch (error) {
      console.error('Error syncing offline data:', error);
      toast.error('Erro ao sincronizar trajeto. Tentaremos novamente.');
    } finally {
      setIsSyncing(false);
    }
  };

  const calculateTotalDistance = (points) => {
    if (points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += haversineDistance(
        points[i - 1].lat,
        points[i - 1].lng,
        points[i].lat,
        points[i].lng
      );
    }
    return totalDistance;
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
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

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Limpar dados expirados ao montar
  useEffect(() => {
    cleanupExpiredData();
  }, []);

  const cleanupExpiredData = () => {
    try {
      const keys = Object.keys(localStorage);
      const now = new Date();

      keys.forEach(key => {
        if (key.startsWith('ride_tracking_')) {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.expiresAt && new Date(data.expiresAt) < now) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="px-4 py-3 rounded-full bg-orange-500/90 backdrop-blur-sm text-white flex items-center gap-3 shadow-lg">
            <WifiOff className="w-5 h-5 animate-pulse" />
            <div className="text-sm">
              <p className="font-semibold">Modo Offline</p>
              <p className="text-xs opacity-90">
                {trackingPoints.length} pontos salvos localmente
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {isSyncing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="px-4 py-3 rounded-full bg-green-500/90 backdrop-blur-sm text-white flex items-center gap-3 shadow-lg">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold">Sincronizando trajeto...</span>
          </div>
        </motion.div>
      )}

      {/* Indicador de rastreamento ativo */}
      {isOnline && trackingPoints.length > 0 && (
        <div className="fixed bottom-24 right-4 z-40">
          <div className="px-3 py-2 rounded-full bg-[#F22998]/90 backdrop-blur-sm text-white flex items-center gap-2 shadow-lg">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">{trackingPoints.length} pts</span>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}