import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Send, User, Circle, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PassengerMessages() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        await loadConversations(userData.id);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const loadConversations = async (userId) => {
    const userRides = await base44.entities.Ride.filter({
      passenger_id: userId
    }, '-updated_date', 50);
    
    const filtered = userRides.filter(r => r.status !== 'cancelled');
    setConversations(filtered);
  };

  const isDark = user?.theme !== 'light';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 md:pb-10 ${isDark ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-4"
        >
          <button 
            onClick={() => navigate(createPageUrl('PassengerDashboard'))}
            className="p-2 rounded-lg hover:bg-[#F22998]/10"
          >
            <ArrowLeft className="w-5 h-5 text-[#F2F2F2]" />
          </button>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
              Mensagens
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-600'}`}>
              Conversas com suas motoristas
            </p>
          </div>
        </motion.div>

        {conversations.length === 0 ? (
          <Card className={`p-8 rounded-3xl text-center ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-[#F2F2F2]/30' : 'text-gray-300'}`} />
            <p className={isDark ? 'text-[#F2F2F2]/50' : 'text-gray-500'}>
              Nenhuma conversa ainda
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-[#F2F2F2]/40' : 'text-gray-400'}`}>
              Suas conversas com motoristas aparecerão aqui
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(createPageUrl('PassengerChat') + '?ride=' + conv.id)}
                className={`w-full p-4 rounded-2xl text-left transition-all ${
                  isDark 
                    ? 'bg-[#F2F2F2]/5 hover:bg-[#F22998]/10 border border-[#F22998]/10' 
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-[#F22998]/20' : 'bg-gray-200'}`}>
                    <User className="w-7 h-7 text-[#F22998]" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-semibold ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                        Corrida para {conv.destination_address?.split(',')[0] || 'Destino'}
                      </p>
                      {conv.status === 'in_progress' && (
                        <Circle className="w-3 h-3 fill-green-500 text-green-500 animate-pulse" />
                      )}
                    </div>
                    
                    <p className={`text-sm truncate ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-600'}`}>
                      {conv.pickup_address?.substring(0, 40)}...
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        conv.status === 'in_progress' 
                          ? 'bg-green-500/20 text-green-400' 
                          : conv.status === 'completed'
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {conv.status === 'in_progress' ? 'Em andamento' : 
                         conv.status === 'completed' ? 'Concluída' : 
                         conv.status === 'arriving' ? 'Motorista chegando' : 'Aceita'}
                      </span>
                      
                      <span className={`text-xs ${isDark ? 'text-[#F2F2F2]/40' : 'text-gray-400'}`}>
                        {new Date(conv.created_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}