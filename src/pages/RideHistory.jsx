import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Car, MapPin, Clock, DollarSign, Star, 
  ChevronRight, Calendar, Filter, Download, Search,
  FileDown, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ReceiptDialog from '../components/ride/ReceiptDialog';
import { toast } from 'sonner';
import { toBrasiliaDate, toBrasiliaDateFull } from '../utils/dateUtils';

export default function RideHistory() {
  const [user, setUser] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedRideForReceipt, setSelectedRideForReceipt] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');
  const [driverNames, setDriverNames] = useState({});

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
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

  const { data: rides = [], isLoading } = useQuery({
    queryKey: ['rides', user?.id],
    queryFn: () => base44.entities.Ride.filter({ passenger_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  // Buscar nomes das motoristas para corridas com assigned_driver_id
  useEffect(() => {
    if (!rides.length) return;
    const ridesWithDriver = rides.filter(r => r.assigned_driver_id && !driverNames[r.id]);
    ridesWithDriver.forEach(async (ride) => {
      try {
        const res = await base44.functions.invoke('getDriverInfo', { driverId: ride.assigned_driver_id });
        if (res.data?.name) {
          setDriverNames(prev => ({ ...prev, [ride.id]: res.data.name }));
        }
      } catch (e) {}
    });
  }, [rides]);

  // Apenas corridas concluídas/canceladas com endereço válido
  const displayRides = rides.filter(r =>
    (r.status === 'completed' || r.status === 'cancelled') &&
    (r.pickup_text || r.pickup_address)
  );

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

  let filteredRides = displayRides;
  
  if (selectedFilter !== 'all') {
    filteredRides = filteredRides.filter(ride => ride.status === selectedFilter);
  }
  
  const now = new Date();
  const periodDays = parseInt(periodFilter);
  if (periodDays > 0) {
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    filteredRides = filteredRides.filter(ride => new Date(ride.created_date) >= cutoffDate);
  }
  
  if (searchQuery.length >= 2) {
    const query = searchQuery.toLowerCase();
    filteredRides = filteredRides.filter(ride => 
      (ride.pickup_text || ride.pickup_address || '').toLowerCase().includes(query) ||
      (ride.dropoff_text || ride.destination_address || '').toLowerCase().includes(query) ||
      (driverNames[ride.id] || '').toLowerCase().includes(query)
    );
  }
  
  const handleExportCSV = () => {
    const csv = [
      ['Data', 'Origem', 'Destino', 'Motorista', 'Valor', 'Status'].join(','),
      ...filteredRides.map(ride => [
        toBrasiliaDateFull(ride.created_date),
        ride.pickup_text || ride.pickup_address || '',
        ride.dropoff_text || ride.destination_address || '',
        driverNames[ride.id] || ride.driver?.name || 'N/A',
        `R$ ${(ride.final_price || ride.estimated_price || 0).toFixed(2)}`,
        ride.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-corridas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Histórico exportado!');
  };

  const completedRides = displayRides.filter(r => r.status === 'completed');
  const totalGasto = completedRides.reduce((sum, r) => sum + (r.final_price || r.estimated_price || 0), 0);
  const totalMinutos = completedRides.reduce((sum, r) => sum + (r.estimated_duration || 0), 0);

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <Link to={createPageUrl('PassengerOptions')}>
              <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#F2F2F2]">Histórico de Corridas</h1>
          </div>
        </motion.div>

        {/* Search and Export */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F2]/40" />
            <Input
              placeholder="Buscar por destino ou motorista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1A1A1A] border-[#F22998]/20 text-[#F2F2F2]"
            />
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-[#F22998]/30 text-[#F22998]"
          >
            <FileDown className="w-5 h-5" />
          </Button>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { value: '7', label: '7 dias' },
            { value: '30', label: '30 dias' },
            { value: '90', label: '90 dias' },
            { value: '0', label: 'Tudo' }
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setPeriodFilter(period.value)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                periodFilter === period.value
                  ? 'bg-[#F22998]/20 text-[#F22998] border border-[#F22998]/50'
                  : 'bg-[#F2F2F2]/5 text-[#F2F2F2]/60 hover:bg-[#F22998]/10'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Status Filters */}
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



        {/* Rides List */}
        <div className="space-y-4">
          {filteredRides.map((ride, index) => {
            const status = statusColors[ride.status] || statusColors.completed;
            const pickupAddr = ride.pickup_text || ride.pickup_address || 'Endereço não informado';
            const dropoffAddr = ride.dropoff_text || ride.destination_address || 'Endereço não informado';
            const driverName = ride.driver?.name || driverNames[ride.id];
            const price = ride.final_price || ride.estimated_price;
            
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
                        {toBrasiliaDate(ride.created_date)}
                      </span>
                    </div>
                    <Badge className={`${status.bg} ${status.text} border-0`}>
                      {status.label}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                      <p className="text-[#F2F2F2] text-sm">{pickupAddr}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#F22998] mt-1 flex-shrink-0" />
                      <p className="text-[#F2F2F2] text-sm">{dropoffAddr}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#F22998]/10">
                    {driverName ? (
                      <div className="flex items-center gap-3">
                        {ride.driver?.photo && (
                          <img 
                            src={ride.driver.photo}
                            alt={driverName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-[#F22998]"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#F2F2F2]">{driverName}</p>
                          {ride.driver?.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-[#F2F2F2]/50">{ride.driver.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#F2F2F2]/50 text-sm">
                        {ride.assigned_driver_id ? 'Carregando motorista...' : 'Corrida sem motorista atribuída'}
                      </div>
                    )}

                    <div className="text-right">
                      {price > 0 && (
                        <p className="text-xl font-bold text-[#F22998]">R$ {Number(price).toFixed(2)}</p>
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

          {filteredRides.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Car className="w-16 h-16 text-[#F22998]/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#F2F2F2] mb-2">Nenhuma corrida concluída ainda</h3>
              <p className="text-[#F2F2F2]/50">Suas corridas aparecerão aqui após serem concluídas</p>
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