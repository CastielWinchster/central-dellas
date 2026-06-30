import React, { useState, useEffect, useMemo } from 'react';
import { User, MapPin, DollarSign, Clock, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toBrasiliaDateFull, toBrasiliaDateInput, todayBrasiliaDateInput } from '@/utils/dateUtils';

export default function RideHistory() {
  const [rides, setRides] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayBrasiliaDateInput());
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const allRides = await base44.entities.Ride.list('-created_date', 500);
      setRides(allRides);

      const ids = new Set();
      allRides.forEach((r) => {
        if (r.passenger_id) ids.add(r.passenger_id);
        if (r.assigned_driver_id) ids.add(r.assigned_driver_id);
      });

      const map = {};
      if (ids.size > 0) {
        try {
          const res = await base44.functions.invoke('getUsersByIds', {
            userIds: Array.from(ids),
          });
          const users = res.data?.users || {};
          Object.entries(users).forEach(([id, info]) => {
            map[id] = info.name || info.email || 'Usuária';
          });
        } catch (nameError) {
          console.error('Error loading user names:', nameError);
        }
      }
      setUserMap(map);

      setLoading(false);
    } catch (error) {
      console.error('Error loading rides:', error);
      setLoading(false);
    }
  };

  const getPrice = (ride) =>
    ride.driver_confirmed_price ?? ride.agreed_price ?? ride.estimated_price ?? null;

  // Filtra por data selecionada + termo de busca
  const filteredRides = useMemo(() => {
    return rides.filter(ride => {
      // Filtro de data
      if (selectedDate) {
        if (toBrasiliaDateInput(ride.created_date) !== selectedDate) return false;
      }
      // Filtro de busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const passenger = (userMap[ride.passenger_id] || '').toLowerCase();
        const driver = (userMap[ride.assigned_driver_id] || '').toLowerCase();
        const matches =
          passenger.includes(term) ||
          driver.includes(term) ||
          (ride.pickup_text || '').toLowerCase().includes(term) ||
          (ride.dropoff_text || '').toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [rides, selectedDate, searchTerm, userMap]);

  // Resumo do dia
  const daySummary = useMemo(() => {
    const total = filteredRides.length;
    const completed = filteredRides.filter(r => r.status === 'completed').length;
    const revenue = filteredRides
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (getPrice(r) || 0), 0);
    return { total, completed, revenue };
  }, [filteredRides]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      requested: { label: 'Procurando', color: 'bg-yellow-500' },
      assigned: { label: 'Designada', color: 'bg-yellow-600' },
      accepted: { label: 'Aceita', color: 'bg-blue-500' },
      arrived: { label: 'Chegou', color: 'bg-purple-500' },
      in_progress: { label: 'Em andamento', color: 'bg-green-500' },
      picked_up: { label: 'Em andamento', color: 'bg-green-500' },
      in_transit: { label: 'Em andamento', color: 'bg-green-500' },
      completed: { label: 'Concluída', color: 'bg-emerald-600' },
      delivered: { label: 'Entregue', color: 'bg-emerald-600' },
      cancelled: { label: 'Cancelada', color: 'bg-red-500' },
      expired: { label: 'Expirada', color: 'bg-gray-500' },
    };
    const config = statusConfig[status] || { label: status, color: 'bg-gray-500' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-8 text-center">
        <p className="text-[#F2F2F2]/60">Carregando histórico...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-[#A855F7] flex-shrink-0" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#0D0D0D] border-[#A855F7]/20 text-white"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-xs text-[#F2F2F2]/50 hover:text-[#A855F7] whitespace-nowrap"
              >
                Ver tudo
              </button>
            )}
          </div>
          <Input
            placeholder="Buscar por passageira, motorista ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#0D0D0D] border-[#A855F7]/20 text-white flex-1"
          />
        </div>

        {/* Resumo do período filtrado */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-[#0D0D0D] rounded-xl p-3 text-center">
            <p className="text-xs text-[#F2F2F2]/50">Corridas</p>
            <p className="text-xl font-bold text-[#F2F2F2]">{daySummary.total}</p>
          </div>
          <div className="bg-[#0D0D0D] rounded-xl p-3 text-center">
            <p className="text-xs text-[#F2F2F2]/50">Concluídas</p>
            <p className="text-xl font-bold text-emerald-400">{daySummary.completed}</p>
          </div>
          <div className="bg-[#0D0D0D] rounded-xl p-3 text-center">
            <p className="text-xs text-[#F2F2F2]/50">Receita</p>
            <p className="text-xl font-bold text-[#A855F7]">R$ {daySummary.revenue.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      {/* Lista de corridas */}
      <div className="space-y-3">
        {filteredRides.map((ride) => {
          const price = getPrice(ride);
          return (
            <Card key={ride.id} className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(ride.status)}
                    {ride.ride_type === 'delivery' && (
                      <Badge className="bg-orange-500">Entrega</Badge>
                    )}
                    {ride.ride_type === 'rotta_roza' && (
                      <Badge className="bg-purple-500">Rotta Roza</Badge>
                    )}
                    <span className="text-xs text-[#F2F2F2]/60">
                      #{ride.id.substring(0, 8)}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-[#F2F2F2]">
                      <User className="w-4 h-4 text-[#A855F7]" />
                      <span>{userMap[ride.passenger_id] || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#F2F2F2]">
                      <User className="w-4 h-4 text-green-500" />
                      <span>{ride.assigned_driver_id ? (userMap[ride.assigned_driver_id] || 'Motorista') : '— sem motorista'}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-[#F2F2F2]/60">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 mt-0.5 text-green-500" />
                      <span>{ride.pickup_text}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 mt-0.5 text-[#A855F7]" />
                      <span>{ride.dropoff_text}</span>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end gap-2">
                  {price != null && (
                    <div className="flex items-center gap-1 text-[#A855F7]">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-bold">R$ {Number(price).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[#F2F2F2]/60 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{toBrasiliaDateFull(ride.created_date)}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredRides.length === 0 && (
          <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-8 text-center">
            <p className="text-[#F2F2F2]/60">Nenhuma corrida encontrada neste período</p>
          </Card>
        )}
      </div>
    </div>
  );
}