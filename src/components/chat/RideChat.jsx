import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Camera, Mic, Image, Plus, User } from 'lucide-react';
import { toBrasiliaTime } from '@/utils/dateUtils';

const ACTIVE_STATUSES = ['accepted', 'on_the_way', 'in_progress', 'assigned'];
const POLL_INTERVAL = 2500;

export default function RideChat({ rideId, currentUserId, otherUser, isOpen, onClose, rideStatus }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  const isActive = ACTIVE_STATUSES.includes(rideStatus);

  const fetchMessages = useCallback(async () => {
    if (!rideId) return;
    try {
      const res = await base44.functions.invoke('listRideMessages', { rideId, limit: 100 });
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (e) {
      console.error('[RideChat] Erro ao buscar mensagens:', e);
    }
  }, [rideId]);

  // Scroll automático para o fim
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling enquanto aberto e corrida ativa
  useEffect(() => {
    if (!isOpen || !isActive) {
      clearInterval(pollRef.current);
      if (!isActive && isOpen) onClose();
      return;
    }
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [isOpen, isActive, fetchMessages]);

  // Focar no input ao abrir
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // Adicionar otimisticamente
    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      text: trimmed,
      created_date: new Date().toISOString(),
      _temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    setText('');
    setSending(true);

    try {
      const res = await base44.functions.invoke('sendRideMessage', { rideId, text: trimmed });
      if (res.data?.message) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.data.message : m));
      }
      // Re-fetch imediatamente para garantir sincronização
      await fetchMessages();
    } catch (e) {
      console.error('[RideChat] Erro ao enviar:', e);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr) => {
    try {
      return toBrasiliaTime(dateStr);
    } catch { return ''; }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[99998] flex items-end justify-center sm:items-center"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 60 }}
          animate={{ y: 0 }}
          exit={{ y: 60 }}
          className="w-full max-w-md h-[85vh] sm:h-[600px] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
          style={{ background: '#111118' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#F22998] flex-shrink-0">
              {otherUser?.photo ? (
                <img src={otherUser.photo} alt={otherUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">{otherUser?.name || 'Usuária'}</p>
              <p className="text-xs text-green-400">● Online</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-[#F22998]/20 flex items-center justify-center mb-3">
                  <Send className="w-7 h-7 text-[#F22998]" />
                </div>
                <p className="text-white/50 text-sm">Nenhuma mensagem ainda.</p>
                <p className="text-white/30 text-xs mt-1">Diga olá para {otherUser?.name || 'a outra pessoa'}!</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isMine = msg.sender_id === currentUserId;
              const showTime = idx === 0 || formatTime(msg.created_date) !== formatTime(messages[idx - 1]?.created_date);

              return (
                <div key={msg.id}>
                  {showTime && (
                    <p className="text-center text-[10px] text-white/30 my-2">{formatTime(msg.created_date)}</p>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 text-sm text-white leading-relaxed ${
                        isMine
                          ? 'rounded-2xl rounded-br-sm'
                          : 'rounded-2xl rounded-bl-sm'
                      } ${msg._temp ? 'opacity-70' : ''}`}
                      style={{
                        background: isMine
                          ? 'linear-gradient(135deg, #BF3B79 0%, #F22998 100%)'
                          : '#3D1A4A',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/10 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div className="flex items-center gap-2">
              {/* Câmera */}
              <button className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border border-[#F22998]/40 text-[#F22998] hover:bg-[#F22998]/10 transition-colors">
                <Camera className="w-5 h-5" />
              </button>

              {/* Input de texto */}
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-white/8 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#F22998]/50 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />

              {/* Ícones extras (visuais) */}
              <button className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white/40">
                <Mic className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white/40">
                <Image className="w-5 h-5" />
              </button>

              {/* Botão enviar */}
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: text.trim()
                    ? 'linear-gradient(135deg, #BF3B79 0%, #F22998 100%)'
                    : 'rgba(255,255,255,0.1)',
                }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}