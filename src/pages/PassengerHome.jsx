import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { 
  MapPin, Car, Shield,
  Sparkles, Heart, AlertTriangle,
  Eye, Phone, Package, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '../components/AuthGuard';
import WelcomeCouponModal from '../components/WelcomeCouponModal';

export default function PassengerHome() {
  const navigate = useNavigate();
  const { user } = useAuthUser();

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      {/* Modal de cupom 100% dinâmico — busca do banco automaticamente */}
      <WelcomeCouponModal />
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
                A Central Dellas conecta motoristas e passageiros, homens e mulheres, que buscam uma carona segura.
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

      {/* De mulher para mulher */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F2F2F2] mb-3">De mulher para todos</h2>        
          <h2 className="text-3xl md:text-4xl font-bold text-[#F2F2F2] mb-3">De mulher para mulher</h2>
          <p className="text-[#F2F2F2]/60 text-lg">
            Segurança, confiança e cuidado em cada trajeto.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: 'Segurança Real',
              description: 'Motoristas femininas e verificação rigorosa.'
            },
            {
              icon: Eye,
              title: 'Monitoramento em Tempo Real',
              description: 'Compartilhamento da corrida com contatos de confiança.'
            },
            {
              icon: AlertTriangle,
              title: 'Botão SOS',
              description: 'Acionamento imediato da central de segurança.'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-[#F2F2F2]/5 border border-[#F22998]/10 hover:border-[#F22998]/20 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F22998]/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[#F22998]" />
              </div>
              <h3 className="text-lg font-semibold text-[#F2F2F2] mb-2">{feature.title}</h3>
              <p className="text-[#F2F2F2]/60 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Segurança no App */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-[#F2F2F2] mb-6">Segurança no App</h2>
            <div className="space-y-4">
              {[
                {
                  icon: AlertTriangle,
                  title: 'Botão de Pânico',
                  text: 'Acionamento direto com a central de segurança em situações de emergência.'
                },
                {
                  icon: Phone,
                  title: 'Contato de Confiança',
                  text: 'Compartilhe sua corrida em tempo real via WhatsApp com quem você confia.'
                },
                {
                  icon: Eye,
                  title: 'Monitoramento Constante',
                  text: 'Todas as corridas são rastreadas e acompanhadas do início ao fim.'
                },
                {
                  icon: Shield,
                  title: 'Central de Suporte',
                  text: 'Equipe disponível 24/7 para qualquer necessidade durante sua viagem.'
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#F22998]/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-[#F22998]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F2F2F2] mb-1">{item.title}</h3>
                    <p className="text-[#F2F2F2]/60 text-sm">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 border border-[#F22998]/20 flex items-center justify-center">
              <div className="text-center p-8">
                <Shield className="w-24 h-24 text-[#F22998] mx-auto mb-4" />
                <p className="text-[#F2F2F2]/60">Sua segurança é nossa prioridade</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F2F2F2] mb-3">Como Funciona</h2>
          <p className="text-[#F2F2F2]/60">Soluções completas de mobilidade e entregas</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Car,
              title: 'Corridas Urbanas',
              description: 'Transporte seguro pela cidade com motoristas verificadas.'
            },
            {
              icon: Package,
              title: 'Entregas Rápidas',
              description: 'Pequenas encomendas entregues com agilidade e cuidado.'
            },
            {
              icon: Sparkles,
              title: 'Touca Higiênica (Para Motos)',
              description: 'Produto disponível para sua comodidade.'
            }
          ].map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-2xl bg-[#F2F2F2]/5 border border-[#F22998]/10"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#F2F2F2] mb-2">{service.title}</h3>
              <p className="text-[#F2F2F2]/60 text-sm">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}