import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook para gerenciar chat de corrida via Base44 nativo
 */
export function useRideChat(rideId, currentUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!rideId || !currentUserId) {
      setLoading(false);
      return;
    }

    // Carregar mensagens iniciais
    base44.functions.invoke('listRideMessages', { rideId })
      .then(res => { setMessages(res.data?.messages || []); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    // Subscription em tempo real
    const unsubscribe = base44.entities.RideMessage.subscribe((event) => {
      if (event.data?.ride_id !== rideId) return;
      if (event.type === 'create') {
        setMessages(prev => [...prev, event.data]);
      }
    });

    return () => unsubscribe();
  }, [rideId, currentUserId]);

  const send = async (text) => {
    if (!text?.trim()) return;
    setSending(true);
    try {
      await base44.functions.invoke('sendRideMessage', { rideId, text });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, error, send };
}