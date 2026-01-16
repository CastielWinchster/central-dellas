import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Apple, Download as DownloadIcon, Chrome, Share2, Plus, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Download() {
  const [installedPWA, setInstalledPWA] = useState(false);

  const handleInstallPWA = () => {
    // Detectar se é iOS ou Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      alert('Para instalar no iOS:\n1. Toque no ícone de compartilhar (⬆️)\n2. Role para baixo e toque em "Adicionar à Tela de Início"\n3. Toque em "Adicionar"');
    } else if (isAndroid) {
      alert('Para instalar no Android:\n1. Toque no menu (⋮) no navegador\n2. Selecione "Adicionar à tela inicial"\n3. Toque em "Adicionar"');
    } else {
      alert('Para instalar no computador:\n1. Clique no ícone de instalação na barra de endereços\n2. Ou use o menu do navegador > "Instalar Central Dellas"');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#1a0a1a] to-[#0D0D0D] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#BF3B79] to-[#F22998] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#F22998]/50">
            <Smartphone className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#F2F2F2] mb-4">
            Baixe o App
            <span className="block mt-2 bg-gradient-to-r from-[#BF3B79] to-[#F22998] bg-clip-text text-transparent">
              Central Dellas
            </span>
          </h1>
          <p className="text-[#F2F2F2]/70 text-lg">
            Instale nosso aplicativo e tenha acesso rápido em qualquer momento
          </p>
        </motion.div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* PWA Install */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#BF3B79] to-[#F22998] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Chrome className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#F2F2F2] mb-2">
                    Instalação Rápida
                  </h3>
                  <p className="text-[#F2F2F2]/60 text-sm mb-4">
                    Instale o app diretamente do navegador sem precisar de loja de aplicativos
                  </p>
                  <Button
                    onClick={handleInstallPWA}
                    className="w-full btn-gradient"
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Instalar Agora
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* App Stores Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#BF3B79] to-[#F22998] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Apple className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#F2F2F2] mb-2">
                    App Stores
                  </h3>
                  <p className="text-[#F2F2F2]/60 text-sm mb-4">
                    Em breve disponível na App Store e Google Play
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled
                      variant="outline"
                      className="flex-1 border-[#F22998]/30 text-[#F2F2F2]/40"
                    >
                      <Apple className="w-4 h-4 mr-2" />
                      iOS
                    </Button>
                    <Button
                      disabled
                      variant="outline"
                      className="flex-1 border-[#F22998]/30 text-[#F2F2F2]/40"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Android
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Installation Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="p-8 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30">
            <h2 className="text-2xl font-bold text-[#F2F2F2] mb-6">
              Como instalar no seu dispositivo
            </h2>

            <div className="space-y-6">
              {/* iOS */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Apple className="w-6 h-6 text-[#F22998]" />
                  <h3 className="text-lg font-semibold text-[#F2F2F2]">iPhone / iPad</h3>
                </div>
                <div className="space-y-2 ml-9">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F22998]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-[#F22998] font-bold">1</span>
                    </div>
                    <p className="text-[#F2F2F2]/70">
                      Abra o site no Safari
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F22998]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-[#F22998] font-bold">2</span>
                    </div>
                    <p className="text-[#F2F2F2]/70">
                      Toque no ícone de compartilhar <Share2 className="w-4 h-4 inline" />
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F22998]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-[#F22998] font-bold">3</span>
                    </div>
                    <p className="text-[#F2F2F2]/70">
                      Role para baixo e selecione "Adicionar à Tela de Início" <Plus className="w-4 h-4 inline" />
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F22998]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-[#F22998] font-bold">4</span>
                    </div>
                    <p className="text-[#F2F2F2]/70">
                      Toque em "Adicionar" e pronto! <CheckCircle className="w-4 h-4 inline" />
                    </p>
                  </div>
                </div>
              </div>

              {/* Android */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Smartphone className="w-6 h-6 text-[#F22998]" />
                  <h3 className="text-lg font-semibold text-[#F2F2F2]">Android</h3>
                </div>
                <div className="space-y-2 ml-9">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F22998]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-[#F22998] font-bold">1</span>
                    </div>
                    <p className="text-[#F2F2F2]/70">
                      Abra o site no Chrome
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F22998]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-[#F22998] font-bold">2</span>
                    </div>
                    <p className="text-[#F2F2F2]/70">
                      Toque no menu (⋮) no canto superior direito
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F22998]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-[#F22998] font-bold">3</span>
                    </div>
                    <p className="text-[#F2F2F2]/70">
                      Selecione "Adicionar à tela inicial"
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F22998]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-[#F22998] font-bold">4</span>
                    </div>
                    <p className="text-[#F2F2F2]/70">
                      Toque em "Adicionar" e pronto! <CheckCircle className="w-4 h-4 inline" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-8 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30">
            <h2 className="text-2xl font-bold text-[#F2F2F2] mb-6">
              Vantagens do App
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: '⚡', title: 'Acesso Rápido', desc: 'Abra direto da tela inicial' },
                { icon: '📱', title: 'Experiência Completa', desc: 'Interface otimizada para mobile' },
                { icon: '🔔', title: 'Notificações', desc: 'Receba atualizações em tempo real' },
                { icon: '🚀', title: 'Performance', desc: 'Carregamento ultrarrápido' },
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-[#F22998]/5 border border-[#F22998]/10">
                  <div className="text-3xl">{benefit.icon}</div>
                  <div>
                    <h3 className="font-semibold text-[#F2F2F2] mb-1">{benefit.title}</h3>
                    <p className="text-sm text-[#F2F2F2]/60">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Test Phase Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="p-6 bg-gradient-to-r from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F22998] rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F2F2F2] mb-1">
                  Fase de Testes Ativa
                </h3>
                <p className="text-[#F2F2F2]/70 text-sm">
                  Instale o app e ajude-nos a torná-lo ainda melhor com seu feedback!
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}