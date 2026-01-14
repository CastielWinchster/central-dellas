import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Star, MessageCircle, ThumbsUp, TrendingUp,
  Award, Heart, Sparkles, Quote
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyReviews() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    average: 4.9,
    total: 156,
    distribution: { 5: 142, 4: 10, 3: 3, 2: 1, 1: 0 }
  });

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
  }, []);

  const reviews = [
    {
      id: '1',
      rating: 5,
      comment: 'Motorista super simpática e carro muito limpo! Recomendo demais 💕',
      passenger: {
        name: 'Ana Carolina',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
      },
      tags: ['Simpática', 'Carro Limpo', 'Pontual'],
      date: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '2',
      rating: 5,
      comment: 'Melhor motorista que já peguei no app! Me senti muito segura.',
      passenger: {
        name: 'Maria Silva',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'
      },
      tags: ['Segura', 'Atenciosa'],
      date: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '3',
      rating: 4,
      comment: 'Boa corrida, chegou rápido!',
      passenger: {
        name: 'Beatriz Santos',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
      },
      tags: ['Rápida'],
      date: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: '4',
      rating: 5,
      comment: 'Adorei a viagem! Conversamos muito e o tempo passou voando.',
      passenger: {
        name: 'Julia Ferreira',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
      },
      tags: ['Simpática', 'Boa conversa'],
      date: new Date(Date.now() - 345600000).toISOString()
    }
  ];

  const badges = [
    { icon: Award, label: 'Top Motorista', description: 'Entre as 10% melhores avaliadas', color: 'from-yellow-400 to-orange-500' },
    { icon: Heart, label: 'Favorita', description: 'Mais de 50 corridas repetidas', color: 'from-[#BF3B79] to-[#F22998]' },
    { icon: Sparkles, label: 'Estrela Nascente', description: '100 corridas 5 estrelas', color: 'from-purple-400 to-pink-500' }
  ];

  const tags = [
    { label: 'Simpática', count: 89 },
    { label: 'Carro Limpo', count: 76 },
    { label: 'Pontual', count: 68 },
    { label: 'Segura', count: 54 },
    { label: 'Atenciosa', count: 45 },
    { label: 'Boa conversa', count: 32 }
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#F2F2F2] mb-2">Minhas Avaliações</h1>
          <p className="text-[#F2F2F2]/60">Veja o que as passageiras dizem sobre você</p>
        </motion.div>

        {/* Overall Rating Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 rounded-3xl bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/20 mb-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Average Rating */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <span className="text-6xl font-bold text-[#F2F2F2]">{stats.average}</span>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-6 h-6 ${i < Math.round(stats.average) ? 'text-yellow-400 fill-yellow-400' : 'text-[#F2F2F2]/20'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-[#F2F2F2]/60">{stats.total} avaliações</p>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-green-400">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">+0.2 este mês</span>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution[star] || 0;
                  const percentage = (count / stats.total) * 100;
                  
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm text-[#F2F2F2]">{star}</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      </div>
                      <Progress value={percentage} className="h-2 flex-1 bg-[#F2F2F2]/10">
                        <div 
                          className="h-full bg-gradient-to-r from-[#BF3B79] to-[#F22998] rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </Progress>
                      <span className="text-sm text-[#F2F2F2]/50 w-10">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10 mb-6">
            <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#F22998]" />
              Conquistas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {badges.map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="p-4 rounded-2xl bg-[#0D0D0D] text-center group hover:scale-105 transition-transform"
                >
                  <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <badge.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="font-semibold text-[#F2F2F2]">{badge.label}</h4>
                  <p className="text-sm text-[#F2F2F2]/50">{badge.description}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Top Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10 mb-6">
            <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-[#F22998]" />
              Elogios Frequentes
            </h3>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.4 }}
                  className="px-4 py-2 rounded-full bg-[#F22998]/10 border border-[#F22998]/30 text-[#F2F2F2] text-sm flex items-center gap-2"
                >
                  {tag.label}
                  <span className="px-2 py-0.5 rounded-full bg-[#F22998]/20 text-xs text-[#F22998]">
                    {tag.count}
                  </span>
                </motion.span>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Reviews List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10">
            <h3 className="text-lg font-semibold text-[#F2F2F2] mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#F22998]" />
              Últimas Avaliações
            </h3>
            
            <div className="space-y-6">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className="pb-6 border-b border-[#F22998]/10 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={review.passenger.photo}
                      alt={review.passenger.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#F22998]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-[#F2F2F2]">{review.passenger.name}</h4>
                        <span className="text-sm text-[#F2F2F2]/50">
                          {format(new Date(review.date), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[#F2F2F2]/20'}`} 
                          />
                        ))}
                      </div>
                      
                      <div className="relative mb-3">
                        <Quote className="absolute -left-1 -top-1 w-4 h-4 text-[#F22998]/30" />
                        <p className="text-[#F2F2F2]/80 pl-4">{review.comment}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {review.tags.map((tag, tagIndex) => (
                          <span 
                            key={tagIndex}
                            className="px-3 py-1 rounded-full bg-[#F22998]/10 text-[#F22998] text-xs"
                          >
                            ✨ {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}