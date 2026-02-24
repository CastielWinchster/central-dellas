import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    loadNotifications();

    // Subscribe to new notifications
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data.user_id === userId) {
        loadNotifications();
      }
    });

    return unsubscribe;
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const userNotifications = await base44.entities.Notification.filter(
        { user_id: userId },
        '-created_date',
        10
      );
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, { is_read: true });
      loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-[#F22998]/10 transition-colors">
          <Bell className="w-6 h-6 text-[#F2F2F2]" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-[#F22998] text-white text-xs rounded-full flex items-center justify-center font-bold"
            >
              {unreadCount}
            </motion.span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-96 bg-[#0D0D0D] border-[#F22998]/30 p-0 max-h-[500px] overflow-hidden"
      >
        <div className="p-4 border-b border-[#F22998]/20 flex items-center justify-between">
          <h3 className="font-semibold text-[#F2F2F2]">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="ghost"
              size="sm"
              className="text-[#F22998] hover:bg-[#F22998]/10 text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <div className="overflow-y-auto max-h-[400px]">
          {notifications.length > 0 ? (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => {
                    markAsRead(notification.id);
                    setOpen(false);
                  }}
                  className={`p-4 border-b border-[#F22998]/10 cursor-pointer transition-colors hover:bg-[#F22998]/5 ${
                    !notification.is_read ? 'bg-[#F22998]/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{notification.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-[#F2F2F2] text-sm">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-[#F22998] mt-1" />
                        )}
                      </div>
                      <p className="text-[#F2F2F2]/70 text-xs mb-2">
                        {notification.message}
                      </p>
                      <p className="text-[#F2F2F2]/40 text-xs">
                        {new Date(notification.created_date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-[#F22998]/30 mx-auto mb-3" />
              <p className="text-[#F2F2F2]/50 text-sm">Nenhuma notificação</p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-t border-[#F22998]/20">
            <Link to={createPageUrl('PassengerNotifications')}>
              <Button
                variant="ghost"
                className="w-full text-[#F22998] hover:bg-[#F22998]/10"
                onClick={() => setOpen(false)}
              >
                Ver todas as notificações
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}