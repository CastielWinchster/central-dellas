import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Clock, MapPin, Plus, X, Route, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function RouteOptimizer({ onRouteOptimized }) {
  const [waypoints, setWaypoints] = useState([
    { address: '', lat: null, lng: null },
    { address: '', lat: null, lng: null }
  ]);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);

  const addWaypoint = () => {
    if (waypoints.length < 10) {
      setWaypoints([...waypoints, { address: '', lat: null, lng: null }]);
    }
  };

  const removeWaypoint = (index) => {
    if (waypoints.length > 2) {
      setWaypoints(waypoints.filter((_, i) => i !== index));
    }
  };

  const updateWaypoint = (index, address) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index].address = address;
    setWaypoints(newWaypoints);
  };

  const optimizeRoute = async () => {
    const filledWaypoints = waypoints.filter(wp => wp.address);
    
    if (filledWaypoints.length < 2) {
      toast.error('Adicione pelo menos 2 endereços');
      return;
    }

    setOptimizing(true);
    try {
      // Simulate geocoding (in real app, use Google Maps Geocoding API)
      const geocodedWaypoints = await Promise.all(
        filledWaypoints.map(async (wp) => {
          // Mock coordinates based on São Paulo region
          return {
            ...wp,
            lat: -23.5505 + (Math.random() - 0.5) * 0.1,
            lng: -46.6333 + (Math.random() - 0.5) * 0.1
          };
        })
      );

      const response = await base44.functions.invoke('optimizeRoute', {
        waypoints: geocodedWaypoints,
        avoid_tolls: false
      });

      setOptimizedRoute(response.data.route);
      
      if (onRouteOptimized) {
        onRouteOptimized(response.data.route);
      }

      toast.success('Rota otimizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao otimizar rota');
      console.error(error);
    }
    setOptimizing(false);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#F22998]/20 flex items-center justify-center">
            <Route className="w-5 h-5 text-[#F22998]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#F2F2F2]">Otimização de Rota</h3>
            <p className="text-sm text-[#F2F2F2]/60">Múltiplas paradas com tráfego em tempo real</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <AnimatePresence>
            {waypoints.map((waypoint, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-green-500' : index === waypoints.length - 1 ? 'bg-[#F22998]' : 'bg-blue-500'
                  }`}>
                    {index === 0 ? 'A' : index === waypoints.length - 1 ? 'B' : index + 1}
                  </div>
                  <Input
                    placeholder={index === 0 ? 'Ponto de partida' : index === waypoints.length - 1 ? 'Destino final' : `Parada ${index}`}
                    value={waypoint.address}
                    onChange={(e) => updateWaypoint(index, e.target.value)}
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                  />
                </div>
                {waypoints.length > 2 && index !== 0 && index !== waypoints.length - 1 && (
                  <Button
                    onClick={() => removeWaypoint(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {waypoints.length < 10 && (
          <Button
            onClick={addWaypoint}
            variant="outline"
            className="w-full mb-4 border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Parada
          </Button>
        )}

        <Button
          onClick={optimizeRoute}
          disabled={optimizing}
          className="w-full btn-gradient"
        >
          {optimizing ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
              Otimizando...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Otimizar Rota
            </>
          )}
        </Button>
      </Card>

      {optimizedRoute && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/30">
            <h4 className="font-semibold text-[#F2F2F2] mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[#F22998]" />
              Rota Otimizada
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-[#0D0D0D]/50">
                <p className="text-sm text-[#F2F2F2]/60 mb-1">Distância Total</p>
                <p className="text-xl font-bold text-[#F2F2F2]">
                  {optimizedRoute.distance.toFixed(1)} km
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D0D0D]/50">
                <p className="text-sm text-[#F2F2F2]/60 mb-1">Tempo Estimado</p>
                <p className="text-xl font-bold text-[#F2F2F2]">
                  {Math.round(optimizedRoute.duration)} min
                </p>
              </div>
            </div>

            {optimizedRoute.optimized && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Zap className="w-4 h-4" />
                Tráfego em tempo real considerado
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}