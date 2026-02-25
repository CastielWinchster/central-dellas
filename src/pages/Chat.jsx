import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Send, Image as ImageIcon, Mic, 
  Flag, User, StopCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import moment from 'moment';

// Lista de termos ofensivos para moderação
const OFFENSIVE_TERMS = [
  'idiota', 'burra', 'estúpida', 'vadia', 'puta', 'caralho', 
  'merda', 'bosta', 'cu', 'fdp', 'filho da puta', 'desgraça',
  'lixo', 'nojenta', 'ridícula'
];

const moderateText = (text) => {
  if (!text) return { isOffensive: false, text };
  
  const lowerText = text.toLowerCase();
  const isOffensive = OFFENSIVE_TERMS.some(term => lowerText.includes(term));
  
  return {
    isOffensive,
    text: isOffensive ? 'Mensagem deletada por conteúdo ofensivo.' : text
  };
};

export default function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [scrollShift, setScrollShift] = useState(0);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const conversationId = new URLSearchParams(window.location.search).get('conversation');

  useEffect(() => {
    if (conversationId) {
      loadData();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Polling para novas mensagens
    const interval = setInterval(() => {
      if (conversationId) loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const convos = await base44.entities.Conversation.filter({ id: conversationId }, undefined, undefined, undefined, undefined, { data_env: "dev" });
      if (convos.length === 0) {
        toast.error('Conversa não encontrada');
        navigate(createPageUrl('PassengerMessages'));
        return;
      }

      const convo = convos[0];
      
      // Verificar se usuário faz parte da conversa
      if (convo.passenger_id !== userData.id && convo.driver_id !== userData.id) {
        toast.error('Sem permissão para acessar esta conversa');
        navigate(createPageUrl('PassengerMessages'));
        return;
      }

      setConversation(convo);

      // Buscar dados do outro participante
      const otherUserId = convo.passenger_id === userData.id 
        ? convo.driver_id 
        : convo.passenger_id;
      
      const users = await base44.entities.User.filter({ id: otherUserId }, undefined, undefined, undefined, undefined, { data_env: "dev" });
      setOtherUser(users[0]);

      await loadMessages();
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
      toast.error('Erro ao carregar conversa');
      navigate(createPageUrl('PassengerMessages'));
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      console.log('📥 [LOAD MESSAGES] Carregando mensagens...', { conversationId });
      const msgs = await base44.entities.Message.filter(
        { conversation_id: conversationId },
        'created_date',
        undefined, undefined, undefined, { data_env: "dev" }
      );
      
      console.log('✅ Mensagens carregadas:', msgs.length, 'mensagens');
      console.log('📋 Lista:', msgs.map(m => ({ id: m.id, type: m.type, text: m.text?.substring(0, 20) })));
      
      setMessages(msgs);

      // Marcar mensagens não lidas como lidas
      const unreadMessages = msgs.filter(
        m => !m.is_read && m.sender_id !== user?.id
      );
      
      if (unreadMessages.length > 0) {
        console.log('👁️ Marcando', unreadMessages.length, 'mensagens como lidas');
        for (const msg of unreadMessages) {
          await base44.entities.Message.update(msg.id, { is_read: true }, { data_env: "dev" });
        }
      }
    } catch (error) {
      console.error('❌ [LOAD MESSAGES] Erro:', error);
      console.error('Stack:', error.stack);
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const scrollTop = messagesContainerRef.current.scrollTop;
    const scrollHeight = messagesContainerRef.current.scrollHeight;
    const shift = (scrollTop / scrollHeight) * 30; // 0 a 30 graus de shift
    
    setScrollShift(shift);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    console.log('🚀 [SEND TEXT] Iniciando envio...');
    console.log('📝 Input:', { text: newMessage, conversationId, userId: user?.id });

    if (!newMessage.trim()) {
      console.log('⚠️ Mensagem vazia, cancelando');
      return;
    }

    if (sending) {
      console.log('⚠️ Já está enviando, cancelando');
      return;
    }

    if (conversation?.status === 'archived') {
      console.log('⚠️ Conversa arquivada, cancelando');
      return;
    }

    if (!conversationId || !user?.id) {
      console.error('❌ Faltam dados essenciais:', { conversationId, userId: user?.id });
      toast.error('Erro: dados da conversa não carregados');
      return;
    }

    setSending(true);
    try {
      const moderation = moderateText(newMessage);
      console.log('🔍 Moderação:', moderation);
      
      const messageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        type: 'text',
        text: moderation.text,
        status: moderation.isOffensive ? 'removed' : 'visible',
        is_read: false
      };
      
      if (conversation.ride_id) {
        messageData.ride_id = conversation.ride_id;
      }
      
      if (moderation.isOffensive) {
        messageData.removed_reason = 'offensive';
      }

      console.log('📤 Payload para criar mensagem:', messageData);
      const created = await base44.entities.Message.create(messageData, { data_env: "dev" });
      console.log('✅ Mensagem criada:', created);

      if (moderation.isOffensive) {
        toast.error('Sua mensagem contém conteúdo ofensivo e foi bloqueada');
      } else {
        toast.success('Mensagem enviada!');
      }

      setNewMessage('');
      console.log('🔄 Recarregando mensagens...');
      await loadMessages();
      scrollToBottom();
    } catch (error) {
      console.error('❌ [SEND TEXT] Erro completo:', error);
      console.error('Stack:', error.stack);
      toast.error(`Erro ao enviar: ${error.message}`);
    } finally {
      setSending(false);
      console.log('🏁 [SEND TEXT] Finalizado');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    console.log('🖼️ [SEND IMAGE] Iniciando upload...', { fileName: file?.name, fileSize: file?.size });

    if (!file) {
      console.log('⚠️ Nenhum arquivo selecionado');
      return;
    }

    if (conversation?.status === 'archived') {
      console.log('⚠️ Conversa arquivada, cancelando');
      toast.error('Não é possível enviar imagens em conversa arquivada');
      return;
    }

    setSending(true);
    try {
      console.log('📤 Fazendo upload da imagem...');
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      console.log('✅ Upload completo:', uploadResult);

      const messageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        type: 'image',
        file_url: uploadResult.file_url,
        status: 'visible',
        is_read: false
      };
      
      if (conversation.ride_id) {
        messageData.ride_id = conversation.ride_id;
      }

      console.log('📤 Criando mensagem de imagem:', messageData);
      const created = await base44.entities.Message.create(messageData, { data_env: "dev" });
      console.log('✅ Mensagem de imagem criada:', created);

      console.log('🔄 Recarregando mensagens...');
      await loadMessages();
      scrollToBottom();
      toast.success('Foto enviada!');
    } catch (error) {
      console.error('❌ [SEND IMAGE] Erro completo:', error);
      console.error('Stack:', error.stack);
      toast.error(`Erro ao enviar foto: ${error.message}`);
    } finally {
      setSending(false);
      console.log('🏁 [SEND IMAGE] Finalizado');
    }
  };

  const handleStartRecording = async () => {
    console.log('🎤 [RECORD AUDIO] Iniciando gravação...');

    if (conversation?.status === 'archived') {
      console.log('⚠️ Conversa arquivada, cancelando');
      toast.error('Não é possível gravar áudio em conversa arquivada');
      return;
    }

    try {
      console.log('🎙️ Solicitando acesso ao microfone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Acesso ao microfone concedido');

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('📊 Chunk de áudio recebido:', event.data.size, 'bytes');
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log('⏹️ Gravação parada, processando...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('🎵 Blob de áudio criado:', audioBlob.size, 'bytes');
        await handleSendAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      console.log('🔴 Gravação iniciada!');
      toast.success('Gravando áudio...');
    } catch (error) {
      console.error('❌ [RECORD AUDIO] Erro:', error);
      console.error('Stack:', error.stack);
      toast.error(`Erro ao acessar microfone: ${error.message}`);
    }
  };

  const handleStopRecording = () => {
    console.log('⏹️ [STOP RECORDING] Parando gravação...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      console.log('✅ Gravação parada');
    }
  };

  const handleSendAudio = async (audioBlob) => {
    console.log('🎵 [SEND AUDIO] Iniciando envio de áudio...', { size: audioBlob.size });

    if (conversation?.status === 'archived') {
      console.log('⚠️ Conversa arquivada, cancelando');
      return;
    }

    setSending(true);
    try {
      console.log('📦 Criando arquivo de áudio...');
      const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      console.log('📤 Fazendo upload do áudio...');
      
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      console.log('✅ Upload de áudio completo:', uploadResult);

      const messageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        type: 'audio',
        file_url: uploadResult.file_url,
        duration_sec: 0,
        status: 'visible',
        is_read: false
      };
      
      if (conversation.ride_id) {
        messageData.ride_id = conversation.ride_id;
      }

      console.log('📤 Criando mensagem de áudio:', messageData);
      const created = await base44.entities.Message.create(messageData, { data_env: "dev" });
      console.log('✅ Mensagem de áudio criada:', created);

      console.log('🔄 Recarregando mensagens...');
      await loadMessages();
      scrollToBottom();
      toast.success('Áudio enviado!');
    } catch (error) {
      console.error('❌ [SEND AUDIO] Erro completo:', error);
      console.error('Stack:', error.stack);
      toast.error(`Erro ao enviar áudio: ${error.message}`);
    } finally {
      setSending(false);
      console.log('🏁 [SEND AUDIO] Finalizado');
    }
  };

  const handleReportMessage = async (messageId) => {
    try {
      await base44.entities.Message.update(messageId, {
        status: 'removed',
        removed_reason: 'manual'
      }, { data_env: "dev" });
      
      await loadMessages();
      toast.success('Mensagem denunciada e removida');
    } catch (error) {
      console.error('Erro ao denunciar:', error);
      toast.error('Erro ao denunciar mensagem');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 flex flex-col"
      style={{
        background: `linear-gradient(135deg, 
          hsl(330, ${70 - scrollShift}%, ${5 + scrollShift * 0.3}%) 0%, 
          hsl(340, ${80 - scrollShift}%, ${8 + scrollShift * 0.2}%) 50%, 
          hsl(0, 0%, 5%) 100%)`
      }}
    >
      <style>{`
        .chat-bubble {
          transition: filter 0.1s ease;
        }
        
        .chat-bubble.mine {
          filter: hue-rotate(calc(var(--shift) * 1deg)) saturate(calc(1 + var(--shift) * 0.01));
        }
        
        .chat-bubble.theirs {
          filter: hue-rotate(calc(var(--shift) * -0.5deg));
        }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0 bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-[#F22998]/20 p-4">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('PassengerMessages')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>

          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#F22998]">
            {otherUser?.photo_url ? (
              <img src={otherUser.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="font-semibold text-[#F2F2F2]">{otherUser?.full_name || 'Usuária'}</h2>
            <p className="text-xs text-[#F2F2F2]/50">
              {conversation?.status === 'archived' ? 'Conversa arquivada' : 'Online'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{ '--shift': scrollShift }}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#F2F2F2]/40 text-sm">Nenhuma mensagem ainda</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          const isRemoved = msg.status === 'removed';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {msg.type === 'system' ? (
                  <div className="px-4 py-2 rounded-xl bg-[#F22998]/20 text-center">
                    <p className="text-sm text-[#F2F2F2]/80">{msg.text}</p>
                  </div>
                ) : (
                  <>
                    <div
                      className={`chat-bubble ${isMine ? 'mine' : 'theirs'} px-4 py-3 rounded-2xl ${
                        isMine 
                          ? 'bg-gradient-to-br from-[#BF3B79] to-[#F22998] text-white' 
                          : 'bg-[#1A1A1A]/80 backdrop-blur-sm text-[#F2F2F2]'
                      } ${isRemoved ? 'opacity-60' : ''}`}
                    >
                      {msg.type === 'text' && (
                        <p className="text-sm">{msg.text}</p>
                      )}
                      
                      {msg.type === 'image' && !isRemoved && (
                        <img 
                          src={msg.file_url} 
                          alt="Imagem" 
                          className="rounded-xl max-w-full"
                        />
                      )}
                      
                      {msg.type === 'audio' && !isRemoved && (
                        <audio src={msg.file_url} controls className="max-w-full" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xs text-[#F2F2F2]/40">
                        {moment(msg.created_date).format('HH:mm')}
                      </span>
                      
                      {!isMine && !isRemoved && msg.type !== 'system' && (
                        <button
                          onClick={() => handleReportMessage(msg.id)}
                          className="text-xs text-red-400/60 hover:text-red-400 flex items-center gap-1"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {conversation?.status !== 'archived' && (
        <div className="flex-shrink-0 bg-[#0D0D0D]/80 backdrop-blur-xl border-t border-[#F22998]/20 p-4">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={sending}
              />
              <div className="w-10 h-10 rounded-full bg-[#F22998]/20 hover:bg-[#F22998]/30 flex items-center justify-center transition-colors">
                <ImageIcon className="w-5 h-5 text-[#F22998]" />
              </div>
            </label>

            {isRecording ? (
              <button
                onClick={handleStopRecording}
                className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors animate-pulse"
              >
                <StopCircle className="w-5 h-5 text-red-500" />
              </button>
            ) : (
              <button
                onClick={handleStartRecording}
                disabled={sending}
                className="w-10 h-10 rounded-full bg-[#F22998]/20 hover:bg-[#F22998]/30 flex items-center justify-center transition-colors"
              >
                <Mic className="w-5 h-5 text-[#F22998]" />
              </button>
            )}

            {isRecording ? (
              <div className="flex-1 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-500 text-sm">Gravando áudio...</span>
              </div>
            ) : (
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                disabled={sending}
                className="flex-1 px-4 py-3 rounded-2xl bg-[#1A1A1A] border border-[#F22998]/20 text-[#F2F2F2] placeholder-[#F2F2F2]/40 focus:outline-none focus:border-[#F22998]/40"
              />
            )}

            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || isRecording}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] hover:opacity-80 flex items-center justify-center transition-opacity disabled:opacity-30"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}