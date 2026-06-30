import React, { useState, useEffect, useRef } from 'react';
import { Bell, Car, MessageCircle, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useNotifications } from '@/hooks/useNotifications';
import { toBrasiliaTime } from '@/utils/dateUtils';

const TYPE_ICON = {
  ride:    <Car size={16} className="text-[#F22998]" />,
  message: <MessageCircle size={16} className="text-blue-400" />,
  coupon:  <span className="text-sm">🎟️</span>,
  event:   <span className="text-sm">📅</span>,
  system:  <span className="text-sm">⚙️</span>,
  default: <Bell size={16} className="text-[#F2F2F2]/60" />,
};

export default function NotificationBell({
  userId,
  // Props opcionais — se fornecidos externamente (ex: via Layout), usa-os
  notifications: extNotifications,
  unreadCount: extUnreadCount,
  markAsRead: extMarkAsRead,
  markAllAsRead: extMarkAllAsRead,
}) {
  const [open, setOpen] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const [cleared, setCleared] = useState(false);
  const prevCountRef = useRef(0);

  // Se props externas não fornecidas, usa hook interno
  const internal = useNotifications(extNotifications !== undefined ? null : userId);

  const notifications  = cleared ? [] : (extNotifications  ?? internal.notifications);
  const unreadCount    = cleared ? 0  : (extUnreadCount    ?? internal.unreadCount);
  const markAsRead     = extMarkAsRead     ?? internal.markAsRead;
  const markAllAsRead  = extMarkAllAsRead  ?? internal.markAllAsRead;

  // Resetar "cleared" quando chegarem novas notificações
  useEffect(() => {
    if (cleared && (extNotifications?.length > 0 || internal.notifications.length > 0)) {
      // Não resetar — manter limpo até reload real
    }
  }, [extNotifications, internal.notifications]);

  const clearAll = async () => {
    const list = extNotifications ?? internal.notifications;
    for (const n of list) {
      try {
        await base44.entities.Notification.delete(n.id);
      } catch (e) {
        // ignora "not found" e continua
      }
    }
    setCleared(true);
    if (internal.setNotifications) internal.setNotifications([]);
  };

  // Animação do badge ao receber nova notificação
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setBadgePop(true);
      setTimeout(() => setBadgePop(false), 400);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  const handleOpen = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-[#F22998]/10 transition-colors">
          <Bell className="w-6 h-6 text-[#F2F2F2]" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute -top-1 -right-1 w-5 h-5 bg-[#F22998] text-white text-xs rounded-full flex items-center justify-center font-bold ${badgePop ? 'badge-pop' : ''}`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
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
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="ghost"
                size="sm"
                className="text-[#F22998] hover:bg-[#F22998]/10 text-xs"
              >
                Marcar lidas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                onClick={clearAll}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:bg-red-500/10 text-xs"
                title="Limpar todas"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[400px]">
          {notifications.length > 0 ? (
            <AnimatePresence>
              {notifications.map((notification) => {
                const icon = TYPE_ICON[notification.type] || TYPE_ICON.default;
                return (
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
                      {/* Ponto rosa para não lidas */}
                      <div className="flex-shrink-0 mt-1">
                        {!notification.is_read
                          ? <div className="w-2 h-2 rounded-full bg-[#F22998]" />
                          : <div className="w-2 h-2" />
                        }
                      </div>
                      <div className="flex-shrink-0 mt-0.5">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#F2F2F2] text-sm truncate">
                          {notification.title}
                        </p>
                        <p className="text-[#F2F2F2]/70 text-xs mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[#F2F2F2]/40 text-xs mt-1">
                          {toBrasiliaTime(notification.created_date)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
            <Link to={createPageUrl('Notifications')}>
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