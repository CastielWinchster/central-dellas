import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Users, TrendingUp, Star, Phone, 
  Car, DollarSign, Activity, Calendar, Ticket 
} from 'lucide-react';
import AppUsers from '../components/admin/AppUsers';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import LiveMap from '../components/admin/LiveMap';
import DispatchRide from '../components/admin/DispatchRide';
import Reports from '../components/admin/Reports';
import RideHistory from '../components/admin/RideHistory';
import MigrationMetrics from '../components/admin/MigrationMetrics';
import PriceManager from '../components/admin/PriceManager';
import CouponManager from '../components/admin/CouponManager';
import AdminPasswordGate from '../components/admin/AdminPasswordGate';
import { lockAdminPanel } from '@/lib/adminGate';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

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
      
      if (!userData || userData.role !== 'admin') {
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

      // Receita de hoje (usa o preço confirmado/acordado/estimado, nesta ordem)
      const todayRevenue = todayRides
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.driver_confirmed_price ?? r.agreed_price ?? r.estimated_price ?? 0), 0);

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
        <Car className="w-16 h-16 text-[#F472B6] animate-bounce" />
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
      color: 'from-[#F472B6] to-[#EC4899]'
    }
  ];

  return (
    <AdminPasswordGate>
    <div className="min-h-screen bg-[#0D0D0D] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#EC4899] to-[#F472B6] p-6 text-white">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Central de Monitoramento</h1>
            <p className="text-white/80">Painel Administrativo - Central Dellas</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              lockAdminPanel();
              navigate('/PassengerHome');
            }}
            className="border-white/40 text-white hover:bg-white/10 shrink-0"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Bloquear painel
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-[#F2F2F2]/5 border-[#F472B6]/10 p-6">
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
          <TabsList className="bg-[#F2F2F2]/5 border border-[#F472B6]/20 flex-wrap h-auto">
            <TabsTrigger value="map" className="data-[state=active]:bg-[#F472B6]">
              <MapPin className="w-4 h-4 mr-2" />
              Mapa ao Vivo
            </TabsTrigger>
            <TabsTrigger value="prices" className="data-[state=active]:bg-[#F472B6]">
              <DollarSign className="w-4 h-4 mr-2" />
              Preços
            </TabsTrigger>
            <TabsTrigger value="coupons" className="data-[state=active]:bg-[#F472B6]">
              <Ticket className="w-4 h-4 mr-2" />
              Cupons
            </TabsTrigger>
            <TabsTrigger value="dispatch" className="data-[state=active]:bg-[#F472B6]">
              <Phone className="w-4 h-4 mr-2" />
              Despachar Corrida
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#F472B6]">
              <Calendar className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[#F472B6]">
              <Users className="w-4 h-4 mr-2" />
              Usuárias
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#F472B6]">
              <TrendingUp className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="migration" className="data-[state=active]:bg-[#F472B6]">
              <Activity className="w-4 h-4 mr-2" />
              Migração App
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <LiveMap />
          </TabsContent>

          <TabsContent value="prices">
            <PriceManager />
          </TabsContent>

          <TabsContent value="coupons">
            <CouponManager />
          </TabsContent>

          <TabsContent value="dispatch">
            <DispatchRide onRideDispatched={loadStats} />
          </TabsContent>

          <TabsContent value="history">
            <RideHistory />
          </TabsContent>

          <TabsContent value="users">
            <AppUsers />
          </TabsContent>

          <TabsContent value="reports">
            <Reports />
          </TabsContent>

          <TabsContent value="migration">
            <MigrationMetrics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </AdminPasswordGate>
  );
}