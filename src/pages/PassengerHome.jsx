import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  MapPin, Navigation, Car, Shield, Users, Star, 
  ChevronRight, Clock, Sparkles, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/components/AuthProvider';

export default function PassengerHome() {
  const navigate = useNavigate();
  const { user } = useAuthUser();

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
        
        <style>{`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .animated-gradient-text {
            background: linear-gradient(135deg, #BF3B79 0%, #F22998 25%, #8C0D60 50%, #BF3B79 75%, #F22998 100%);
            background-size: 300% 300%;
            animation: gradientMove 8s ease infinite;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          @keyframes floatSubtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
          
          .float-subtle {
            animation: floatSubtle 3s ease-in-out infinite;
          }
          
          .logo-glass {
            background: rgba(13, 13, 13, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(242, 41, 152, 0.05);
          }
        `}</style>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20 w-full">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left fade-in-up"
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
                <span className="animated-gradient-text">
                  segura e elegante
                </span>
              </h1>
              
              <p className="text-[#F2F2F2]/60 text-lg mb-8 max-w-md mx-auto md:mx-0">
                A Central Dellas conecta mulheres que dirigem com mulheres que precisam de uma carona segura.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button 
                  onClick={() => {
                    if (user) {
                      navigate(createPageUrl('RequestRide'));
                    } else {
                      navigate(createPageUrl('PassengerLogin'));
                    }
                  }}
                  className="w-full sm:w-auto btn-gradient text-white px-8 py-6 rounded-2xl text-lg font-semibold glow-pink"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Solicitar Corrida
                </Button>
                <Button 
                  onClick={() => {
                    document.getElementById('seja-motorista-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="outline" 
                  className="w-full sm:w-auto border-[#F22998]/30 text-[#F22998] hover:bg-white hover:text-[#BF3B79] px-8 py-6 rounded-2xl text-lg transition-all"
                >
                  <Car className="w-5 h-5 mr-2" />
                  Seja Motorista
                </Button>
              </div>
            </motion.div>

            {/* Right: Logos */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative hidden md:flex flex-col items-center justify-center gap-4 py-8"
            >
              {/* Logo Central Dellas */}
              <div className="logo-glass rounded-3xl p-6 float-subtle">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ea008a15739746d55f4e/a971de28c_centraltranspa.png"
                  alt="Central Dellas"
                  className="w-56 h-auto object-contain"
                />
              </div>

              {/* Texto de Parceria */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-[#F2F2F2]/50 font-light tracking-wide"
              >
                Em parceria com
              </motion.p>

              {/* Logo Rotta Roza */}
              <div className="logo-glass rounded-3xl p-4 float-subtle" style={{ animationDelay: '1s' }}>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ea008a15739746d55f4e/1d47fa63e_Rota.png"
                  alt="Rotta Roza"
                  className="w-36 h-auto object-contain"
                />
              </div>
            </motion.div>
          </div>
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
          <h2 className="text-3xl font-bold text-[#F2F2F2] mb-4">Por que escolher a CentralDellas?</h2>
          <p className="text-[#F2F2F2]/60 max-w-lg mx-auto">
            Criamos um ambiente seguro para que mulheres possam se deslocarem pela cidade.
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

      {/* CTA Section - Seja Motorista */}
      <section id="seja-motorista-section" className="max-w-7xl mx-auto px-4 py-12">
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
            <Button 
              onClick={() => {
                if (user) {
                  navigate(createPageUrl('DriverRegistration'));
                } else {
                  navigate(createPageUrl('DriverLogin'));
                }
              }}
              className="bg-white text-[#BF3B79] hover:bg-white/90 px-8 py-6 rounded-2xl text-lg font-semibold"
            >
              Começar Agora
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>


    </div>
  );
}