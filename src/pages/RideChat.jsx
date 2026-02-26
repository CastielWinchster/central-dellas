import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthUser } from '@/components/AuthGuard';
import { base44 } from '@/api/base44Client';
import { useRideChat } from '@/components/chat/useRideChat';
import RideChatMessage from '@/components/chat/RideChatMessage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function RideChat() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const [inputText, setInputText] = useState('');
  const [ride, setRide] = useState(null);
  const [loadingRide, setLoadingRide] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Obter dados da corrida
  useEffect(() => {
    const fetchRide = async () => {
      try {
        setLoadingRide(true);
        const rides = await base44.entities.Ride.filter({ id: rideId });
        if (rides.length > 0) {
          setRide(rides[0]);
        } else {
          toast.error('Corrida não encontrada');
          navigate(-1);
        }
      } catch (error) {
        console.error('Erro ao carregar corrida:', error);
        toast.error('Erro ao carregar corrida');
        navigate(-1);
      } finally {
        setLoadingRide(false);
      }
    };

    if (rideId) {
      fetchRide();
    }
  }, [rideId, navigate]);

  // Determinar se chat está disponível baseado no status da corrida
  const isChatAvailable = ride && ['accepted', 'arrived', 'in_progress', 'completed'].includes(ride.status);

  // Hook do chat
  const { messages, loading, sending, error, send } = useRideChat(
    rideId,
    user?.id,
    ride?.assigned_driver_id,
    ride?.passenger_id
  );

  // Determinar quem é o outro usuário
  const otherUserId = user?.id === ride?.assigned_driver_id ? ride?.passenger_id : ride?.assigned_driver_id;
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!otherUserId) return;
      try {
        const users = await base44.entities.User.filter({ id: otherUserId });
        if (users.length > 0) {
          setOtherUser(users[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    };

    fetchOtherUser();
  }, [otherUserId]);

  // Auto scroll ao final quando novas mensagens chegam
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  // Detectar se usuário está no final da lista
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  // Enviar mensagem
  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    try {
      await send(inputText);
      setInputText('');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  // Enter para enviar
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDark = user?.theme !== 'light';

  if (loadingRide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0D0D0D]">
        <Loader2 className="w-8 h-8 animate-spin text-[#F22998]" />
      </div>
    );
  }

  if (!isChatAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0D0D0D] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chat indisponível</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            O chat está disponível apenas para corridas aceitas ou em andamento.
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (error && error.includes('permissão')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0D0D0D] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso negado</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-screen flex flex-col', isDark ? 'bg-[#0D0D0D]' : 'bg-gray-50')}>
      {/* Header */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-b shadow-sm',
        isDark ? 'bg-[#1a1a1a] border-[#F22998]/20' : 'bg-white border-gray-200'
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="hover:bg-[#F22998]/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3 flex-1">
          {otherUser?.photo_url ? (
            <img
              src={otherUser.photo_url}
              alt={otherUser.full_name}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#F22998]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center text-white font-semibold">
              {otherUser?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-semibold">{otherUser?.full_name || 'Carregando...'}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Corrida #{rideId.slice(-6)} • {ride.status === 'accepted' ? 'Aceita' : ride.status === 'in_progress' ? 'Em andamento' : 'Finalizada'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#F22998]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma mensagem ainda</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Envie uma mensagem para começar a conversa
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <RideChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={cn(
        'p-4 border-t',
        isDark ? 'bg-[#1a1a1a] border-[#F22998]/20' : 'bg-white border-gray-200'
      )}>
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            maxLength={500}
            disabled={sending}
            className={cn(
              'flex-1',
              isDark ? 'bg-[#0D0D0D] border-[#F22998]/30' : 'bg-gray-50'
            )}
          />
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="bg-gradient-to-r from-[#BF3B79] to-[#F22998] hover:opacity-90"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
          Mensagens expiram em 24 horas
        </p>
      </div>
    </div>
  );
}