import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const userNotifications = await base44.entities.Notification.filter(
        { user_id: userData.id },
        '-created_date',
        50
      );
      setNotifications(userNotifications);
    } catch (e) {
      base44.auth.redirectToLogin();
    }
    setLoading(false);
  };

  const markAsRead = async (id) => {
    try {
      await base44.entities.Notification.update(id, { is_read: true });
      loadData();
    } catch (error) {
      toast.error('Erro ao marcar como lida');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
      loadData();
      toast.success('Todas marcadas como lidas!');
    } catch (error) {
      toast.error('Erro ao marcar notificações');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await base44.entities.Notification.delete(id);
      loadData();
      toast.success('Notificação removida');
    } catch (error) {
      toast.error('Erro ao remover notificação');
    }
  };

  const clearAllNotifications = async () => {
    for (const n of notifications) {
      try {
        await base44.entities.Notification.delete(n.id);
      } catch (e) {
        // ignora "not found" e continua
      }
    }
    setNotifications([]);
    toast.success('Todas as notificações foram removidas!');
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-[#F2F2F2] mb-2">Notificações</h1>
            <p className="text-[#F2F2F2]/60">
              {notifications.filter(n => !n.is_read).length} não lidas
            </p>
          </div>
          <div className="flex gap-2">
            {notifications.filter(n => !n.is_read).length > 0 && (
              <Button onClick={markAllAsRead} className="btn-gradient">
                <Check className="w-4 h-4 mr-2" />
                Marcar lidas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button onClick={clearAllNotifications} variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar tudo
              </Button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'unread', label: 'Não lidas' },
            { id: 'ride_status', label: 'Corridas' },
            { id: 'message', label: 'Mensagens' },
            { id: 'driver_verification', label: 'Verificação' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white'
                  : 'bg-[#F2F2F2]/5 text-[#F2F2F2]/60 hover:bg-[#F22998]/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-5 rounded-2xl transition-all ${
                    !notification.is_read
                      ? 'bg-[#F22998]/10 border-[#F22998]/30'
                      : 'bg-[#F2F2F2]/5 border-[#F22998]/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{notification.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-[#F2F2F2] mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-[#F2F2F2]/70 text-sm mb-2">
                            {notification.message}
                          </p>
                          <p className="text-[#F2F2F2]/40 text-xs">
                            {new Date(notification.created_date).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="text-green-400 hover:bg-green-500/10"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => deleteNotification(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Bell className="w-16 h-16 text-[#F22998]/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#F2F2F2] mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-[#F2F2F2]/50">
                Você está em dia com suas notificações!
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}