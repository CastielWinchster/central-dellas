import { useState, useEffect } from 'react';
import { ensureChatExists, sendMessage, subscribeToMessages, getChatInfo } from '../firebase/rideChatService';

/**
 * Hook customizado para gerenciar chat de corrida
 * @param {string} rideId - ID da corrida
 * @param {string} currentUserId - UID do usuário atual
 * @param {string} driverUid - UID do motorista
 * @param {string} passengerUid - UID do passageiro
 */
export function useRideChat(rideId, currentUserId, driverUid, passengerUid) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatInfo, setChatInfo] = useState(null);

  // Inicializar e escutar mensagens
  useEffect(() => {
    if (!rideId || !currentUserId || !driverUid || !passengerUid) {
      setLoading(false);
      return;
    }

    let unsubscribe = null;

    const initChat = async () => {
      try {
        setLoading(true);
        setError(null);

        // Garantir que o chat existe
        await ensureChatExists(rideId, driverUid, passengerUid);

        // Obter informações do chat
        const info = await getChatInfo(rideId);
        setChatInfo(info);

        // Verificar se usuário é participante
        if (!info.participants.includes(currentUserId)) {
          throw new Error('Você não tem permissão para acessar este chat');
        }

        // Inscrever-se para receber mensagens
        unsubscribe = subscribeToMessages(rideId, (msgs) => {
          setMessages(msgs);
          setLoading(false);
        });
      } catch (err) {
        console.error('Erro ao inicializar chat:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [rideId, currentUserId, driverUid, passengerUid]);

  // Enviar mensagem
  const send = async (text) => {
    if (!text || text.trim().length === 0) {
      return;
    }

    try {
      setSending(true);
      await sendMessage(rideId, currentUserId, text);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err.message);
      throw err;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    error,
    chatInfo,
    send
  };
}