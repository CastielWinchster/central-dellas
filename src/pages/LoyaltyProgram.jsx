import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, Star, Trophy, Crown, Sparkles, Percent, 
  ArrowRight, Check, Copy, Tag
} from 'lucide-react';
import { toast } from 'sonner';

export default function LoyaltyProgram() {
  const [user, setUser] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const completedRides = user?.completed_rides || 0;
  const loyaltyPoints = user?.loyalty_points || 0;
  const progressToNextReward = (completedRides % 10) * 10;
  const ridesUntilReward = 10 - (completedRides % 10);
  const totalRewardsEarned = Math.floor(completedRides / 10);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Digite um código promocional');
      return;
    }

    try {
      const codes = await base44.entities.PromoCode.filter({ code: promoCode.toUpperCase() });
      
      if (codes.length === 0) {
        toast.error('Código inválido');
        return;
      }

      const code = codes[0];
      
      if (!code.is_active) {
        toast.error('Código expirado');
        return;
      }

      if (code.valid_until && new Date(code.valid_until) < new Date()) {
        toast.error('Código expirado');
        return;
      }

      if (user.used_promo_codes?.includes(code.code)) {
        toast.error('Você já usou este código');
        return;
      }

      if (code.first_ride_only && completedRides > 0) {
        toast.error('Este código é válido apenas para a primeira corrida');
        return;
      }

      // Adiciona o código aos códigos usados
      await base44.auth.updateMe({
        used_promo_codes: [...(user.used_promo_codes || []), code.code]
      });

      toast.success(`Código ${code.code} aplicado! Desconto de R$ ${code.discount_amount} na próxima corrida!`);
      setPromoCode('');
      
      // Atualiza o usuário
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
    } catch (e) {
      toast.error('Erro ao aplicar código');
    }
  };

  const benefits = [
    { rides: 10, discount: 10, icon: Gift, color: 'from-pink-500 to-rose-500' },
    { rides: 20, discount: 15, icon: Star, color: 'from-purple-500 to-pink-500' },
    { rides: 30, discount: 20, icon: Trophy, color: 'from-violet-500 to-purple-500' },
    { rides: 50, discount: 30, icon: Crown, color: 'from-fuchsia-500 to-pink-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F22998]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] mb-4 glow-pink">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BF3B79] to-[#F22998] bg-clip-text text-transparent mb-2">
            Programa de Fidelidade
          </h1>
          <p className="text-[#F2F2F2]/60">
            Quanto mais você anda, mais você ganha!
          </p>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-[#F22998]/30 mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <p className="text-[#F2F2F2]/60 text-sm mb-2">Seu Progresso</p>
                <div className="text-5xl font-bold bg-gradient-to-r from-[#BF3B79] to-[#F22998] bg-clip-text text-transparent">
                  {completedRides}
                </div>
                <p className="text-[#F2F2F2]/80 mt-1">corridas completadas</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#F2F2F2]/60">Próxima recompensa em {ridesUntilReward} corridas</span>
                  <span className="text-[#F22998] font-medium">{progressToNextReward}%</span>
                </div>
                <Progress value={progressToNextReward} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F22998]/20">
                <div className="text-center">
                  <Trophy className="w-6 h-6 text-[#F22998] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#F2F2F2]">{totalRewardsEarned}</p>
                  <p className="text-xs text-[#F2F2F2]/60">Recompensas Ganhas</p>
                </div>
                <div className="text-center">
                  <Star className="w-6 h-6 text-[#F22998] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#F2F2F2]">{loyaltyPoints}</p>
                  <p className="text-xs text-[#F2F2F2]/60">Pontos de Fidelidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Promo Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-effect border-[#F22998]/30 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F2F2F2]">
                <Tag className="w-5 h-5 text-[#F22998]" />
                Código Promocional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-[#BF3B79]/10 to-[#F22998]/10 border border-[#F22998]/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#F2F2F2] font-medium">CENTRAL26</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText('CENTRAL26');
                      toast.success('Código copiado!');
                    }}
                    className="text-[#F22998]"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-[#F2F2F2]/60">
                  R$ 10 de desconto para novos usuários • Válido até 2027
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Digite seu código promocional"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="bg-[#0D0D0D]/50 border-[#F22998]/30 text-[#F2F2F2]"
                />
                <Button
                  onClick={applyPromoCode}
                  className="btn-gradient"
                >
                  Aplicar
                </Button>
              </div>

              {user?.used_promo_codes?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#F22998]/20">
                  <p className="text-xs text-[#F2F2F2]/60 mb-2">Códigos já utilizados:</p>
                  <div className="flex flex-wrap gap-2">
                    {user.used_promo_codes.map((code, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 rounded-full bg-[#F22998]/20 text-[#F22998]">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-[#F2F2F2] mb-4">Recompensas por Corridas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => {
              const isUnlocked = completedRides >= benefit.rides;
              const Icon = benefit.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card className={`glass-effect border-[#F22998]/30 ${isUnlocked ? 'glow-pink' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${benefit.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        {isUnlocked && (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-[#F2F2F2] mb-2">
                        {benefit.rides} Corridas
                      </h3>
                      
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-[#F22998]">
                          R$ {benefit.discount}
                        </span>
                        <span className="text-[#F2F2F2]/60">de desconto</span>
                      </div>
                      
                      {!isUnlocked && (
                        <div className="flex items-center gap-2 text-sm text-[#F2F2F2]/60">
                          <ArrowRight className="w-4 h-4" />
                          Faltam {benefit.rides - completedRides} corridas
                        </div>
                      )}
                      
                      {isUnlocked && (
                        <p className="text-sm text-green-400 font-medium">
                          Recompensa desbloqueada!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Card className="glass-effect border-[#F22998]/30">
            <CardHeader>
              <CardTitle className="text-[#F2F2F2]">Como Funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <p className="text-[#F2F2F2]/80 text-sm">
                  Complete corridas e acumule pontos automaticamente
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <p className="text-[#F2F2F2]/80 text-sm">
                  A cada 10 corridas, você ganha um desconto especial
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <p className="text-[#F2F2F2]/80 text-sm">
                  Use seus descontos nas próximas corridas e economize!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}