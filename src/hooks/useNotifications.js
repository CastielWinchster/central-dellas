import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Sons via Web Audio API (sem arquivos externos)
function createNotificationSound(type = 'default') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'ride') {
      oscillator.frequency.setValueAtTime(520, ctx.currentTime);
      oscillator.frequency.setValueAtTime(780, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } else if (type === 'message') {
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } else {
      oscillator.frequency.setValueAtTime(660, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // AudioContext não disponível — silencioso
  }
}

// Vibração via Vibration API
function vibrate(type = 'default') {
  if (!navigator.vibrate) return;
  if (type === 'ride')         navigator.vibrate([200, 100, 200, 100, 400]);
  else if (type === 'message') navigator.vibrate([100, 50, 100]);
  else                         navigator.vibrate([150, 100, 150]);
}

// Helper: converte chave VAPID base64 para Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// Inscrever usuário no Web Push e salvar subscription no backend
export async function subscribeToPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!VAPID_PUBLIC) {
      console.warn('[Push] VITE_VAPID_PUBLIC_KEY não configurada — push em segundo plano desativado');
      return;
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });

    // Enviar subscription ao backend via SDK
    await base44.functions.invoke('savePushToken', { subscription });
    console.log('[Push] Inscrito com sucesso');
  } catch (err) {
    console.warn('[Push] Falha na inscrição:', err.message);
  }
}

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [toastQueue, setToastQueue]       = useState([]);

  const pushToast = useCallback((notification) => {
    const toast = { ...notification, toastId: Date.now() };
    setToastQueue(q => [...q, toast]);
    setTimeout(() => {
      setToastQueue(q => q.filter(t => t.toastId !== toast.toastId));
    }, 5000);
  }, []);

  const handleNewNotification = useCallback((notification) => {
    const type = notification.type === 'ride' ? 'ride'
      : notification.type === 'message' ? 'message'
      : 'default';
    createNotificationSound(type);
    vibrate(type);
    pushToast(notification);

    if (Notification?.permission === 'granted') {
      new Notification('CentralDellas 🚗', {
        body: notification.message || notification.title,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.type === 'ride',
      });
    }
  }, [pushToast]);

  const loadNotifications = useCallback(async () => {
    if (!userId) return [];
    try {
      const data = await base44.entities.Notification.filter(
        { user_id: userId },
        '-created_date',
        30
      );
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
      return data;
    } catch (e) {
      console.error('[useNotifications]', e);
      return [];
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const seenIds = new Set();
    let initialized = false;

    // 1. Ativar subscribe IMEDIATAMENTE — antes do load inicial
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.user_id === userId) {
        const newNotif = event.data;
        if (!initialized || seenIds.has(newNotif.id)) return;
        seenIds.add(newNotif.id);
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        handleNewNotification(newNotif);
      }
    });

    // 2. Carregar histórico depois — marcar IDs já vistos
    loadNotifications().then((data) => {
      if (Array.isArray(data)) data.forEach(n => seenIds.add(n.id));
      initialized = true;
    });

    return unsub;
  }, [userId, loadNotifications, handleNewNotification]);

  const markAsRead = useCallback(async (notifId) => {
    await base44.entities.Notification.update(notifId, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [notifications]);

  const dismissToast = useCallback((toastId) => {
    setToastQueue(q => q.filter(t => t.toastId !== toastId));
  }, []);

  return { notifications, unreadCount, toastQueue, markAsRead, markAllAsRead, dismissToast, reload: loadNotifications };
}