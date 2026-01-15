import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Phone, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MapView from '../map/MapView';
import OfflineTracker from '../OfflineTracker';
import { base44 } from '@/api/base44Client';

export default function ActiveRide({ ride, onComplete }) {
  const [driver, setDriver] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    // Carregar dados da motorista
    const loadDriver = async () => {
      if (ride.driver_id) {
        try {
          const users = await base44.entities.User.filter({ id: ride.driver_id });
          if (users.length > 0) {
            setDriver(users[0]);
          }
        } catch (error) {
          console.error('Error loading driver:', error);
        }
      }
    };

    loadDriver();

    // Atualizar localização atual
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [ride.driver_id]);

  const handleEmergency = () => {
    // Ativar botão de emergência
    base44.entities.Ride.update(ride.id, {
      emergency_activated: true
    });
    alert('Emergência ativada! Contatos de segurança foram notificados.');
  };

  const isDark = true;

  return (
    <div className="space-y-4">
      {/* Offline Tracker */}
      <OfflineTracker 
        rideId={ride.id} 
        isActive={ride.status === 'in_progress'} 
      />

      {/* Driver Info */}
      <Card className={`p-4 rounded-2xl ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white'}`}>
        <div className="flex items-center gap-4">
          {driver?.photo_url ? (
            <img 
              src={driver.photo_url} 
              alt={driver.full_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#F22998]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {driver?.full_name?.charAt(0) || 'M'}
              </span>
            </div>
          )}
          
          <div className="flex-1">
            <h3 className={`font-semibold ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
              {driver?.full_name || 'Motorista'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-black/60'}`}>
              {ride.status === 'arriving' ? 'A caminho' : 'Em andamento'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="icon"
              className="rounded-full bg-green-500 hover:bg-green-600"
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              className="rounded-full bg-[#F22998] hover:bg-[#BF3B79]"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Map */}
      <Card className="rounded-2xl overflow-hidden">
        <MapView
          pickupLocation={ride.pickup_lat && ride.pickup_lng ? {
            lat: ride.pickup_lat,
            lng: ride.pickup_lng
          } : null}
          destinationLocation={ride.destination_lat && ride.destination_lng ? {
            lat: ride.destination_lat,
            lng: ride.destination_lng
          } : null}
          center={currentLocation ? [currentLocation.lat, currentLocation.lng] : undefined}
          className="h-[400px]"
        />
      </Card>

      {/* Route Info */}
      <Card className={`p-4 rounded-2xl ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white'}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <p className={`text-sm ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
              {ride.pickup_address}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#F22998]" />
            <p className={`text-sm ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
              {ride.destination_address}
            </p>
          </div>
        </div>
      </Card>

      {/* Emergency Button */}
      <Button
        onClick={handleEmergency}
        className="w-full py-6 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold"
      >
        <AlertCircle className="w-5 h-5 mr-2" />
        Botão de Emergência
      </Button>
    </div>
  );
}