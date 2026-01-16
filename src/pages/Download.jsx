import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Apple, Download as DownloadIcon, Chrome, Share2, Plus, CheckCircle, X, Zap, Wifi, Bell, Gauge } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Download() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    // Verificar se foi rejeitado recentemente
    const canShowPrompt = () => {
      const dismissed = localStorage.getItem('installPromptDismissed');
      if (!dismissed) return true;
      const daysSinceDismissal = (new Date() - new Date(parseInt(dismissed))) / (1000 * 60 * 60 * 24);
      return daysSinceDismissal > 7;
    };

    // Capturar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      
      if (canShowPrompt()) {
        setTimeout(() => setShowPrompt(true), 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar quando o app for instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setCanInstall(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      showManualInstructions();
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    } else {
      handleDismissPrompt();
    }
    
    setDeferredPrompt(null);
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', new Date().getTime().toString());
  };

  const showManualInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      alert('Para instalar no iOS:\n\n1. Toque no ícone de compartilhar (⬆️)\n2. Role para baixo e toque em "Adicionar à Tela de Início"\n3. Toque em "Adicionar"');
    } else if (isAndroid) {
      alert('Para instalar no Android:\n\n1. Toque no menu (⋮) no navegador Chrome\n2. Selecione "Instalar app"\n3. Confirme a instalação');
    } else {
      alert('Para instalar no computador:\n\n1. Clique no ícone de instalação na barra de endereços\n2. Ou use o menu do navegador e selecione "Instalar Central Dellas"');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#1a0a1a] to-[#0D0D0D] py-12 px-4">
      {/* Install Prompt Banner */}
      <AnimatePresence>
        {showPrompt && !isInstalled && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-0 right-0 z-50 px-4"
          >
            <div className="max-w-2xl mx-auto bg-gradient-to-r from-[#BF3B79] to-[#F22998] p-4 rounded-xl shadow-2xl border-2 border-[#F22998]/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    📱 Instale Central Dellas
                  </h3>
                  <p className="text-white/90 text-sm">
                    Acesso rápido, notificações e melhor performance. Instale agora na tela inicial do seu dispositivo.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={handleInstallClick}
                      className="bg-white text-[#F22998] hover:bg-white/90 font-semibold"
                    >
                      Instalar Agora
                    </Button>
                    <Button
                      onClick={handleDismissPrompt}
                      variant="outline"
                      className="border-white/50 text-white hover:bg-white/10"
                    >
                      Não, obrigado
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDismissPrompt}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <h1 className="text-4xl md:text-5xl font-bold text-[#F2F2F2] mb-4">
            Baixe Central Dellas
          </h1>
          <p className="text-[#F2F2F2]/70 text-xl mb-2">
            Sempre à mão. Em qualquer lugar.
          </p>
          {isInstalled && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full mt-4"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Central Dellas já está instalado!</span>
            </motion.div>
          )}
        </motion.div>

        {/* Main Install Card */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="p-8 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-[#BF3B79] to-[#F22998] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#F22998]/50">
                  <Chrome className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#F2F2F2] mb-4">
                  Instale Diretamente do Navegador
                </h2>
                <p className="text-[#F2F2F2]/70 text-lg mb-6">
                  Sem precisar de lojas de aplicativos. Instalação rápida e segura direto do seu navegador.
                </p>
                {canInstall ? (
                  <Button
                    onClick={handleInstallClick}
                    size="lg"
                    className="btn-gradient text-lg px-8 py-6 shadow-lg shadow-[#F22998]/30"
                  >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Instalar App Agora
                  </Button>
                ) : (
                  <Button
                    onClick={showManualInstructions}
                    size="lg"
                    variant="outline"
                    className="border-[#F22998] text-[#F22998] hover:bg-[#F22998]/10 text-lg px-8 py-6"
                  >
                    Ver Instruções de Instalação
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Installation Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="p-8 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30">
            <h2 className="text-2xl font-bold text-[#F2F2F2] mb-2 text-center">
              Como Instalar
            </h2>
            <p className="text-[#F2F2F2]/60 text-center mb-6">
              Instruções detalhadas por sistema operacional
            </p>

            <div className="space-y-6">
              {/* Chrome/Edge */}
              <div className="p-6 rounded-xl bg-[#F22998]/5 border border-[#F22998]/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#BF3B79] to-[#F22998] rounded-lg flex items-center justify-center">
                    <Chrome className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#F2F2F2]">Chrome / Edge (Android & Desktop)</h3>
                </div>
                <div className="space-y-3 ml-2">
                  {[
                    'Clique no ícone "⋮" (menu) no navegador',
                    'Toque em "Instalar app" ou "Instalar Central Dellas"',
                    'Confirme clicando em "Instalar"',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#F22998] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white font-bold">{i + 1}</span>
                      </div>
                      <p className="text-[#F2F2F2]/80 pt-0.5">{step}</p>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-[#F22998] text-sm mt-2 ml-9">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ou use o ícone de instalação na barra de endereços</span>
                  </div>
                </div>
              </div>

              {/* Safari iOS */}
              <div className="p-6 rounded-xl bg-[#F22998]/5 border border-[#F22998]/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#BF3B79] to-[#F22998] rounded-lg flex items-center justify-center">
                    <Apple className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#F2F2F2]">Safari (iPhone / iPad)</h3>
                </div>
                <div className="space-y-3 ml-2">
                  {[
                    { text: 'Clique no ícone "Compartilhar"', icon: <Share2 className="w-4 h-4 inline ml-1" /> },
                    { text: 'Role para baixo e toque em "Adicionar à Tela de Início"', icon: <Plus className="w-4 h-4 inline ml-1" /> },
                    { text: 'Nomeie como "Central Dellas"', icon: null },
                    { text: 'Clique "Adicionar"', icon: <CheckCircle className="w-4 h-4 inline ml-1" /> },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#F22998] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white font-bold">{i + 1}</span>
                      </div>
                      <p className="text-[#F2F2F2]/80 pt-0.5">
                        {step.text}
                        {step.icon}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Samsung/Firefox */}
              <div className="p-6 rounded-xl bg-[#F22998]/5 border border-[#F22998]/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#BF3B79] to-[#F22998] rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#F2F2F2]">Samsung Internet / Firefox</h3>
                </div>
                <div className="space-y-3 ml-2">
                  {[
                    'Clique no menu (⋮)',
                    'Selecione "Instalar aplicativo"',
                    'Confirme a instalação',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#F22998] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white font-bold">{i + 1}</span>
                      </div>
                      <p className="text-[#F2F2F2]/80 pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="p-8 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30">
            <h2 className="text-2xl font-bold text-[#F2F2F2] mb-6 text-center">
              Vantagens do App
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Zap, title: 'Acesso Rápido', desc: 'Abra direto da tela inicial do seu dispositivo' },
                { icon: Wifi, title: 'Funciona Offline', desc: 'Modo limitado disponível sem internet' },
                { icon: Bell, title: 'Notificações Push', desc: 'Receba atualizações em tempo real sobre suas corridas' },
                { icon: Gauge, title: 'Melhor Performance', desc: 'Carregamento ultrarrápido com cache local' },
                { icon: DownloadIcon, title: 'Tamanho Pequeno', desc: 'Muito menor que apps nativos tradicionais' },
                { icon: CheckCircle, title: 'Sempre Atualizado', desc: 'Receba as últimas funcionalidades automaticamente' },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-[#F22998]/5 border border-[#F22998]/10 hover:bg-[#F22998]/10 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#BF3B79] to-[#F22998] rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F2F2F2] mb-1">{benefit.title}</h3>
                    <p className="text-sm text-[#F2F2F2]/60">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Test Phase Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-gradient-to-r from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/50">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-12 h-12 bg-[#F22998] rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#F2F2F2] mb-1">
                  🚀 Fase de Testes Ativa
                </h3>
                <p className="text-[#F2F2F2]/70">
                  Instale o app e ajude-nos a torná-lo ainda melhor com seu feedback! Sua opinião é fundamental para construirmos a melhor experiência de mobilidade urbana.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        
        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="p-8 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30">
            <h2 className="text-2xl font-bold text-[#F2F2F2] mb-6 text-center">
              Perguntas Frequentes
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: '💾 Quanto espaço o app ocupa?',
                  a: 'Muito pouco! O app PWA ocupa apenas alguns MB, muito menos que apps nativos tradicionais.'
                },
                {
                  q: '🔒 É seguro instalar?',
                  a: 'Sim! O app é instalado diretamente do nosso site oficial com certificado de segurança SSL. Seus dados estão protegidos.'
                },
                {
                  q: '📶 Funciona offline?',
                  a: 'Sim! O app possui modo offline limitado. Você pode acessar algumas funcionalidades mesmo sem internet.'
                },
                {
                  q: '🔄 Como atualizar o app?',
                  a: 'As atualizações são automáticas! Sempre que abrimos o app, ele verifica e baixa a versão mais recente.'
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-4 rounded-xl bg-[#F22998]/5 border border-[#F22998]/10"
                >
                  <h3 className="font-semibold text-[#F2F2F2] mb-2">{faq.q}</h3>
                  <p className="text-[#F2F2F2]/70 text-sm">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}