import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  MapPin, Navigation, Car, Shield, Users, Star, 
  ChevronRight, Clock, Sparkles, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PassengerHome() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Mulheres para mulheres. Viaje com tranquilidade.',
      gradient: 'from-[#BF3B79] to-[#F22998]'
    },
    {
      icon: Users,
      title: 'Carona Segura',
      description: 'Compartilhe sua corrida com outras passageiras.',
      gradient: 'from-[#F22998] to-[#8C0D60]'
    },
    {
      icon: Star,
      title: 'Motoristas Top',
      description: 'Apenas motoristas verificadas e bem avaliadas.',
      gradient: 'from-[#8C0D60] to-[#BF3B79]'
    }
  ];

  const quickActions = [
    { icon: MapPin, label: 'Para Casa', sublabel: 'Adicionar endereço' },
    { icon: Navigation, label: 'Para o Trabalho', sublabel: 'Adicionar endereço' },
    { icon: Clock, label: 'Agendar Corrida', sublabel: 'Programar horário' },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8C0D60]/30 via-[#0D0D0D] to-[#0D0D0D]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F22998]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#BF3B79]/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F22998]/10 border border-[#F22998]/30 mb-6"
              >
                <Heart className="w-4 h-4 text-[#F22998]" />
                <span className="text-sm text-[#F22998] font-medium">Feito por mulheres, para todos</span>
              </motion.div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-[#F2F2F2]">Sua mobilidade</span>
                <br />
                <span className="bg-gradient-to-r from-[#BF3B79] via-[#F22998] to-[#8C0D60] bg-clip-text text-transparent">
                  segura e elegante
                </span>
              </h1>
              
              <p className="text-[#F2F2F2]/60 text-lg mb-8 max-w-md mx-auto md:mx-0">
                A Central Dellas conecta mulheres que dirigem com mulheres que precisam de uma carona segura.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link to={createPageUrl('RequestRide')}>
                  <Button className="w-full sm:w-auto btn-gradient text-white px-8 py-6 rounded-2xl text-lg font-semibold glow-pink">
                    <MapPin className="w-5 h-5 mr-2" />
                    Solicitar Corrida
                  </Button>
                </Link>
                <Link to={createPageUrl('DriverDashboard')}>
                  <Button variant="outline" className="w-full sm:w-auto border-[#F22998]/30 text-[#F22998] hover:bg-transparent hover:shadow-[0_0_20px_rgba(242,41,152,0.6)] px-8 py-6 rounded-2xl text-lg transition-all">
                    <Car className="w-5 h-5 mr-2" />
                    Seja Motorista
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden md:block"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <div className="w-80 h-80 mx-auto rounded-full bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-64 h-64 rounded-full border-2 border-dashed border-[#F22998]/30 flex items-center justify-center"
                    >
                      <Car className="w-32 h-32 text-[#F22998]" />
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute top-10 right-10 p-3 rounded-xl glass-effect"
                >
                  <Star className="w-6 h-6 text-[#F22998]" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -15, 0], x: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                  className="absolute bottom-20 left-10 p-3 rounded-xl glass-effect"
                >
                  <Shield className="w-6 h-6 text-[#BF3B79]" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-2xl bg-[#F2F2F2]/5 border border-[#F22998]/10 hover:border-[#F22998]/30 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <action.icon className="w-5 h-5 text-[#F22998]" />
              </div>
              <p className="font-medium text-[#F2F2F2] text-sm">{action.label}</p>
              <p className="text-xs text-[#F2F2F2]/50">{action.sublabel}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold text-[#F2F2F2] mb-4">Por que escolher a Central Dellas?</h2>
          <p className="text-[#F2F2F2]/60 max-w-lg mx-auto">
            Criamos um ambiente exclusivo e seguro para mulheres se deslocarem pela cidade.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -5 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#BF3B79]/10 to-[#F22998]/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 rounded-3xl bg-[#F2F2F2]/5 border border-[#F22998]/10 hover:border-[#F22998]/30 transition-all">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#F2F2F2] mb-2">{feature.title}</h3>
                <p className="text-[#F2F2F2]/60">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#BF3B79] via-[#F22998] to-[#8C0D60]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
          
          <div className="relative px-8 py-12 md:py-16 text-center">
            <Sparkles className="w-12 h-12 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Seja uma motorista parceira
            </h2>
            <p className="text-white/80 max-w-lg mx-auto mb-8">
              Ganhe dinheiro extra com flexibilidade e segurança. Junte-se à nossa comunidade de motoristas mulheres.
            </p>
            <Link to={createPageUrl('DriverDashboard')}>
              <Button className="bg-white text-[#BF3B79] hover:bg-white/90 px-8 py-6 rounded-2xl text-lg font-semibold">
                Começar Agora
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '50K+', label: 'Corridas Realizadas' },
            { value: '10K+', label: 'Passageiras Ativas' },
            { value: '2K+', label: 'Motoristas Parceiras' },
            { value: '4.9', label: 'Avaliação Média' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 rounded-2xl bg-[#F2F2F2]/5 border border-[#F22998]/10"
            >
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#BF3B79] to-[#F22998] bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-[#F2F2F2]/60 text-sm mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}