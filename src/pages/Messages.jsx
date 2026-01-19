import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Send, User, Circle, Archive, ArchiveRestore, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Messages() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        loadConversations(userData.id);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      const msgs = await base44.entities.Message.filter({ 
        ride_id: selectedConversation.id 
      }, '-created_date');
      setMessages(msgs);
      markMessagesAsRead(selectedConversation.id);
    };

    loadMessages();

    // Real-time subscription
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.ride_id === selectedConversation.id) {
        if (event.type === 'create') {
          setMessages(prev => [event.data, ...prev]);
          if (event.data.receiver_id === user.id) {
            markMessagesAsRead(selectedConversation.id);
          }
        } else if (event.type === 'update') {
          setMessages(prev => prev.map(m => 
            m.id === event.data.id ? event.data : m
          ));
        }
      }
    });

    return () => unsubscribe();
  }, [selectedConversation, user]);

  const loadConversations = async (userId) => {
    const userRides = await base44.entities.Ride.filter({
      $or: [{ passenger_id: userId }, { driver_id: userId }]
    }, '-updated_date', 50);
    
    const filtered = userRides.filter(r => r.status !== 'cancelled');
    setConversations(filtered);
    
    // Count unread messages
    const msgs = await base44.entities.Message.filter({
      receiver_id: userId,
      is_read: false
    });
    setUnreadCount(msgs.length);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await base44.entities.Message.create({
        ride_id: selectedConversation.id,
        sender_id: user.id,
        receiver_id: selectedConversation.passenger_id === user.id 
          ? selectedConversation.driver_id 
          : selectedConversation.passenger_id,
        content: newMessage,
        message_type: 'text'
      });

      setNewMessage('');
      
      // Send notification to receiver
      const receiverId = selectedConversation.passenger_id === user.id 
        ? selectedConversation.driver_id 
        : selectedConversation.passenger_id;
      
      await base44.entities.Notification.create({
        user_id: receiverId,
        title: 'Nova mensagem',
        message: `${user.full_name}: ${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
        type: 'message',
        related_id: selectedConversation.id
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleArchiveConversation = async (rideId, archive = true) => {
    try {
      await base44.entities.Ride.update(rideId, { 
        archived: archive 
      });
      
      setConversations(prev => prev.map(c => 
        c.id === rideId ? { ...c, archived: archive } : c
      ));
      
      if (selectedConversation?.id === rideId) {
        setSelectedConversation(null);
      }
      
      toast.success(archive ? 'Conversa arquivada' : 'Conversa restaurada');
    } catch (error) {
      toast.error('Erro ao arquivar conversa');
    }
  };

  const markMessagesAsRead = async (rideId) => {
    try {
      const unreadMessages = messages.filter(m => 
        m.receiver_id === user.id && !m.is_read
      );
      
      for (const msg of unreadMessages) {
        await base44.entities.Message.update(msg.id, { is_read: true });
      }
      
      setUnreadCount(prev => Math.max(0, prev - unreadMessages.length));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const isDark = user?.theme !== 'light';
  
  const displayedConversations = conversations.filter(c => 
    showArchived ? c.archived : !c.archived
  );

  return (
    <div className={`min-h-screen pb-24 md:pb-10 ${isDark ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
              Mensagens
            </h1>
            {unreadCount > 0 && (
              <p className={`text-sm mt-1 ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-600'}`}>
                {unreadCount} mensagem{unreadCount > 1 ? 's' : ''} não lida{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button
            onClick={() => setShowArchived(!showArchived)}
            variant="outline"
            className="border-[#F22998]/30 text-[#F22998]"
          >
            {showArchived ? (
              <>
                <ArchiveRestore className="w-4 h-4 mr-2" />
                Ver Ativas
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-2" />
                Ver Arquivadas
              </>
            )}
          </Button>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className={`p-4 rounded-3xl h-[600px] overflow-y-auto ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
              {showArchived ? 'Conversas Arquivadas' : 'Conversas Ativas'}
            </h3>
            {displayedConversations.length === 0 ? (
              <p className={`text-center py-8 ${isDark ? 'text-[#F2F2F2]/50' : 'text-gray-500'}`}>
                {showArchived ? 'Nenhuma conversa arquivada' : 'Nenhuma conversa ativa'}
              </p>
            ) : (
              <div className="space-y-2">
                {displayedConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`relative group ${
                    selectedConversation?.id === conv.id
                      ? 'bg-[#F22998]/20 border border-[#F22998]/30'
                      : ''
                  } rounded-xl`}
                >
                  <button
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-3 text-left transition-all ${
                      isDark ? 'hover:bg-[#F22998]/10' : 'hover:bg-gray-100'
                    } rounded-xl`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#F22998]/20' : 'bg-gray-200'}`}>
                        <User className="w-5 h-5 text-[#F22998]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                          Corrida para {conv.destination_address?.substring(0, 20)}...
                        </p>
                        <p className={`text-xs ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-600'}`}>
                          {conv.status === 'completed' ? 'Concluída' : 'Em andamento'}
                        </p>
                      </div>
                      {conv.status === 'in_progress' && (
                        <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveConversation(conv.id, !showArchived);
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDark ? 'hover:bg-[#F22998]/20' : 'hover:bg-gray-200'
                    }`}
                    title={showArchived ? 'Restaurar' : 'Arquivar'}
                  >
                    {showArchived ? (
                      <ArchiveRestore className="w-4 h-4 text-[#F22998]" />
                    ) : (
                      <Archive className="w-4 h-4 text-[#F22998]" />
                    )}
                  </button>
                </div>
                ))}
              </div>
            )}
          </Card>

          {/* Chat Area */}
          <Card className={`md:col-span-2 rounded-3xl flex flex-col h-[600px] ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className={`p-4 border-b ${isDark ? 'border-[#F22998]/10' : 'border-gray-200'} flex items-center justify-between`}>
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                      {selectedConversation.destination_address}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-600'}`}>
                      {selectedConversation.status === 'completed' ? 'Corrida concluída' : 'Corrida ativa'}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleArchiveConversation(selectedConversation.id, !selectedConversation.archived)}
                    variant="ghost"
                    size="sm"
                    className="text-[#F22998]"
                  >
                    {selectedConversation.archived ? (
                      <>
                        <ArchiveRestore className="w-4 h-4 mr-1" />
                        Restaurar
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4 mr-1" />
                        Arquivar
                      </>
                    )}
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className={isDark ? 'text-[#F2F2F2]/50' : 'text-gray-500'}>
                        Nenhuma mensagem ainda
                      </p>
                    </div>
                  ) : (
                    messages.reverse().map((msg) => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                              isMe
                                ? 'bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white'
                                : isDark ? 'bg-[#F2F2F2]/10 text-[#F2F2F2]' : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : isDark ? 'text-[#F2F2F2]/50' : 'text-gray-500'}`}>
                              {new Date(msg.created_date).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className={`p-4 border-t ${isDark ? 'border-[#F22998]/10' : 'border-gray-200'}`}>
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Digite sua mensagem..."
                      className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="btn-gradient"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className={isDark ? 'text-[#F2F2F2]/50' : 'text-gray-500'}>
                  Selecione uma conversa
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}