import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Car, 
  ArrowUpRight, ArrowDownRight,
  CreditCard, Clock, Percent, X, CheckCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const COMMISSION_RATE = 0.12;

const PERIOD_LABELS = { week: 'Semana', month: 'Mês', year: 'Ano' };

function getPeriodStart(period) {
  const now = new Date();
  if (period === 'week') return startOfWeek(now, { weekStartsOn: 1 });
  if (period === 'month') return startOfMonth(now);
  return startOfYear(now);
}

function buildChartData(rides, period) {
  if (period === 'week') {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const map = {};
    days.forEach(d => { map[d] = 0; });
    rides.forEach(r => {
      const dayIdx = new Date(r.created_date).getDay(); // 0=Dom
      const label = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayIdx];
      if (label in map) map[label] += r.estimated_price || 0;
    });
    return days.map(d => ({ day: d, value: parseFloat(map[d].toFixed(2)) }));
  }
  if (period === 'month') {
    const weeks = ['S1', 'S2', 'S3', 'S4'];
    const map = { S1: 0, S2: 0, S3: 0, S4: 0 };
    rides.forEach(r => {
      const dom = new Date(r.created_date).getDate();
      const key = dom <= 7 ? 'S1' : dom <= 14 ? 'S2' : dom <= 21 ? 'S3' : 'S4';
      map[key] += r.estimated_price || 0;
    });
    return weeks.map(w => ({ day: w, value: parseFloat(map[w].toFixed(2)) }));
  }
  // year
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const map = {};
  months.forEach(m => { map[m] = 0; });
  rides.forEach(r => {
    const m = months[new Date(r.created_date).getMonth()];
    map[m] += r.estimated_price || 0;
  });
  return months.map(m => ({ day: m, value: parseFloat(map[m].toFixed(2)) }));
}

function buildHourlyData(rides) {
  const slots = [
    { hour: '06h', from: 6 }, { hour: '08h', from: 8 }, { hour: '10h', from: 10 },
    { hour: '12h', from: 12 }, { hour: '14h', from: 14 }, { hour: '16h', from: 16 },
    { hour: '18h', from: 18 }, { hour: '20h', from: 20 }
  ];
  const map = {};
  slots.forEach(s => { map[s.from] = 0; });
  rides.forEach(r => {
    const h = new Date(r.created_date).getHours();
    // Mapeia para o slot mais próximo
    const slot = slots.reduce((prev, curr) => Math.abs(curr.from - h) < Math.abs(prev.from - h) ? curr : prev);
    map[slot.from]++;
  });
  return slots.map(s => ({ hour: s.hour, rides: map[s.from] }));
}

export default function Earnings() {
  const [user, setUser] = useState(null);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [allRides, setAllRides] = useState([]);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionConfirmed, setCommissionConfirmed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        // Buscar todas as corridas completadas da motorista
        const rides = await base44.entities.Ride.filter({
          assigned_driver_id: userData.id,
          status: 'completed'
        });
        setAllRides(rides);
      } catch (e) {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filtrar corridas pelo período selecionado
  const periodStart = getPeriodStart(period);
  const filteredRides = allRides.filter(r => isAfter(new Date(r.created_date), periodStart));

  const total = filteredRides.reduce((sum, r) => sum + (r.estimated_price || 0), 0);
  const rides = filteredRides.length;
  const avgPerRide = rides > 0 ? total / rides : 0;

  // Comparar com período anterior para calcular tendência
  const prevStart = new Date(periodStart.getTime() - (new Date() - periodStart));
  const prevRides = allRides.filter(r => {
    const d = new Date(r.created_date);
    return isAfter(d, prevStart) && d < periodStart;
  });
  const prevTotal = prevRides.reduce((sum, r) => sum + (r.estimated_price || 0), 0);
  const trend = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  const chartData = buildChartData(filteredRides, period);
  const hourlyData = buildHourlyData(filteredRides);

  const commissionValue = total * COMMISSION_RATE;
  const netValue = total - commissionValue;

  const periodLabel = PERIOD_LABELS[period];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F22998] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F2F2F2] pb-24 md:pb-10">

      {/* Modal de Comissão */}
      <AnimatePresence>
        {showCommissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowCommissionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 22 }}
              className="bg-[#1a1a1a] rounded-3xl p-8 w-full max-w-md border border-[#F22998]/20 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {!commissionConfirmed ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#F2F2F2]">Comissão da {periodLabel}</h2>
                    <button onClick={() => setShowCommissionModal(false)} className="text-[#F2F2F2]/40 hover:text-[#F2F2F2] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-[#0D0D0D] rounded-2xl p-5 mb-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#F2F2F2]/60 text-sm">Ganhos ({periodLabel})</span>
                      <span className="text-[#F2F2F2] font-semibold">R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#F2F2F2]/60 text-sm">Taxa de comissão</span>
                      <span className="text-[#F22998] font-semibold">12%</span>
                    </div>
                    <div className="border-t border-[#F2F2F2]/10 pt-4 flex justify-between items-center">
                      <span className="text-[#F2F2F2]/80 text-sm font-medium">Valor a repassar</span>
                      <span className="text-2xl font-bold text-[#F22998]">R$ {commissionValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#F2F2F2]/60 text-sm">Seu líquido</span>
                      <span className="text-green-400 font-semibold">R$ {netValue.toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="text-[#F2F2F2]/50 text-xs text-center mb-6">
                    Este valor corresponde à comissão devida à Central Dellas. Confirme o repasse quando efetuado.
                  </p>

                  <p className="text-amber-400/80 text-xs text-center mb-4">
                    ⚠️ As motoristas devem passar o valor a repassar diretamente para a CentralDellas.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setCommissionConfirmed(true)}
                      className="w-full bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white rounded-2xl py-5 font-semibold"
                    >
                      Confirmar Repasse
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5"
                  >
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[#F2F2F2] mb-2">Repasse Confirmado!</h3>
                  <p className="text-[#F2F2F2]/50 text-sm mb-2">
                    Comissão de <span className="text-[#F22998] font-semibold">R$ {commissionValue.toFixed(2)}</span> registrada com sucesso.
                  </p>
                  <p className="text-[#F2F2F2]/40 text-xs mb-8">Próximo repasse em 7 dias.</p>
                  <Button
                    onClick={() => setShowCommissionModal(false)}
                    className="w-full bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white rounded-2xl py-5 font-semibold"
                  >
                    Fechar
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-[#F2F2F2] mb-2">Meus Ganhos</h1>
            <p className="text-[#F2F2F2]/60">Acompanhe seus rendimentos</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full transition-all ${
                  period === p
                    ? 'bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white'
                    : 'bg-[#F2F2F2]/5 text-[#F2F2F2]/60 hover:bg-[#F22998]/10'
                }`}
              >
                {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 rounded-3xl bg-gradient-to-br from-[#BF3B79] to-[#F22998] mb-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/70">Ganhos da {periodLabel.toLowerCase()}</p>
                {prevTotal > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                    {trend >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-300" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-300" />
                    )}
                    <span className="text-sm text-white font-medium">
                      {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              
              <h2 className="text-5xl font-bold text-white mb-8">
                R$ {total.toFixed(2)}
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/10">
                  <Car className="w-6 h-6 text-white/70 mb-2" />
                  <p className="text-2xl font-bold text-white">{rides}</p>
                  <p className="text-white/60 text-sm">Corridas</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10">
                  <Clock className="w-6 h-6 text-white/70 mb-2" />
                  <p className="text-2xl font-bold text-white">—</p>
                  <p className="text-white/60 text-sm">Online</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10">
                  <DollarSign className="w-6 h-6 text-white/70 mb-2" />
                  <p className="text-2xl font-bold text-white">R$ {avgPerRide.toFixed(0)}</p>
                  <p className="text-white/60 text-sm">Média/corrida</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => { setShowCommissionModal(true); setCommissionConfirmed(false); }}
                  className="flex-1 bg-white text-[#BF3B79] hover:bg-white/90 py-6 rounded-2xl font-semibold"
                >
                  <Percent className="w-5 h-5 mr-2" />
                  Comissão
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Earnings Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10">
              <h3 className="text-lg font-semibold text-[#F2F2F2] mb-6">Ganhos por Dia</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F22998" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F22998" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      stroke="#F2F2F2" 
                      strokeOpacity={0.3}
                      tick={{ fill: '#F2F2F2', fillOpacity: 0.5, fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#F2F2F2" 
                      strokeOpacity={0.3}
                      tick={{ fill: '#F2F2F2', fillOpacity: 0.5, fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0D0D0D',
                        border: '1px solid #F22998',
                        borderRadius: '12px',
                        color: '#F2F2F2'
                      }}
                      formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Ganhos']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#F22998"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Rides by Hour */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10">
              <h3 className="text-lg font-semibold text-[#F2F2F2] mb-6">Corridas por Horário</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <XAxis 
                      dataKey="hour" 
                      stroke="#F2F2F2" 
                      strokeOpacity={0.3}
                      tick={{ fill: '#F2F2F2', fillOpacity: 0.5, fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#F2F2F2" 
                      strokeOpacity={0.3}
                      tick={{ fill: '#F2F2F2', fillOpacity: 0.5, fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0D0D0D',
                        border: '1px solid #F22998',
                        borderRadius: '12px',
                        color: '#F2F2F2'
                      }}
                      formatter={(value) => [value, 'Corridas']}
                    />
                    <Bar 
                      dataKey="rides" 
                      fill="#F22998" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10">
            <h3 className="text-lg font-semibold text-[#F2F2F2] mb-6">Histórico de Corridas</h3>

            {filteredRides.length === 0 ? (
              <div className="text-center py-10">
                <Car className="w-12 h-12 text-[#F22998]/20 mx-auto mb-3" />
                <p className="text-[#F2F2F2]/40">Nenhuma corrida concluída neste período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRides.slice().reverse().slice(0, 20).map((ride, index) => (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#F22998]/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#F22998]/20 flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-[#F22998]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#F2F2F2] truncate">{ride.dropoff_text || 'Destino'}</p>
                        <p className="text-sm text-[#F2F2F2]/50">
                          {format(new Date(ride.created_date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-green-400 flex-shrink-0 ml-4">
                      +R$ {(ride.estimated_price || 0).toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}