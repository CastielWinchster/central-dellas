import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Star, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

export default function Reports() {
  const [period, setPeriod] = useState('today');
  const [stats, setStats] = useState({
    totalRides: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    avgRating: 0,
    completionRate: 0,
    topDrivers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const rides = await base44.entities.Ride.list();
      const drivers = await base44.entities.User.filter({ user_type: 'driver' });
      const reviews = await base44.entities.Review.list();

      // Filtrar por período
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const filteredRides = rides.filter(r => 
        new Date(r.created_date) >= startDate
      );

      // Calcular estatísticas
      const completedRides = filteredRides.filter(r => r.status === 'completed');
      const totalRevenue = completedRides.reduce((sum, r) => sum + (r.final_price || 0), 0);
      const activeDrivers = drivers.filter(d => d.is_online).length;
      
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      const completionRate = filteredRides.length > 0
        ? (completedRides.length / filteredRides.length) * 100
        : 0;

      // Top motoristas
      const driverStats = {};
      completedRides.forEach(ride => {
        if (ride.driver_id) {
          if (!driverStats[ride.driver_id]) {
            driverStats[ride.driver_id] = { rides: 0, revenue: 0 };
          }
          driverStats[ride.driver_id].rides++;
          driverStats[ride.driver_id].revenue += ride.final_price || 0;
        }
      });

      const topDrivers = await Promise.all(
        Object.entries(driverStats)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 5)
          .map(async ([driverId, stats]) => {
            const driver = drivers.find(d => d.id === driverId);
            return {
              name: driver?.full_name || 'N/A',
              rides: stats.rides,
              revenue: stats.revenue
            };
          })
      );

      setStats({
        totalRides: filteredRides.length,
        totalRevenue,
        activeDrivers,
        avgRating: avgRating.toFixed(1),
        completionRate: completionRate.toFixed(1),
        topDrivers
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading reports:', error);
      setLoading(false);
    }
  };

  const reportCards = [
    {
      icon: TrendingUp,
      label: 'Total de Corridas',
      value: stats.totalRides,
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: DollarSign,
      label: 'Receita Total',
      value: `R$ ${stats.totalRevenue.toFixed(2)}`,
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Users,
      label: 'Motoristas Ativas',
      value: stats.activeDrivers,
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Star,
      label: 'Avaliação Média',
      value: stats.avgRating,
      color: 'from-yellow-500 to-yellow-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[#F2F2F2] font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#F22998]" />
            Período
          </h3>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-[#0D0D0D] border-[#F22998]/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0D0D0D] border-[#F22998]/20">
              <SelectItem value="today" className="text-white">Hoje</SelectItem>
              <SelectItem value="week" className="text-white">Última Semana</SelectItem>
              <SelectItem value="month" className="text-white">Último Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((card, index) => (
          <Card key={index} className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-6">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-[#F2F2F2]/60 text-sm mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-[#F2F2F2]">{card.value}</p>
          </Card>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Completion Rate */}
        <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-6">
          <h3 className="text-[#F2F2F2] font-semibold mb-4">Taxa de Conclusão</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-[#0D0D0D] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#BF3B79] to-[#F22998]"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <span className="text-2xl font-bold text-[#F22998]">
              {stats.completionRate}%
            </span>
          </div>
        </Card>

        {/* Top Drivers */}
        <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-6">
          <h3 className="text-[#F2F2F2] font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Top 5 Motoristas
          </h3>
          <div className="space-y-3">
            {stats.topDrivers.map((driver, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#F22998] flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-[#F2F2F2] text-sm">{driver.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-[#F22998] font-semibold text-sm">
                    R$ {driver.revenue.toFixed(2)}
                  </p>
                  <p className="text-[#F2F2F2]/60 text-xs">{driver.rides} corridas</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}