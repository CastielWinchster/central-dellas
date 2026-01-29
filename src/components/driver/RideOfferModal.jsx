import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Clock, DollarSign, X, Check, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function RideOfferModal({ offer, ride, passenger, onAccept, onReject, onClose }) {
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  
  // Countdown
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(offer.expires_at);
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(diff);
      
      if (diff === 0) {
        onClose();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [offer.expires_at, onClose]);
  
  const handleAccept = async () => {
    setAccepting(true);
    await onAccept(offer, ride);
    setAccepting(false);
  };
  
  const handleReject = async () => {
    setRejecting(true);
    await onReject(offer);
    setRejecting(false);
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-lg w-full"
        >
          <Card className="p-6 bg-gradient-to-br from-[#BF3B79]/30 to-[#F22998]/30 border-2 border-[#F22998] rounded-3xl relative overflow-hidden">
            {/* Timer Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-[#F22998] text-white font-bold">
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
            
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#F2F2F2] mb-2">
                🚗 Nova Corrida!
              </h2>
              <p className="text-[#F2F2F2]/70">
                Uma passageira está aguardando
              </p>
            </div>
            
            {/* Passenger Info */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-[#0D0D0D]/50">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center">
                {passenger?.photo_url ? (
                  <img src={passenger.photo_url} alt={passenger.full_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <p className="font-bold text-[#F2F2F2]">{passenger?.full_name || 'Passageira'}</p>
                <p className="text-sm text-[#F2F2F2]/60">
                  {offer.distance_km.toFixed(1)} km de você
                </p>
              </div>
            </div>
            
            {/* Route Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0D0D0D]/30">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-[#F2F2F2]/60 mb-1">Origem</p>
                  <p className="text-[#F2F2F2] font-medium">{ride.pickup_text}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0D0D0D]/30">
                <div className="w-3 h-3 rounded-full bg-[#F22998] mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-[#F2F2F2]/60 mb-1">Destino</p>
                  <p className="text-[#F2F2F2] font-medium">{ride.dropoff_text}</p>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-[#0D0D0D]/30 text-center">
                <MapPin className="w-5 h-5 text-[#F22998] mx-auto mb-1" />
                <p className="text-xs text-[#F2F2F2]/60">Distância</p>
                <p className="font-bold text-[#F2F2F2]">{offer.distance_km.toFixed(1)} km</p>
              </div>
              
              <div className="p-3 rounded-xl bg-[#0D0D0D]/30 text-center">
                <Clock className="w-5 h-5 text-[#F22998] mx-auto mb-1" />
                <p className="text-xs text-[#F2F2F2]/60">Tempo</p>
                <p className="font-bold text-[#F2F2F2]">~{ride.estimated_duration} min</p>
              </div>
              
              <div className="p-3 rounded-xl bg-[#0D0D0D]/30 text-center">
                <DollarSign className="w-5 h-5 text-[#F22998] mx-auto mb-1" />
                <p className="text-xs text-[#F2F2F2]/60">Ganho</p>
                <p className="font-bold text-[#F2F2F2]">R$ {ride.estimated_price}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleReject}
                disabled={rejecting || accepting}
                variant="outline"
                className="py-6 rounded-2xl border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {rejecting ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Recusando...
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 mr-2" />
                    Recusar
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleAccept}
                disabled={accepting || rejecting}
                className="py-6 rounded-2xl btn-gradient"
              >
                {accepting ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Aceitando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Aceitar
                  </>
                )}
              </Button>
            </div>
            
            {/* Warning */}
            <div className="mt-4 flex items-center gap-2 text-xs text-[#F2F2F2]/50">
              <AlertCircle className="w-4 h-4" />
              <span>Esta oferta expira em {timeLeft} segundos</span>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}