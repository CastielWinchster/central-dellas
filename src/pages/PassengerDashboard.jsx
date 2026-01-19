import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  MapPin, Navigation, Clock, History, MessageCircle, 
  User, Wallet, Star, Car, Heart, Shield
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MigrationIncentivePopup from '../components/MigrationIncentivePopup';
import Breadcrumb from '../components/Breadcrumb';
import { useKeyboardShortcuts } from '../components/useKeyboardShortcuts';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';

export default function PassengerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const shortcuts = [
    { key: 'r', description: 'Solicitar corrida', action: () => navigate(createPageUrl('RequestRide')) },
    { key: 'h', description: 'Ver histórico', action: () => navigate(createPageUrl('RideHistory')) },
    { key: 'c', description: 'Clube Dellas', action: () => navigate(createPageUrl('ClubDellas')) },
    { key: 'p', description: 'Perfil', action: () => navigate(createPageUrl('Profile')) },
  ];

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        navigate(createPageUrl('PassengerLogin'));
      }
    };
    loadUser();
  }, [navigate]);

  const quickActions = [
    { 
      icon: MapPin, 
      label: 'Chamar Agora', 
      sublabel: 'Corrida imediata',
      page: 'RequestRide',
      gradient: 'from-[#BF3B79] to-[#F22998]'
    },
    { 
      icon: Clock, 
      label: 'Agendar Corrida', 
      sublabel: 'Até 30 dias',
      page: 'ScheduleRide',
      gradient: 'from-[#F22998] to-[#8C0D60]'
    },
    { 
      icon: Heart, 
      label: 'Favoritas', 
      sublabel: 'Ver motoristas',
      page: 'FavoriteDrivers',
      gradient: 'from-[#8C0D60] to-[#BF3B79]'
    }
  ];

  const mainOptions = [
    {
      icon: Car,
      label: 'Solicitar Corrida',
      description: 'Peça uma corrida agora',
      page: 'RequestRide',
      color: 'bg-gradient-to-br from-[#BF3B79] to-[#F22998]'
    },
    {
      icon: History,
      label: 'Histórico',
      description: 'Ver minhas corridas',
      page: 'RideHistory',
      color: 'bg-gradient-to-br from-[#F22998] to-[#8C0D60]'
    },
    {
      icon: MessageCircle,
      label: 'Mensagens',
      description: 'Conversar com motoristas',
      page: 'PassengerMessages',
      color: 'bg-gradient-to-br from-[#8C0D60] to-[#BF3B79]'
    },
    {
      icon: Wallet,
      label: 'Carteira',
      description: 'Saldo e recargas',
      page: 'Wallet',
      color: 'bg-gradient-to-br from-[#BF3B79] to-[#F22998]'
    },
    {
      icon: Star,
      label: 'Clube Dellas',
      description: 'Planos e benefícios',
      page: 'ClubDellas',
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600'
    },
    {
      icon: Heart,
      label: 'Programa Fidelidade',
      description: 'Pontos e recompensas',
      page: 'LoyaltyProgram',
      color: 'bg-gradient-to-br from-[#8C0D60] to-[#BF3B79]'
    },
    {
      icon: User,
      label: 'Perfil',
      description: 'Configurações da conta',
      page: 'Profile',
      color: 'bg-gradient-to-br from-[#F22998] to-[#8C0D60]'
    }
  ];

  const isDark = user?.theme !== 'light';

  return (
    <div className={`min-h-screen pb-24 md:pb-10 ${isDark ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
      <MigrationIncentivePopup />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb items={[{ label: 'Dashboard', page: 'PassengerDashboard' }]} />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
            Olá, {user?.full_name?.split(' ')[0] || 'Passageira'}! 👋
          </h1>
          <p className={isDark ? 'text-[#F2F2F2]/60' : 'text-black/70'}>
            Para onde vamos hoje?
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(createPageUrl(action.page))}
                className={`p-4 rounded-2xl border transition-all text-left group ${
                  isDark 
                    ? 'bg-[#F2F2F2]/5 border-[#F22998]/10 hover:border-[#F22998]/30' 
                    : 'bg-white border-gray-200 hover:border-[#F22998]/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <p className={`font-medium text-sm ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
                  {action.label}
                </p>
                <p className={`text-xs ${isDark ? 'text-[#F2F2F2]/50' : 'text-black/60'}`}>
                  {action.sublabel}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Main Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
            Menu Principal
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {mainOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={() => navigate(createPageUrl(option.page))}
                  className={`p-6 rounded-2xl cursor-pointer transition-all border-2 ${
                    isDark
                      ? 'bg-[#F2F2F2]/5 border-[#F22998]/10 hover:border-[#F22998]/30'
                      : 'bg-white border-gray-200 hover:border-[#F22998]/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${option.color} flex items-center justify-center shadow-lg`}>
                      <option.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-lg ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
                        {option.label}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-black/60'}`}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Card className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/30' : 'bg-gradient-to-br from-[#BF3B79]/10 to-[#F22998]/10 border-[#F22998]/20'}`}>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <p className="text-2xl font-bold text-[#F22998]">{user?.average_rating || '5.0'}</p>
                </div>
                <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-black/60'}`}>Avaliação</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Car className="w-5 h-5 text-[#F22998]" />
                  <p className="text-2xl font-bold text-[#F22998]">{user?.total_rides || '0'}</p>
                </div>
                <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-black/60'}`}>Corridas</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-[#F22998]" />
                  <p className="text-2xl font-bold text-[#F22998]">VIP</p>
                </div>
                <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-black/60'}`}>Status</p>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <KeyboardShortcutsHelp shortcuts={[
          { description: 'Solicitar corrida', keys: ['Ctrl', 'R'] },
          { description: 'Ver histórico', keys: ['Ctrl', 'H'] },
          { description: 'Clube Dellas', keys: ['Ctrl', 'C'] },
          { description: 'Perfil', keys: ['Ctrl', 'P'] },
        ]} />
      </div>
    </div>
  );
}