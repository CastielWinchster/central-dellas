import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Heart, Star, Car, Phone, ChevronLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function FavoriteDrivers() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const favs = await base44.entities.FavoriteDriver.filter({ user_id: userData.id });
      
      // Buscar dados das motoristas
      const driversData = await Promise.all(
        favs.map(async (fav) => {
          const driverInfo = await base44.entities.User.filter({ id: fav.driver_id });
          const vehicles = await base44.entities.Vehicle.filter({ driver_id: fav.driver_id });
          const reviews = await base44.entities.Review.filter({ reviewed_id: fav.driver_id });
          
          const avgRating = reviews.length > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : '5.0';
          
          return {
            ...fav,
            driver: driverInfo[0],
            vehicle: vehicles[0],
            rating: avgRating
          };
        })
      );
      
      setFavorites(driversData);
    } catch (error) {
      console.error('Erro ao carregar:', error);
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favoriteId) => {
    if (!confirm('Remover esta motorista dos favoritos?')) return;
    
    try {
      await base44.entities.FavoriteDriver.delete(favoriteId);
      toast.success('Removida dos favoritos');
      loadData();
    } catch (error) {
      toast.error('Erro ao remover');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('PassengerOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Motoristas Favoritas</h1>
        </div>

        {/* Empty State */}
        {favorites.length === 0 && (
          <Card className="p-8 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl text-center">
            <Heart className="w-12 h-12 text-[#F22998]/50 mx-auto mb-3" />
            <p className="text-[#F2F2F2]/60 mb-2">Nenhuma motorista favorita ainda</p>
            <p className="text-sm text-[#F2F2F2]/40">
              Favorite motoristas ao avaliar suas corridas
            </p>
          </Card>
        )}

        {/* Favorites List */}
        <div className="space-y-3">
          {favorites.map((fav) => (
            <motion.div
              key={fav.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#F22998]">
                    {fav.driver?.photo_url ? (
                      <img src={fav.driver.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-[#F2F2F2]">{fav.driver?.full_name || 'Motorista'}</h3>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-[#F2F2F2]/70">{fav.rating}</span>
                      </div>
                      {fav.vehicle && (
                        <>
                          <span className="text-[#F2F2F2]/40">•</span>
                          <div className="flex items-center gap-1">
                            <Car className="w-4 h-4 text-[#F22998]" />
                            <span className="text-sm text-[#F2F2F2]/70">
                              {fav.vehicle.brand} {fav.vehicle.model}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {fav.total_rides_together > 0 && (
                      <p className="text-xs text-[#F2F2F2]/50 mt-1">
                        {fav.total_rides_together} corridas juntas
                      </p>
                    )}
                    
                    {fav.notes && (
                      <p className="text-xs text-[#F2F2F2]/60 mt-2 italic">"{fav.notes}"</p>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleRemove(fav.id)}
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}