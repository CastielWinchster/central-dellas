import React, { useState, useEffect } from 'react';
import { Calendar, User, MapPin, DollarSign, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function RideHistory() {
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRides();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = rides.filter(ride =>
        ride.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ride.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ride.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRides(filtered);
    } else {
      setFilteredRides(rides);
    }
  }, [searchTerm, rides]);

  const loadRides = async () => {
    try {
      const allRides = await base44.entities.Ride.list('-created_date', 100);
      
      // Enriquecer com dados de passageira e motorista
      const enrichedRides = await Promise.all(
        allRides.map(async (ride) => {
          try {
            const [passengers, drivers] = await Promise.all([
              ride.passenger_id ? base44.entities.User.filter({ id: ride.passenger_id }) : [],
              ride.driver_id ? base44.entities.User.filter({ id: ride.driver_id }) : []
            ]);

            return {
              ...ride,
              passenger_name: passengers[0]?.full_name || 'N/A',
              driver_name: drivers[0]?.full_name || 'N/A'
            };
          } catch (error) {
            return ride;
          }
        })
      );

      setRides(enrichedRides);
      setFilteredRides(enrichedRides);
      setLoading(false);
    } catch (error) {
      console.error('Error loading rides:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      searching: { label: 'Procurando', color: 'bg-yellow-500' },
      accepted: { label: 'Aceita', color: 'bg-blue-500' },
      arriving: { label: 'A caminho', color: 'bg-purple-500' },
      in_progress: { label: 'Em andamento', color: 'bg-green-500' },
      completed: { label: 'Concluída', color: 'bg-gray-500' },
      cancelled: { label: 'Cancelada', color: 'bg-red-500' }
    };

    const config = statusConfig[status] || statusConfig.searching;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-8 text-center">
        <p className="text-[#F2F2F2]/60">Carregando histórico...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-4">
        <Input
          placeholder="Buscar por passageira, motorista ou endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#0D0D0D] border-[#F22998]/20 text-white"
        />
      </Card>

      {/* Rides List */}
      <div className="space-y-3">
        {filteredRides.map((ride) => (
          <Card key={ride.id} className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  {getStatusBadge(ride.status)}
                  {ride.dispatched_by === 'admin' && (
                    <Badge className="bg-[#F22998]">Despachada</Badge>
                  )}
                  <span className="text-xs text-[#F2F2F2]/60">
                    #{ride.id.substring(0, 8)}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-[#F2F2F2]">
                    <User className="w-4 h-4 text-[#F22998]" />
                    <span>{ride.passenger_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#F2F2F2]">
                    <User className="w-4 h-4 text-green-500" />
                    <span>{ride.driver_name}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-[#F2F2F2]/60">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 mt-0.5 text-green-500" />
                    <span>{ride.pickup_address}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 mt-0.5 text-[#F22998]" />
                    <span>{ride.destination_address}</span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end gap-2">
                {ride.final_price && (
                  <div className="flex items-center gap-1 text-[#F22998]">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-bold">R$ {ride.final_price.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[#F2F2F2]/60 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(ride.created_date).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredRides.length === 0 && (
          <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-8 text-center">
            <p className="text-[#F2F2F2]/60">Nenhuma corrida encontrada</p>
          </Card>
        )}
      </div>
    </div>
  );
}