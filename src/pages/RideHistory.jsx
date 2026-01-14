import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Car, MapPin, Clock, DollarSign, Star, 
  ChevronRight, Calendar, Filter, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReceiptDialog from '../components/ride/ReceiptDialog';

export default function RideHistory() {
  const [user, setUser] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedRideForReceipt, setSelectedRideForReceipt] = useState(null);

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
  }, []);

  const { data: rides = [], isLoading } = useQuery({
    queryKey: ['rides', user?.id],
    queryFn: () => base44.entities.Ride.filter({ passenger_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  // Mock data for demonstration
  const mockRides = [
    {
      id: '1',
      status: 'completed',
      pickup_address: 'Av. Paulista, 1000',
      destination_address: 'Shopping Ibirapuera',
      created_date: new Date(Date.now() - 86400000).toISOString(),
      final_price: 28.50,
      estimated_duration: 15,
      driver: {
        name: 'Maria Silva',
        rating: 4.9,
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
      }
    },
    {
      id: '2',
      status: 'completed',
      pickup_address: 'Rua Augusta, 500',
      destination_address: 'Aeroporto Congonhas',
      created_date: new Date(Date.now() - 172800000).toISOString(),
      final_price: 45.00,
      estimated_duration: 25,
      driver: {
        name: 'Ana Costa',
        rating: 5.0,
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'
      }
    },
    {
      id: '3',
      status: 'cancelled',
      pickup_address: 'Shopping Eldorado',
      destination_address: 'Vila Madalena',
      created_date: new Date(Date.now() - 259200000).toISOString(),
      final_price: 0,
      estimated_duration: 20,
      driver: null
    }
  ];

  const displayRides = rides.length > 0 ? rides : mockRides;

  const statusColors = {
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Concluída' },
    cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelada' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Em andamento' }
  };

  const filters = [
    { id: 'all', label: 'Todas' },
    { id: 'completed', label: 'Concluídas' },
    { id: 'cancelled', label: 'Canceladas' }
  ];

  const filteredRides = selectedFilter === 'all' 
    ? displayRides 
    : displayRides.filter(ride => ride.status === selectedFilter);

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#F2F2F2] mb-2">Histórico de Corridas</h1>
          <p className="text-[#F2F2F2]/60">Suas viagens anteriores com a Central Dellas</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedFilter === filter.id
                  ? 'bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white'
                  : 'bg-[#F2F2F2]/5 text-[#F2F2F2]/60 hover:bg-[#F22998]/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Card className="p-4 rounded-2xl bg-[#F2F2F2]/5 border-[#F22998]/10 text-center">
            <p className="text-2xl font-bold text-[#F22998]">{displayRides.filter(r => r.status === 'completed').length}</p>
            <p className="text-sm text-[#F2F2F2]/50">Corridas</p>
          </Card>
          <Card className="p-4 rounded-2xl bg-[#F2F2F2]/5 border-[#F22998]/10 text-center">
            <p className="text-2xl font-bold text-[#F22998]">
              R$ {displayRides.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.final_price || 0), 0).toFixed(2)}
            </p>
            <p className="text-sm text-[#F2F2F2]/50">Total Gasto</p>
          </Card>
          <Card className="p-4 rounded-2xl bg-[#F2F2F2]/5 border-[#F22998]/10 text-center">
            <p className="text-2xl font-bold text-[#F22998]">
              {displayRides.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.estimated_duration || 0), 0)} min
            </p>
            <p className="text-sm text-[#F2F2F2]/50">Tempo Total</p>
          </Card>
        </motion.div>

        {/* Rides List */}
        <div className="space-y-4">
          {filteredRides.map((ride, index) => {
            const status = statusColors[ride.status] || statusColors.completed;
            
            return (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.3 }}
              >
                <Card className="p-5 rounded-2xl bg-[#F2F2F2]/5 border-[#F22998]/10 hover:border-[#F22998]/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#F2F2F2]/50" />
                      <span className="text-sm text-[#F2F2F2]/50">
                        {format(new Date(ride.created_date), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <Badge className={`${status.bg} ${status.text} border-0`}>
                      {status.label}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
                      <p className="text-[#F2F2F2]">{ride.pickup_address}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#F22998] mt-1" />
                      <p className="text-[#F2F2F2]">{ride.destination_address}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#F22998]/10">
                    {ride.driver ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src={ride.driver.photo}
                          alt={ride.driver.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#F22998]"
                        />
                        <div>
                          <p className="text-sm font-medium text-[#F2F2F2]">{ride.driver.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-[#F2F2F2]/50">{ride.driver.rating}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#F2F2F2]/50 text-sm">Sem motorista</div>
                    )}

                    <div className="text-right">
                      {ride.final_price > 0 && (
                        <p className="text-xl font-bold text-[#F22998]">R$ {ride.final_price.toFixed(2)}</p>
                      )}
                      {ride.estimated_duration && (
                        <p className="text-xs text-[#F2F2F2]/50">{ride.estimated_duration} min</p>
                      )}
                    </div>
                  </div>

                  {ride.status === 'completed' && (
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRideForReceipt(ride)}
                        className="flex-1 border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Recibo
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Avaliar
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}

          {filteredRides.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Car className="w-16 h-16 text-[#F22998]/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#F2F2F2] mb-2">Nenhuma corrida encontrada</h3>
              <p className="text-[#F2F2F2]/50">Suas corridas aparecerão aqui</p>
            </motion.div>
          )}
        </div>

        {/* Receipt Dialog */}
        <ReceiptDialog
          ride={selectedRideForReceipt}
          isOpen={!!selectedRideForReceipt}
          onClose={() => setSelectedRideForReceipt(null)}
        />
      </div>
    </div>
  );
}