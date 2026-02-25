import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Send, Image as ImageIcon, Mic, StopCircle,
  MoreVertical, AlertCircle, Loader2, ChevronDown, X, Play, Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

const DEV_ALLOWED_EMAILS = ['iurygdeoliveira@gmail.com', 'iurygdeoliveira2@gmail.com'];

export default function Chat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const conversationId = searchParams.get('id');

  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    lastAction: '',
    lastPayload: null,
    lastResponse: null,
    lastError: null,
    myUserId: '',
    conversationId: '',
    lastMessageTs: null,
    pollEnabled: false
  });

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lastMessageTs, setLastMessageTs] = useState(null);
  const [pollEnabled, setPollEnabled] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRefs = useRef({});

  // Scroll automático inteligente
  const scrollToBottom = (force = false) => {
    if (!messagesContainerRef.current || !messagesEndRef.current) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollButton(false);
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    setShowScrollButton(!isNearBottom);
  };

  // Debug helper
  const updateDebug = (action, payload, response, error) => {
    setDebugInfo(prev => ({
      ...prev,
      lastAction: action,
      lastPayload: payload,
      lastResponse: response,
      lastError: error,
      myUserId: user?.id || '',
      conversationId: conversationId || '',
      lastMessageTs,
      pollEnabled
    }));
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, [conversationId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      updateDebug('loadInitialData', { conversationId }, null, null);

      const me = await base44.auth.me();
      setUser(me);

      // Tentar client-side primeiro
      let conv = null;
      try {
        const convs = await base44.entities.Conversation.filter(
          { id: conversationId },
          undefined, undefined, undefined, undefined,
          { data_env: "dev" }
        );
        conv = convs?.[0];
      } catch (err) {
        console.log('Client read blocked, using backend');
      }

      if (!conv) {
        toast.error('Conversa não encontrada');
        navigate(createPageUrl('PassengerMessages'));
        return;
      }

      setConversation(conv);

      // Buscar outro participante
      const otherUserId = conv.passenger_id === me.id ? conv.driver_id : conv.passenger_id;
      const users = await base44.entities.User.filter(
        { id: otherUserId },
        undefined, undefined, undefined, undefined,
        { data_env: "dev" }
      );
      setOtherUser(users?.[0]);

      // Carregar mensagens
      await loadMessages();

      updateDebug('loadInitialData', { conversationId }, { conv, me }, null);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar conversa');
      updateDebug('loadInitialData', { conversationId }, null, error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      updateDebug('loadMessages', { conversationId }, null, null);

      // Tentar client-side primeiro
      let msgs = null;
      try {
        msgs = await base44.entities.Message.filter(
          { conversation_id: conversationId },
          'created_date',
          undefined, undefined, undefined,
          { data_env: "dev" }
        );
      } catch (err) {
        console.log('Client read blocked, using backend');
        // Fallback para backend
        const res = await base44.functions.invoke('chat_listMessages', {
          conversationId
        });
        msgs = res.data.messages;
      }

      setMessages(msgs || []);
      
      if (msgs && msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        setLastMessageTs(lastMsg.created_date);
      }

      // Marcar como lidas
      await markAsRead();

      updateDebug('loadMessages', { conversationId }, { count: msgs?.length }, null);
      
      setTimeout(() => scrollToBottom(true), 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      updateDebug('loadMessages', { conversationId }, null, error.message);
    }
  };

  const markAsRead = async () => {
    try {
      await base44.functions.invoke('chat_markRead', { conversationId });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Polling para "realtime"
  useEffect(() => {
    if (!conversationId || !user) return;

    setPollEnabled(true);
    
    const startPolling = () => {
      pollTimerRef.current = setInterval(async () => {
        if (document.hidden) return;
        await fetchNewMessages();
      }, 1200);
    };

    startPolling();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
        }
      } else {
        startPolling();
        fetchNewMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setPollEnabled(false);
    };
  }, [conversationId, user, lastMessageTs]);

  const fetchNewMessages = async () => {
    if (!lastMessageTs) return;

    try {
      const res = await base44.functions.invoke('chat_listMessages', {
        conversationId,
        afterTs: lastMessageTs
      });

      const newMsgs = res.data.messages || [];
      
      if (newMsgs.length > 0) {
        setMessages(prev => {
          const existing = new Set(prev.map(m => m.id));
          const unique = newMsgs.filter(m => !existing.has(m.id));
          return [...prev, ...unique];
        });

        const lastMsg = newMsgs[newMsgs.length - 1];
        setLastMessageTs(lastMsg.created_date);

        // Auto-scroll se estiver perto do fim
        setTimeout(() => scrollToBottom(false), 50);

        // Marcar como lidas
        await markAsRead();
      }
    } catch (error) {
      console.error('Error fetching new messages:', error);
    }
  };

  // Enviar mensagem de texto
  const handleSendText = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      type: 'text',
      text,
      status: 'sending',
      created_date: new Date().toISOString(),
      is_read: false
    };

    // Optimistic UI
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      updateDebug('sendText', { text }, null, null);

      // Tentar client-side primeiro
      let message = null;
      try {
        const messageData = {
          conversation_id: conversationId,
          sender_id: user.id,
          type: 'text',
          text,
          status: 'visible',
          is_read: false
        };
        
        if (conversation.ride_id) {
          messageData.ride_id = conversation.ride_id;
        }

        message = await base44.entities.Message.create(
          messageData,
          { data_env: "dev" }
        );
      } catch (err) {
        console.log('Client create blocked, using backend');
        // Fallback para backend
        const res = await base44.functions.invoke('chat_sendMessage', {
          conversationId,
          type: 'text',
          text
        });
        message = res.data.message;
      }

      // Substituir temp pela mensagem real
      setMessages(prev => prev.map(m => m.id === tempId ? message : m));
      setLastMessageTs(message.created_date);

      updateDebug('sendText', { text }, message, null);
      setTimeout(() => scrollToBottom(true), 50);
    } catch (error) {
      console.error('Error sending text:', error);
      toast.error('Erro ao enviar mensagem');
      
      // Marcar como failed
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'failed' } : m
      ));

      updateDebug('sendText', { text }, null, error.message);
    } finally {
      setSending(false);
    }
  };

  // Enviar imagem
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      type: 'image',
      file_url: URL.createObjectURL(file),
      status: 'sending',
      created_date: new Date().toISOString(),
      is_read: false
    };

    // Optimistic UI
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      updateDebug('sendImage', { fileName: file.name }, null, null);

      // Upload
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Enviar mensagem
      let message = null;
      try {
        const messageData = {
          conversation_id: conversationId,
          sender_id: user.id,
          type: 'image',
          file_url,
          status: 'visible',
          is_read: false
        };
        
        if (conversation.ride_id) {
          messageData.ride_id = conversation.ride_id;
        }

        message = await base44.entities.Message.create(
          messageData,
          { data_env: "dev" }
        );
      } catch (err) {
        console.log('Client create blocked, using backend');
        const res = await base44.functions.invoke('chat_sendMessage', {
          conversationId,
          type: 'image',
          fileUrl: file_url
        });
        message = res.data.message;
      }

      // Substituir temp pela mensagem real
      setMessages(prev => prev.map(m => m.id === tempId ? message : m));
      setLastMessageTs(message.created_date);

      toast.success('Imagem enviada!');
      updateDebug('sendImage', { fileName: file.name }, message, null);
      setTimeout(() => scrollToBottom(true), 50);
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error('Erro ao enviar imagem');
      
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'failed' } : m
      ));

      updateDebug('sendImage', { fileName: file.name }, null, error.message);
    } finally {
      setSending(false);
    }
  };

  // Gravação de áudio
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = handleAudioReady;

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Timer de duração
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast.success('Gravando áudio...');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Erro ao acessar microfone');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const handleAudioReady = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const duration = recordingDuration;

    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      type: 'audio',
      file_url: URL.createObjectURL(audioBlob),
      duration_sec: duration,
      status: 'sending',
      created_date: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      updateDebug('sendAudio', { duration }, null, null);

      // Upload
      const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Enviar mensagem
      let message = null;
      try {
        const messageData = {
          conversation_id: conversationId,
          sender_id: user.id,
          type: 'audio',
          file_url,
          duration_sec: duration,
          status: 'visible',
          is_read: false
        };
        
        if (conversation.ride_id) {
          messageData.ride_id = conversation.ride_id;
        }

        message = await base44.entities.Message.create(
          messageData,
          { data_env: "dev" }
        );
      } catch (err) {
        console.log('Client create blocked, using backend');
        const res = await base44.functions.invoke('chat_sendMessage', {
          conversationId,
          type: 'audio',
          fileUrl: file_url,
          durationSec: duration
        });
        message = res.data.message;
      }

      setMessages(prev => prev.map(m => m.id === tempId ? message : m));
      setLastMessageTs(message.created_date);

      toast.success('Áudio enviado!');
      updateDebug('sendAudio', { duration }, message, null);
      setTimeout(() => scrollToBottom(true), 50);
    } catch (error) {
      console.error('Error sending audio:', error);
      toast.error('Erro ao enviar áudio');
      
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'failed' } : m
      ));

      updateDebug('sendAudio', { duration }, null, error.message);
    } finally {
      setSending(false);
    }
  };

  // Reproduzir áudio
  const handlePlayAudio = (messageId) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;

    if (playingAudio === messageId) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      // Pausar qualquer outro áudio tocando
      Object.values(audioRefs.current).forEach(a => a.pause());
      audio.play();
      setPlayingAudio(messageId);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F22998] animate-spin" />
      </div>
    );
  }

  const isDev = user && DEV_ALLOWED_EMAILS.includes(user.email);

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-[#F22998]/20 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(createPageUrl('PassengerMessages'))}
          className="p-2 hover:bg-[#F22998]/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#F2F2F2]" />
        </button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#BF3B79] to-[#F22998]">
            {otherUser?.photo_url ? (
              <img src={otherUser.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {otherUser?.full_name?.[0] || '?'}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-[#F2F2F2] font-semibold">{otherUser?.full_name || 'Usuário'}</h2>
            <p className="text-[#F2F2F2]/50 text-xs">
              {pollEnabled ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {isDev && (
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="p-2 hover:bg-[#F22998]/10 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-[#F2F2F2]" />
          </button>
        )}
      </div>

      {/* Debug Panel */}
      <AnimatePresence>
        {showDebug && isDev && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#1A1A1A] border-b border-[#F22998]/20 overflow-hidden"
          >
            <div className="p-4 text-xs text-[#F2F2F2]/70 space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#F22998] font-bold">DEBUG PANEL</span>
                <button onClick={() => setShowDebug(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div><strong>User ID:</strong> {debugInfo.myUserId}</div>
              <div><strong>Conversation ID:</strong> {debugInfo.conversationId}</div>
              <div><strong>Last Message TS:</strong> {debugInfo.lastMessageTs || 'none'}</div>
              <div><strong>Poll Enabled:</strong> {debugInfo.pollEnabled ? '✅' : '❌'}</div>
              <div><strong>Last Action:</strong> {debugInfo.lastAction || 'none'}</div>
              {debugInfo.lastPayload && (
                <div>
                  <strong>Payload:</strong>
                  <pre className="bg-[#0D0D0D] p-2 rounded mt-1 text-[10px] overflow-auto">
                    {JSON.stringify(debugInfo.lastPayload, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.lastResponse && (
                <div>
                  <strong>Response:</strong>
                  <pre className="bg-[#0D0D0D] p-2 rounded mt-1 text-[10px] overflow-auto">
                    {JSON.stringify(debugInfo.lastResponse, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.lastError && (
                <div>
                  <strong className="text-red-500">Error:</strong>
                  <pre className="bg-red-500/10 p-2 rounded mt-1 text-[10px] overflow-auto text-red-400">
                    {debugInfo.lastError}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#F2F2F2]/50">
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Envie uma mensagem para começar</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            const isFailed = msg.status === 'failed';
            const isSending = msg.status === 'sending';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-gradient-to-br from-[#BF3B79] to-[#F22998] text-white'
                        : 'bg-[#1A1A1A] text-[#F2F2F2]'
                    } ${isFailed ? 'opacity-50' : ''} ${isSending ? 'opacity-70' : ''}`}
                  >
                    {msg.type === 'text' && <p className="break-words">{msg.text}</p>}
                    
                    {msg.type === 'image' && (
                      <img 
                        src={msg.file_url} 
                        alt="Imagem" 
                        className="rounded-lg max-w-full"
                      />
                    )}
                    
                    {msg.type === 'audio' && (
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <button
                          onClick={() => handlePlayAudio(msg.id)}
                          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        >
                          {playingAudio === msg.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>
                        <span className="text-sm">{formatTime(msg.duration_sec || 0)}</span>
                        <audio
                          ref={(el) => {
                            if (el) audioRefs.current[msg.id] = el;
                          }}
                          src={msg.file_url}
                          onEnded={() => setPlayingAudio(null)}
                          className="hidden"
                        />
                      </div>
                    )}

                    {isSending && (
                      <div className="flex items-center gap-2 mt-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-xs opacity-70">Enviando...</span>
                      </div>
                    )}

                    {isFailed && (
                      <div className="flex items-center gap-2 mt-1 text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-xs">Falha ao enviar</span>
                      </div>
                    )}
                  </div>
                  
                  <span className="text-[10px] text-[#F2F2F2]/40 px-2">
                    {new Date(msg.created_date).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-24 right-6 w-10 h-10 rounded-full bg-[#F22998] shadow-lg flex items-center justify-center z-20"
          >
            <ChevronDown className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <form onSubmit={handleSendText} className="bg-[#1A1A1A] border-t border-[#F22998]/20 p-4">
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="w-10 h-10 rounded-full bg-[#F22998]/20 hover:bg-[#F22998]/30 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-5 h-5 text-[#F22998]" />
          </button>

          {isRecording ? (
            <button
              type="button"
              onClick={handleStopRecording}
              className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors animate-pulse"
            >
              <StopCircle className="w-5 h-5 text-red-500" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={sending}
              className="w-10 h-10 rounded-full bg-[#F22998]/20 hover:bg-[#F22998]/30 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Mic className="w-5 h-5 text-[#F22998]" />
            </button>
          )}

          {isRecording ? (
            <div className="flex-1 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 text-sm">Gravando: {formatTime(recordingDuration)}</span>
            </div>
          ) : (
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="flex-1 px-4 py-3 rounded-2xl bg-[#0D0D0D] border border-[#F22998]/20 text-[#F2F2F2] placeholder-[#F2F2F2]/40 focus:outline-none focus:border-[#F22998]/40 disabled:opacity-50"
            />
          )}

          <button
            type="submit"
            disabled={sending || !newMessage.trim() || isRecording}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] hover:shadow-lg hover:shadow-[#F22998]/50 flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:shadow-none"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}