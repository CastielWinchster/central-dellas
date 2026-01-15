import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, Gift, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ClubDellas() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        // Buscar assinatura existente
        const subs = await base44.entities.Subscription.filter({ user_id: userData.id });
        if (subs.length > 0) {
          setSubscription(subs[0]);
        }
      } catch (e) {
        navigate(createPageUrl('PassengerLogin'));
      }
    };
    loadData();
  }, [navigate]);

  const plans = [
    {
      name: 'Bronze',
      value: 'bronze',
      price: 49.90,
      discount: 10,
      color: 'from-amber-600 to-amber-800',
      features: [
        '10% de desconto em todas as corridas',
        'Suporte prioritário',
        'Sem corridas cortesia',
        'Cancele quando quiser'
      ],
      icon: Crown
    },
    {
      name: 'Prata',
      value: 'prata',
      price: 79.90,
      discount: 15,
      color: 'from-gray-400 to-gray-600',
      features: [
        '15% de desconto em todas as corridas',
        'Prioridade na fila de motoristas',
        'Suporte VIP 24/7',
        'Cancele quando quiser'
      ],
      icon: Star,
      popular: true
    },
    {
      name: 'Ouro',
      value: 'ouro',
      price: 129.90,
      discount: 20,
      color: 'from-yellow-400 to-yellow-600',
      features: [
        '20% de desconto em todas as corridas',
        'Motorista prioritária sempre',
        '5 corridas cortesia por mês',
        'Suporte VIP exclusivo',
        'Acesso antecipado a novidades'
      ],
      icon: Zap
    }
  ];

  const handleSubscribe = async (plan) => {
    setLoading(true);
    try {
      const selectedPlan = plans.find(p => p.value === plan);
      
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      await base44.entities.Subscription.create({
        user_id: user.id,
        plan: plan,
        monthly_price: selectedPlan.price,
        discount_percentage: selectedPlan.discount,
        free_rides_remaining: plan === 'ouro' ? 5 : 0,
        next_billing_date: nextBilling.toISOString().split('T')[0],
        status: 'active'
      });

      toast.success(`Bem-vinda ao Clube Dellas ${selectedPlan.name}!`);
      
      // Recarregar dados
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      setSubscription(subs[0]);
    } catch (error) {
      toast.error('Erro ao processar assinatura');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) return;

    try {
      await base44.entities.Subscription.update(subscription.id, { status: 'cancelled' });
      toast.success('Assinatura cancelada. Você mantém os benefícios até o fim do período pago.');
      setSubscription(null);
    } catch (error) {
      toast.error('Erro ao cancelar assinatura');
    }
  };

  const isDark = true;

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F22998]/10 border border-[#F22998]/30 mb-4">
            <Crown className="w-5 h-5 text-[#F22998]" />
            <span className="text-sm text-[#F22998] font-medium">Clube Exclusivo</span>
          </div>
          <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
            Clube Dellas
          </h1>
          <p className={`text-lg ${isDark ? 'text-[#F2F2F2]/60' : 'text-black/70'}`}>
            Economize em todas as suas corridas com planos mensais exclusivos
          </p>
        </motion.div>

        {/* Current Subscription */}
        {subscription && subscription.status === 'active' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="p-6 rounded-3xl bg-gradient-to-r from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#F2F2F2] mb-1">
                    Plano {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Ativo
                  </h3>
                  <p className="text-[#F2F2F2]/60">
                    Próxima cobrança: {new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-[#F22998] font-semibold mt-2">
                    Você economizou R$ {subscription.total_saved?.toFixed(2) || '0.00'} até agora!
                  </p>
                </div>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Cancelar Plano
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 rounded-3xl relative ${
                plan.popular ? 'border-2 border-[#F22998] shadow-lg shadow-[#F22998]/20' : ''
              } ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white text-sm font-semibold">
                    Mais Popular
                  </div>
                )}

                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 mx-auto`}>
                  <plan.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
                  {plan.name}
                </h3>

                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-[#F22998]">R$ {plan.price.toFixed(2)}</span>
                  <span className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-black/60'}`}>/mês</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-[#F22998] flex-shrink-0 mt-0.5" />
                      <span className={`text-sm ${isDark ? 'text-[#F2F2F2]/80' : 'text-black/80'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.value)}
                  disabled={loading || (subscription?.plan === plan.value && subscription?.status === 'active')}
                  className={`w-full py-6 rounded-2xl font-semibold ${
                    plan.popular ? 'btn-gradient' : 'bg-[#F22998]/10 text-[#F22998] hover:bg-[#F22998]/20'
                  }`}
                >
                  {subscription?.plan === plan.value && subscription?.status === 'active' 
                    ? 'Plano Atual' 
                    : 'Assinar Agora'}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={`p-8 rounded-3xl ${isDark ? 'bg-gradient-to-br from-[#BF3B79]/10 to-[#F22998]/10 border-[#F22998]/20' : 'bg-white border-gray-200'}`}>
            <div className="text-center mb-8">
              <Gift className="w-12 h-12 text-[#F22998] mx-auto mb-4" />
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
                Benefícios Exclusivos
              </h3>
              <p className={isDark ? 'text-[#F2F2F2]/60' : 'text-black/70'}>
                Todos os planos incluem vantagens especiais
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Sem Taxas Ocultas', desc: 'Preço fixo mensal, sem surpresas' },
                { title: 'Cancele Quando Quiser', desc: 'Sem multas ou períodos mínimos' },
                { title: 'Indique e Ganhe', desc: '3 amigas = 1 mês grátis' }
              ].map((benefit, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F22998]/20 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-[#F22998]" />
                  </div>
                  <h4 className={`font-semibold mb-1 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
                    {benefit.title}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-black/60'}`}>
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}