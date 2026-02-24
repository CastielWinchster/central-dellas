import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import moment from 'moment';

export default function PassengerMessages() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Buscar conversas onde usuário é participante
      const allConvos = await base44.entities.Conversation.filter({
        $or: [
          { passenger_id: userData.id },
          { driver_id: userData.id }
        ]
      }, '-created_date');

      // Buscar última mensagem e contagem de não lidas para cada conversa
      const convosWithData = await Promise.all(
        allConvos.map(async (convo) => {
          const messages = await base44.entities.Message.filter(
            { conversation_id: convo.id },
            '-created_date',
            1
          );

          const unreadMessages = await base44.entities.Message.filter({
            conversation_id: convo.id,
            sender_id: { $ne: userData.id },
            is_read: false
          });

          // Buscar dados do outro participante
          const otherUserId = convo.passenger_id === userData.id 
            ? convo.driver_id 
            : convo.passenger_id;
          
          let otherUser = null;
          try {
            const users = await base44.entities.User.filter({ id: otherUserId });
            otherUser = users[0];
          } catch (error) {
            console.error('Erro ao buscar usuário:', error);
          }

          return {
            ...convo,
            lastMessage: messages[0] || null,
            unreadCount: unreadMessages.length,
            otherUser
          };
        })
      );

      setConversations(convosWithData);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        base44.auth.redirectToLogin();
      } else {
        toast.error('Erro ao carregar conversas');
      }
    } finally {
      setLoading(false);
    }
  };

  const getLastMessageText = (message) => {
    if (!message) return 'Nenhuma mensagem ainda';
    if (message.status === 'removed') return 'Mensagem deletada por conteúdo ofensivo';
    if (message.type === 'image') return '📷 Foto';
    if (message.type === 'audio') return '🎤 Áudio';
    if (message.type === 'system') return message.text;
    return message.text || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[#F2F2F2] mb-6">Mensagens</h1>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-[#F22998]/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-[#F22998]/50" />
            </div>
            <p className="text-[#F2F2F2]/60 text-center">Nenhuma conversa ainda</p>
            <p className="text-[#F2F2F2]/40 text-sm text-center mt-2">
              Suas conversas com motoristas aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((convo, index) => (
              <motion.div
                key={convo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={createPageUrl(`Chat?conversation=${convo.id}`)}
                  className="block p-4 rounded-2xl bg-[#1A1A1A] border border-[#F22998]/20 hover:border-[#F22998]/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#F22998] flex-shrink-0">
                      {convo.otherUser?.photo_url ? (
                        <img 
                          src={convo.otherUser.photo_url} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-[#F2F2F2] truncate">
                          {convo.otherUser?.full_name || 'Usuária'}
                        </h3>
                        {convo.lastMessage && (
                          <span className="text-xs text-[#F2F2F2]/40 ml-2">
                            {moment(convo.lastMessage.created_date).fromNow()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'text-[#F2F2F2] font-medium' : 'text-[#F2F2F2]/60'}`}>
                          {getLastMessageText(convo.lastMessage)}
                        </p>
                        
                        <div className="flex items-center gap-2 ml-2">
                          {convo.unreadCount > 0 && (
                            <div className="w-5 h-5 rounded-full bg-[#F22998] flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                              </span>
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#F22998]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}