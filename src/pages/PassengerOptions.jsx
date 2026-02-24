import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  X, User, MapPin, Calendar, CreditCard, Heart, 
  Shield, HelpCircle, Bell, Settings, LogOut, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PassengerOptions() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        base44.auth.redirectToLogin();
      } else {
        toast.error('Erro ao carregar dados do usuário');
      }
    } finally {
      setLoading(false);
    }
  };

  const menuSections = [
    {
      title: 'Minha Conta',
      items: [
        { icon: User, label: 'Perfil', description: 'Editar informações pessoais', page: 'PassengerProfile' },
        { icon: Bell, label: 'Notificações', description: 'Ver todas as notificações', page: 'PassengerNotifications' }
      ]
    },
    {
      title: 'Minhas Corridas',
      items: [
        { icon: MapPin, label: 'Locais Favoritos', description: 'Gerenciar endereços salvos', page: 'FavoritePlaces' },
        { icon: Calendar, label: 'Agendar Corrida', description: 'Programar viagens futuras', page: 'ScheduleRide' },
        { icon: Heart, label: 'Motoristas Favoritas', description: 'Suas motoristas preferidas', page: 'FavoriteDrivers' }
      ]
    },
    {
      title: 'Pagamentos',
      items: [
        { icon: CreditCard, label: 'Cartões e Pix', description: 'Gerenciar formas de pagamento', page: 'CardsAndPix' }
      ]
    },
    {
      title: 'Segurança e Privacidade',
      items: [
        { icon: Shield, label: 'Segurança', description: 'Contatos de emergência e configurações', page: 'PassengerSafety' }
      ]
    },
    {
      title: 'Suporte',
      items: [
        { icon: HelpCircle, label: 'Ajuda', description: 'Central de ajuda e suporte', page: 'PassengerHelp' },
        { icon: Settings, label: 'Configurações', description: 'Preferências do aplicativo', page: 'Settings' }
      ]
    }
  ];

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Opções</h1>
          <Link to={createPageUrl('PassengerHome')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <X className="w-6 h-6" />
            </Button>
          </Link>
        </div>

        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-gradient-to-br from-[#BF3B79] to-[#F22998] border-none mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user?.full_name || 'Usuária'}</h2>
                <p className="text-white/80 text-sm">{user?.email}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Menu Sections */}
        <div className="space-y-6">
          {menuSections.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <h3 className="text-sm font-semibold text-[#F2F2F2]/50 uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <Link key={item.page} to={createPageUrl(item.page)}>
                    <Card className="p-4 bg-[#1A1A1A] border-[#F22998]/20 hover:border-[#F22998]/40 transition-all cursor-pointer rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F22998]/10 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-[#F22998]" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#F2F2F2]">{item.label}</h4>
                          <p className="text-sm text-[#F2F2F2]/60">{item.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Button
            onClick={async () => {
              const loginUrl = window.location.origin + createPageUrl('PassengerLogin');
              await base44.auth.logout(loginUrl);
            }}
            variant="outline"
            className="w-full border-red-400/30 text-red-400 hover:bg-red-500/10 py-6 rounded-2xl"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair da Conta
          </Button>
        </motion.div>
      </div>
    </div>
  );
}