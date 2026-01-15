import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Smartphone, MessageCircle, Phone, Monitor, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MigrationMetrics() {
  const [metrics, setMetrics] = useState({
    totalRides: 0,
    appRides: 0,
    whatsappRides: 0,
    phoneRides: 0,
    adminRides: 0,
    appPercentage: 0,
    trend: [],
    migrationGoal: 80
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      // Buscar todas as fontes de corrida
      const sources = await base44.entities.RideSource.list('-created_date', 1000);
      
      const totalRides = sources.length;
      const appRides = sources.filter(s => s.source === 'app').length;
      const whatsappRides = sources.filter(s => s.source === 'whatsapp').length;
      const phoneRides = sources.filter(s => s.source === 'phone').length;
      const adminRides = sources.filter(s => s.source === 'admin').length;
      
      const appPercentage = totalRides > 0 ? Math.round((appRides / totalRides) * 100) : 0;

      // Calcular tendência dos últimos 7 dias
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRides = sources.filter(s => 
          s.created_date && s.created_date.startsWith(dateStr)
        );
        
        const dayAppRides = dayRides.filter(s => s.source === 'app').length;
        const dayTotal = dayRides.length;
        const dayPercentage = dayTotal > 0 ? Math.round((dayAppRides / dayTotal) * 100) : 0;
        
        last7Days.push({
          date: dateStr,
          percentage: dayPercentage,
          total: dayTotal,
          app: dayAppRides
        });
      }

      setMetrics({
        totalRides,
        appRides,
        whatsappRides,
        phoneRides,
        adminRides,
        appPercentage,
        trend: last7Days,
        migrationGoal: 80
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const sourceData = [
    { 
      name: 'App', 
      count: metrics.appRides, 
      icon: Smartphone, 
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500'
    },
    { 
      name: 'WhatsApp', 
      count: metrics.whatsappRides, 
      icon: MessageCircle, 
      color: 'from-[#25D366] to-[#128C7E]',
      bgColor: 'bg-[#25D366]/10',
      textColor: 'text-[#25D366]'
    },
    { 
      name: 'Telefone', 
      count: metrics.phoneRides, 
      icon: Phone, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    { 
      name: 'Admin', 
      count: metrics.adminRides, 
      icon: Monitor, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500'
    }
  ];

  if (loading) {
    return (
      <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10">
        <CardContent className="p-6">
          <div className="text-center text-[#F2F2F2]/60">Carregando métricas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F2F2F2]">
            <Target className="w-5 h-5 text-[#F22998]" />
            Meta de Migração para App
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-5xl font-bold text-[#F22998]">{metrics.appPercentage}%</p>
                <p className="text-[#F2F2F2]/60">das corridas via App</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-[#F2F2F2]/80">{metrics.migrationGoal}%</p>
                <p className="text-[#F2F2F2]/60 text-sm">Meta</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-4 bg-[#0D0D0D]/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.appPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#BF3B79] to-[#F22998] rounded-full"
              />
              <div 
                className="absolute top-0 h-full w-0.5 bg-white/50"
                style={{ left: `${metrics.migrationGoal}%` }}
              />
            </div>

            <p className="text-[#F2F2F2]/60 text-sm">
              {metrics.appPercentage >= metrics.migrationGoal ? (
                '🎉 Meta atingida! Continue incentivando o uso do app.'
              ) : (
                `Faltam ${metrics.migrationGoal - metrics.appPercentage}% para atingir a meta`
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Source Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sourceData.map((source, index) => (
          <motion.div
            key={source.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10">
              <CardContent className="p-4">
                <div className={`w-12 h-12 rounded-xl ${source.bgColor} flex items-center justify-center mb-3`}>
                  <source.icon className={`w-6 h-6 ${source.textColor}`} />
                </div>
                <p className="text-2xl font-bold text-[#F2F2F2] mb-1">{source.count}</p>
                <p className="text-[#F2F2F2]/60 text-sm">{source.name}</p>
                <p className={`text-xs ${source.textColor} mt-1`}>
                  {metrics.totalRides > 0 
                    ? `${Math.round((source.count / metrics.totalRides) * 100)}%` 
                    : '0%'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 7-Day Trend */}
      <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F2F2F2]">
            <TrendingUp className="w-5 h-5 text-[#F22998]" />
            Tendência dos Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.trend.map((day, index) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-20 text-[#F2F2F2]/60 text-xs">
                  {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
                <div className="flex-1 relative h-8 bg-[#0D0D0D]/50 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${day.percentage}%` }}
                    transition={{ delay: index * 0.1 }}
                    className="h-full bg-gradient-to-r from-[#BF3B79] to-[#F22998] rounded-lg flex items-center justify-end pr-2"
                  >
                    {day.percentage > 15 && (
                      <span className="text-white text-xs font-semibold">{day.percentage}%</span>
                    )}
                  </motion.div>
                </div>
                <div className="w-24 text-right">
                  <p className="text-[#F2F2F2] text-sm font-semibold">{day.app}/{day.total}</p>
                  <p className="text-[#F2F2F2]/40 text-xs">corridas</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}