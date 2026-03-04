import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  User, Heart, MapPin, Shield, Lock, Bell, 
  Settings, HelpCircle, LogOut, ChevronRight, Wallet, Gift,
  Clock, Star, History, UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import NotificationSettingsPanel from '../components/NotificationSettingsPanel';

export default function PassengerOptions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        
        setUser(userData);
        loadUnreadNotifications(userData.id);
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

  const loadUnreadNotifications = async (userId) => {
    try {
      const notifications = await base44.entities.Notification.filter({
        user_id: userId,
        is_read: false
      });
      
      setUnreadCount(notifications.length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const menuSections = [
    {
      title: '🚀 AÇÕES RÁPIDAS',
      items: [
        { 
          icon: MapPin, 
          label: 'Chamar Agora', 
          description: 'Corrida imediata',
          page: 'RequestRide'
        },
        { 
          icon: Clock, 
          label: 'Agendar Corrida', 
          description: 'Até 30 dias',
          page: 'ScheduleRide'
        }
      ]
    },
    {
      title: '📊 PRINCIPAL',
      items: [
        { 
          icon: History, 
          label: 'Histórico', 
          description: 'Ver minhas corridas',
          page: 'RideHistory'
        }
      ]
    },
    {
      title: '⭐ FAVORITOS',
      items: [
        { 
          icon: Heart, 
          label: 'Motoristas Favoritas', 
          description: 'Minhas motoristas preferidas',
          page: 'FavoriteDrivers'
        },
        { 
          icon: MapPin, 
          label: 'Locais Favoritos', 
          description: 'Casa, trabalho e mais',
          page: 'FavoritePlaces'
        }
      ]
    },
    {
      title: '🆘 SEGURANÇA',
      items: [
        { 
          icon: Shield, 
          label: 'Emergência', 
          description: 'Contatos e recursos de segurança',
          page: 'PassengerSafety'
        },
        { 
          icon: UserX, 
          label: 'Bloqueadas', 
          description: 'Motoristas bloqueadas',
          page: 'BlockedUsers'
        }
      ]
    },
    {
      title: '🔐 CONTA',
      items: [
        { 
          icon: Lock, 
          label: 'Alterar Senha', 
          description: 'Atualizar senha de acesso',
          page: 'PassengerSecurity'
        }
      ]
    },
    {
      title: '🔔 NOTIFICAÇÕES',
      items: [
        { 
          icon: Bell, 
          label: 'Notificações', 
          description: 'Gerenciar alertas',
          page: 'PassengerNotifications'
        }
      ],
      showPanel: true
    },
    {
      title: '⚙️ CONFIGURAÇÕES',
      items: [
        { 
          icon: Settings, 
          label: 'Configurações', 
          description: 'Tema, idioma e privacidade',
          page: 'Settings'
        }
      ]
    },
    {
      title: '💬 SUPORTE',
      items: [
        { 
          icon: HelpCircle, 
          label: 'Central de Ajuda', 
          description: 'FAQ e suporte',
          page: 'PassengerHelp'
        }
      ]
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0D0D0D] flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-[#0D0D0D] border-b-2 border-[#BF3B79] p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-end">
          <Link to={createPageUrl('PassengerHome')}>
            <Button variant="ghost" size="sm" className="text-[#F2F2F2]">
              ✕
            </Button>
          </Link>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 rounded-2xl bg-[#1A1A1A] border border-[#BF3B79]"
          >
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 min-w-[80px] rounded-full overflow-hidden border-4 border-[#F22998] flex-shrink-0">
                {user.photo_url ? (
                  <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
                    <User className="w-10 h-10 text-white/80" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#F2F2F2]">{user.full_name}</h2>
                <p className="text-[#F2F2F2]/60">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Shield className="w-4 h-4 text-[#F22998]" />
                  <span className="text-sm text-[#F22998]">Passageira VIP</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.05 }}
              className="mb-6"
            >
              <h3 className="text-xs font-bold text-[#BF3B79] mb-3 uppercase tracking-wider px-2">
                {section.title}
              </h3>
              
              {section.showPanel && user && (
                <div className="mb-4">
                  <NotificationSettingsPanel userId={user.id} />
                </div>
              )}
              
              <div className="bg-[#1A1A1A] border border-[#BF3B79] rounded-2xl overflow-hidden">
                {section.items.map((item, index) => (
                  <Link
                    key={index}
                    to={createPageUrl(item.page)}
                    className={`flex items-center justify-between p-4 bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-all group ${
                      index !== section.items.length - 1 ? 'border-b border-[#1A1A1A]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#F22998]/20 flex items-center justify-center group-hover:bg-[#F22998]/30 transition-colors relative">
                        <item.icon className="w-6 h-6 text-[#F22998]" />
                        {item.page === 'PassengerNotifications' && unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#F22998] flex items-center justify-center">
                            <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#F2F2F2] text-left">{item.label}</p>
                        <p className="text-sm text-[#CCCCCC] text-left">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998] transition-colors" />
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={async () => {
                const loginUrl = window.location.origin + createPageUrl('PassengerLogin');
                await base44.auth.logout(loginUrl);
              }}
              variant="outline"
              className="w-full py-6 rounded-2xl border-red-500/30 text-red-400 hover:bg-red-500/10 bg-[#2A2A2A]"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sair da Conta
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}