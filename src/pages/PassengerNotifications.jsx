import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronLeft, Trash2, CheckCircle, Gift, Car, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PassengerNotifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const userNotifications = await base44.entities.Notification.filter(
        { user_id: userData.id },
        '-created_date'
      );
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Erro ao carregar:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        base44.auth.redirectToLogin();
      } else {
        toast.error('Erro ao carregar notificações');
      }
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      coupon: Gift,
      ride: Car,
      event: Calendar,
      system: Info
    };
    const Icon = icons[type] || Bell;
    return Icon;
  };

  const getNotificationColor = (type) => {
    const colors = {
      coupon: 'text-[#F22998]',
      ride: 'text-blue-400',
      event: 'text-purple-400',
      system: 'text-gray-400'
    };
    return colors[type] || 'text-[#F22998]';
  };

  const markAsRead = async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, { is_read: true });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const removeNotification = async (notificationId) => {
    try {
      await base44.entities.Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificação removida');
    } catch (error) {
      console.error('Erro ao remover:', error);
      toast.error('Erro ao remover notificação');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Todas marcadas como lidas');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.related_link) {
      navigate(notification.related_link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('PassengerOptions')}>
              <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#F2F2F2]">Notificações</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-[#F22998]">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="ghost"
              size="sm"
              className="text-[#F22998] hover:bg-[#F22998]/10"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bell className="w-20 h-20 text-[#F22998]/30 mb-4" />
            <p className="text-[#F2F2F2]/50 text-lg">Nenhuma notificação</p>
            <p className="text-[#F2F2F2]/30 text-sm mt-2">
              Você receberá atualizações importantes aqui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`p-4 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl cursor-pointer transition-all hover:border-[#F22998]/40 ${
                        !notification.is_read ? 'bg-[#F22998]/5 border-[#F22998]/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-[#0D0D0D] flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-[#F2F2F2]">{notification.title}</h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 rounded-full bg-[#F22998] mt-1.5 flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-[#F2F2F2]/70 text-sm mb-2">{notification.message}</p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-[#F2F2F2]/40 text-xs">
                              {new Date(notification.created_date).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}