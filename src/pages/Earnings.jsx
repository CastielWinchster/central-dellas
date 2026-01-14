import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Calendar, Car, 
  ChevronDown, Download, ArrowUpRight, ArrowDownRight,
  Wallet, CreditCard, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Earnings() {
  const [user, setUser] = useState(null);
  const [period, setPeriod] = useState('week');
  const [earningsData, setEarningsData] = useState({
    total: 1245.50,
    rides: 42,
    hours: 35,
    avgPerRide: 29.65,
    trend: 12.5
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

  // Generate chart data
  const chartData = [
    { day: 'Seg', value: 145 },
    { day: 'Ter', value: 189 },
    { day: 'Qua', value: 220 },
    { day: 'Qui', value: 178 },
    { day: 'Sex', value: 256 },
    { day: 'Sáb', value: 310 },
    { day: 'Dom', value: 147.50 }
  ];

  const hourlyData = [
    { hour: '06h', rides: 2 },
    { hour: '08h', rides: 5 },
    { hour: '10h', rides: 3 },
    { hour: '12h', rides: 6 },
    { hour: '14h', rides: 4 },
    { hour: '16h', rides: 7 },
    { hour: '18h', rides: 9 },
    { hour: '20h', rides: 6 }
  ];

  const transactions = [
    { id: '1', type: 'ride', description: 'Corrida - Ana Carolina', amount: 28.50, date: new Date(Date.now() - 3600000) },
    { id: '2', type: 'ride', description: 'Corrida - Maria Silva', amount: 45.00, date: new Date(Date.now() - 7200000) },
    { id: '3', type: 'bonus', description: 'Bônus de indicação', amount: 50.00, date: new Date(Date.now() - 86400000) },
    { id: '4', type: 'ride', description: 'Corrida - Beatriz Santos', amount: 32.00, date: new Date(Date.now() - 172800000) },
    { id: '5', type: 'withdrawal', description: 'Saque para conta', amount: -500.00, date: new Date(Date.now() - 259200000) },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-10">
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
                <p className="text-white/70">Saldo disponível</p>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                  {earningsData.trend > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-300" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-300" />
                  )}
                  <span className="text-sm text-white font-medium">
                    {earningsData.trend > 0 ? '+' : ''}{earningsData.trend}%
                  </span>
                </div>
              </div>
              
              <h2 className="text-5xl font-bold text-white mb-8">
                R$ {earningsData.total.toFixed(2)}
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/10">
                  <Car className="w-6 h-6 text-white/70 mb-2" />
                  <p className="text-2xl font-bold text-white">{earningsData.rides}</p>
                  <p className="text-white/60 text-sm">Corridas</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10">
                  <Clock className="w-6 h-6 text-white/70 mb-2" />
                  <p className="text-2xl font-bold text-white">{earningsData.hours}h</p>
                  <p className="text-white/60 text-sm">Online</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10">
                  <DollarSign className="w-6 h-6 text-white/70 mb-2" />
                  <p className="text-2xl font-bold text-white">R$ {earningsData.avgPerRide.toFixed(0)}</p>
                  <p className="text-white/60 text-sm">Média/corrida</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button className="flex-1 bg-white text-[#BF3B79] hover:bg-white/90 py-6 rounded-2xl">
                  <Wallet className="w-5 h-5 mr-2" />
                  Sacar
                </Button>
                <Button variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10 py-6 rounded-2xl">
                  <Download className="w-5 h-5 mr-2" />
                  Extrato
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#F2F2F2]">Histórico</h3>
              <Button variant="ghost" className="text-[#F22998] hover:bg-[#F22998]/10">
                Ver tudo
              </Button>
            </div>

            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.5 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#F22998]/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'ride' ? 'bg-[#F22998]/20' :
                      tx.type === 'bonus' ? 'bg-green-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      {tx.type === 'ride' ? (
                        <Car className={`w-5 h-5 text-[#F22998]`} />
                      ) : tx.type === 'bonus' ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#F2F2F2]">{tx.description}</p>
                      <p className="text-sm text-[#F2F2F2]/50">
                        {format(tx.date, "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2)}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}