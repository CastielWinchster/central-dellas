import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Users, TrendingUp, Star, Phone, 
  Car, DollarSign, Activity, Calendar 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import LiveMap from '../components/admin/LiveMap';
import DispatchRide from '../components/admin/DispatchRide';
import Reports from '../components/admin/Reports';
import RideHistory from '../components/admin/RideHistory';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeDrivers: 0,
    todayRides: 0,
    todayRevenue: 0,
    avgRating: 0
  });

  useEffect(() => {
    checkAdminAccess();
    loadStats();

    // Atualizar stats a cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAdminAccess = async () => {
    try {
      const userData = await base44.auth.me();
      
      if (userData.role !== 'admin') {
        navigate('/PassengerHome');
        return;
      }
      
      setUser(userData);
      setLoading(false);
    } catch (error) {
      navigate('/PassengerLogin');
    }
  };

  const loadStats = async () => {
    try {
      // Motoristas ativas hoje
      const drivers = await base44.entities.User.filter({ user_type: 'driver' });
      const activeDrivers = drivers.filter(d => d.is_online).length;

      // Corridas de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const rides = await base44.entities.Ride.list();
      const todayRides = rides.filter(r => 
        new Date(r.created_date) >= today
      );

      // Receita de hoje
      const todayRevenue = todayRides
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.final_price || 0), 0);

      // Avaliação média
      const reviews = await base44.entities.Review.list();
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      setStats({
        activeDrivers,
        todayRides: todayRides.length,
        todayRevenue,
        avgRating: avgRating.toFixed(1)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Car className="w-16 h-16 text-[#F22998] animate-bounce" />
      </div>
    );
  }

  const statCards = [
    {
      icon: Car,
      label: 'Motoristas Ativas',
      value: stats.activeDrivers,
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Activity,
      label: 'Corridas Hoje',
      value: stats.todayRides,
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: DollarSign,
      label: 'Receita Hoje',
      value: `R$ ${stats.todayRevenue.toFixed(2)}`,
      color: 'from-[#F22998] to-[#BF3B79]'
    },
    {
      icon: Star,
      label: 'Avaliação Média',
      value: stats.avgRating,
      color: 'from-yellow-500 to-yellow-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#BF3B79] to-[#F22998] p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Central de Monitoramento</h1>
          <p className="text-white/80">Painel Administrativo - Central Dellas</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-[#F2F2F2]/60 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-[#F2F2F2]">{stat.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="bg-[#F2F2F2]/5 border border-[#F22998]/20">
            <TabsTrigger value="map" className="data-[state=active]:bg-[#F22998]">
              <MapPin className="w-4 h-4 mr-2" />
              Mapa ao Vivo
            </TabsTrigger>
            <TabsTrigger value="dispatch" className="data-[state=active]:bg-[#F22998]">
              <Phone className="w-4 h-4 mr-2" />
              Despachar Corrida
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#F22998]">
              <Calendar className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#F22998]">
              <TrendingUp className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <LiveMap />
          </TabsContent>

          <TabsContent value="dispatch">
            <DispatchRide onRideDispatched={loadStats} />
          </TabsContent>

          <TabsContent value="history">
            <RideHistory />
          </TabsContent>

          <TabsContent value="reports">
            <Reports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}