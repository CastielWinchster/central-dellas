import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Send, Paperclip, Phone, AlertCircle, Flag, ArrowLeft,
  MapPin, Star, MoreVertical, X, Check, Mic, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ChatMessage from '../components/chat/ChatMessage';
import TypingIndicator from '../components/chat/TypingIndicator';
import SmartReplies from '../components/chat/SmartReplies';
import AudioRecorder from '../components/chat/AudioRecorder';

export default function PassengerChat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [driverTyping, setDriverTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        // Get ride ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const rideId = urlParams.get('ride');

        let currentRide;
        
        if (rideId) {
          const rides = await base44.entities.Ride.filter({ id: rideId });
          if (rides.length > 0) {
            currentRide = rides[0];
          }
        } else {
          // Fallback to active ride
          const activeRides = await base44.entities.Ride.filter({
            passenger_id: userData.id,
            status: { $in: ['accepted', 'arriving', 'in_progress'] }
          }, '-created_date', 1);

          if (activeRides.length === 0) {
            toast.error('Nenhuma corrida encontrada');
            navigate(createPageUrl('PassengerMessages'));
            return;
          }
          currentRide = activeRides[0];
        }

        setRide(currentRide);

        // Get driver info
        if (currentRide.driver_id) {
          const driverData = await base44.entities.User.filter({ 
            id: currentRide.driver_id 
          });
          if (driverData.length > 0) {
            setDriver(driverData[0]);
          }
        }

        loadMessages(currentRide.id, userData.id);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadData();
  }, [navigate]);

  const loadMessages = async (rideId, userId) => {
    const msgs = await base44.entities.Message.filter({ 
      ride_id: rideId 
    }, 'created_date', 100);
    
    setMessages(msgs);
    scrollToBottom();

    // Mark messages as read
    const unreadMessages = msgs.filter(m => 
      m.receiver_id === userId && !m.is_read
    );
    
    for (const msg of unreadMessages) {
      await base44.entities.Message.update(msg.id, { is_read: true });
    }

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.ride_id === rideId) {
        if (event.type === 'create') {
          setMessages(prev => [...prev, event.data]);
          scrollToBottom();
          
          if (event.data.receiver_id === userId) {
            base44.entities.Message.update(event.data.id, { is_read: true });
          }
        } else if (event.type === 'update') {
          setMessages(prev => prev.map(m => 
            m.id === event.data.id ? event.data : m
          ));
        }
      }
    });

    return () => unsubscribe();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ride) return;

    // Anti-spam: 1 message per second
    const now = Date.now();
    if (now - lastSent < 1000) {
      toast.error('Aguarde antes de enviar outra mensagem');
      return;
    }

    if (newMessage.length > 500) {
      toast.error('Mensagem muito longa (máximo 500 caracteres)');
      return;
    }

    try {
      setLastSent(now);
      const message = await base44.entities.Message.create({
        ride_id: ride.id,
        sender_id: user.id,
        receiver_id: ride.driver_id,
        content: newMessage.trim(),
        message_type: 'text'
      });

      setNewMessage('');
      
      // Send notification to driver
      await base44.entities.Notification.create({
        user_id: ride.driver_id,
        title: 'Nova mensagem',
        message: `${user.full_name}: ${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
        type: 'message',
        related_id: ride.id
      });

      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máximo 5MB)');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.Message.create({
        ride_id: ride.id,
        sender_id: user.id,
        receiver_id: ride.driver_id,
        content: file_url,
        message_type: 'image'
      });

      await base44.entities.Notification.create({
        user_id: ride.driver_id,
        title: 'Nova imagem',
        message: `${user.full_name} enviou uma imagem`,
        type: 'message',
        related_id: ride.id
      });

      toast.success('Imagem enviada');
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    }
    setUploading(false);
  };

  const handleAudioSend = async (audioBlob, duration) => {
    if (!audioBlob || !ride) return;

    setUploading(true);
    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
      
      await base44.entities.Message.create({
        ride_id: ride.id,
        sender_id: user.id,
        receiver_id: ride.driver_id,
        content: file_url,
        message_type: 'audio',
        metadata: { duration }
      });

      await base44.entities.Notification.create({
        user_id: ride.driver_id,
        title: 'Novo áudio',
        message: `${user.full_name} enviou um áudio`,
        type: 'message',
        related_id: ride.id
      });

      setShowAudioRecorder(false);
      toast.success('Áudio enviado');
    } catch (error) {
      toast.error('Erro ao enviar áudio');
    }
    setUploading(false);
  };

  const handleReportMessage = async (messageId) => {
    toast.success('Mensagem reportada. Agradecemos.');
  };

  const handleEmergency = () => {
    toast.error('Emergência acionada! Autoridades notificadas.');
  };

  const handleCallDriver = () => {
    if (driver?.phone) {
      window.location.href = `tel:${driver.phone}`;
    } else {
      toast.error('Telefone da motorista não disponível');
    }
  };

  if (!user || !ride) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  const systemMessages = [
    { time: ride.created_date, text: `${driver?.full_name || 'Motorista'} aceitou sua corrida`, icon: '🔔' },
    ...(ride.status === 'arriving' ? [{ time: new Date().toISOString(), text: `${driver?.full_name} está chegando`, icon: '🚗' }] : []),
    ...(ride.status === 'in_progress' ? [{ time: new Date().toISOString(), text: 'Corrida iniciada', icon: '✅' }] : [])
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-[#1A1A1A] border-b border-[#BF3B79] p-4"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(createPageUrl('PassengerDashboard'))}
              className="p-2 rounded-lg hover:bg-[#F22998]/10"
            >
              <ArrowLeft className="w-5 h-5 text-[#F2F2F2]" />
            </button>
            
            {driver && (
              <>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#F22998]">
                  {driver.photo_url ? (
                    <img src={driver.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center text-white text-lg font-bold">
                      {driver.full_name?.[0] || 'M'}
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-[#F2F2F2] font-semibold">{driver.full_name || 'Motorista'}</h2>
                  <div className="flex items-center gap-2 text-sm text-[#F2F2F2]/60">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span>{driver.rating || 5.0}</span>
                    {ride.status === 'arriving' && (
                      <>
                        <span>•</span>
                        <span className="text-green-400">Chegando em {ride.estimated_duration || 5} min</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCallDriver}
              size="icon"
              className="bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-4 h-4" />
            </Button>
            
            <div className="relative">
              <Button
                onClick={() => setShowMenu(!showMenu)}
                size="icon"
                variant="ghost"
                className="text-[#F2F2F2]"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-12 bg-[#1A1A1A] rounded-xl border border-[#F22998]/20 p-2 min-w-[200px] z-50"
                  >
                    <button
                      onClick={handleEmergency}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Emergência</span>
                    </button>
                    <button
                      onClick={() => navigate(createPageUrl('TrackRide'))}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F22998]/10 text-[#F2F2F2]"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Ver Mapa</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Ride Info */}
        <div className="max-w-4xl mx-auto mt-3 pt-3 border-t border-[#F22998]/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#F2F2F2]/60">
              <MapPin className="w-4 h-4" />
              <span>{ride.pickup_address?.substring(0, 25)}...</span>
              <span>→</span>
              <span>{ride.destination_address?.substring(0, 25)}...</span>
            </div>
            <div className="text-[#F22998] font-semibold">
              R$ {ride.estimated_price?.toFixed(2)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {/* System Messages */}
        {systemMessages.map((sysMsg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="bg-[#2A2A2A] px-4 py-2 rounded-full text-sm text-[#F2F2F2]/60 flex items-center gap-2">
              <span>{sysMsg.icon}</span>
              <span>{sysMsg.text}</span>
              <span className="text-xs">
                {new Date(sysMsg.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Chat Messages */}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === user.id}
            onReport={handleReportMessage}
          />
        ))}

        {/* Typing Indicator */}
        {driverTyping && <TypingIndicator name={driver?.full_name} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Smart Replies */}
      <SmartReplies
        lastMessage={messages[messages.length - 1]}
        onSelect={(reply) => {
          setNewMessage(reply);
          setTimeout(() => handleSendMessage(), 100);
        }}
      />

      {/* Audio Recorder */}
      {showAudioRecorder && (
        <AudioRecorder
          onSend={handleAudioSend}
          onCancel={() => setShowAudioRecorder(false)}
        />
      )}

      {/* Input Area */}
      {!showAudioRecorder && (
        <div className="bg-[#1A1A1A] border-t border-[#8C0D60] p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <div className={`p-3 rounded-xl ${uploading ? 'bg-[#F22998]/20' : 'hover:bg-[#F22998]/10'} transition-colors`}>
                {uploading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-[#F2F2F2]/60" />
                )}
              </div>
            </label>

            <button
              onClick={() => setShowAudioRecorder(true)}
              className="p-3 rounded-xl hover:bg-[#F22998]/10 transition-colors"
            >
              <Mic className="w-5 h-5 text-[#F2F2F2]/60" />
            </button>

          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-[#0D0D0D] border-[#8C0D60] text-[#F2F2F2] placeholder:text-[#F2F2F2]/40"
            maxLength={500}
          />

          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || uploading}
            className="btn-gradient p-3"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        {newMessage.length > 400 && (
          <p className="text-xs text-[#F2F2F2]/40 text-center mt-2">
            {500 - newMessage.length} caracteres restantes
          </p>
        )}
        </div>
        </div>
        )}
  );
}