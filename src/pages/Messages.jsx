import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Send, ChevronLeft, Phone, 
  MoreVertical, Image, Smile, MapPin, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Messages() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();

    // Mock conversations
    setConversations([
      {
        id: '1',
        partner: {
          name: 'Maria Silva',
          photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
          status: 'online'
        },
        lastMessage: 'Estou chegando em 2 minutos!',
        lastMessageTime: new Date(Date.now() - 300000).toISOString(),
        unread: 2,
        rideId: '1'
      },
      {
        id: '2',
        partner: {
          name: 'Ana Costa',
          photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
          status: 'offline'
        },
        lastMessage: 'Obrigada pela corrida! 💕',
        lastMessageTime: new Date(Date.now() - 86400000).toISOString(),
        unread: 0,
        rideId: '2'
      }
    ]);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      // Mock messages for selected conversation
      setMessages([
        {
          id: '1',
          sender: 'driver',
          content: 'Olá! Estou a caminho do seu local de embarque.',
          timestamp: new Date(Date.now() - 600000).toISOString()
        },
        {
          id: '2',
          sender: 'user',
          content: 'Perfeito! Estou no portão azul.',
          timestamp: new Date(Date.now() - 540000).toISOString()
        },
        {
          id: '3',
          sender: 'driver',
          content: 'Estou chegando em 2 minutos!',
          timestamp: new Date(Date.now() - 300000).toISOString()
        }
      ]);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const quickReplies = [
    'Estou chegando!',
    'Pode esperar um momento?',
    'Estou no local',
    'Obrigada! 💕'
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!selectedConversation ? (
            // Conversations List
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#F2F2F2] mb-2">Mensagens</h1>
                <p className="text-[#F2F2F2]/60">Converse com suas motoristas</p>
              </div>

              <div className="space-y-3">
                {conversations.length > 0 ? (
                  conversations.map((conv, index) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className="p-4 rounded-2xl bg-[#F2F2F2]/5 border-[#F22998]/10 hover:border-[#F22998]/30 transition-all cursor-pointer"
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={conv.partner.photo}
                              alt={conv.partner.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-[#F22998]"
                            />
                            {conv.partner.status === 'online' && (
                              <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0D0D0D]" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-[#F2F2F2]">{conv.partner.name}</h3>
                              <span className="text-xs text-[#F2F2F2]/50">
                                {format(new Date(conv.lastMessageTime), 'HH:mm')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-[#F2F2F2]/60 truncate">{conv.lastMessage}</p>
                              {conv.unread > 0 && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#F22998] text-white text-xs font-medium">
                                  {conv.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <MessageCircle className="w-16 h-16 text-[#F22998]/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#F2F2F2] mb-2">Nenhuma conversa</h3>
                    <p className="text-[#F2F2F2]/50">Suas mensagens com motoristas aparecerão aqui</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            // Chat View
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-[calc(100vh-8rem)]"
            >
              {/* Chat Header */}
              <Card className="p-4 rounded-2xl bg-[#F2F2F2]/5 border-[#F22998]/10 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-2 rounded-lg hover:bg-[#F22998]/10 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#F2F2F2]" />
                    </button>
                    <img
                      src={selectedConversation.partner.photo}
                      alt={selectedConversation.partner.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#F22998]"
                    />
                    <div>
                      <h3 className="font-semibold text-[#F2F2F2]">{selectedConversation.partner.name}</h3>
                      <p className="text-xs text-green-400">
                        {selectedConversation.partner.status === 'online' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-[#F22998] hover:bg-[#F22998]/10">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-[#F2F2F2] hover:bg-[#F22998]/10">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white rounded-br-sm'
                          : 'bg-[#F2F2F2]/10 text-[#F2F2F2] rounded-bl-sm'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-white/60' : 'text-[#F2F2F2]/40'}`}>
                        {format(new Date(message.timestamp), 'HH:mm')}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => setNewMessage(reply)}
                    className="px-4 py-2 rounded-full bg-[#F22998]/10 text-[#F22998] text-sm whitespace-nowrap hover:bg-[#F22998]/20 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Input */}
              <Card className="p-3 rounded-2xl bg-[#F2F2F2]/5 border-[#F22998]/10">
                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-lg hover:bg-[#F22998]/10 transition-colors text-[#F2F2F2]/50">
                    <Image className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-[#F22998]/10 transition-colors text-[#F2F2F2]/50">
                    <MapPin className="w-5 h-5" />
                  </button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-transparent border-none text-[#F2F2F2] placeholder:text-[#F2F2F2]/40 focus-visible:ring-0"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="btn-gradient rounded-xl disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}