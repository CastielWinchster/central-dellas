import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function MigrationIncentivePopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [promoCode, setPromoCode] = useState('LOADING...');

  useEffect(() => {
    // Buscar código promocional do backend ou configuração
    const fetchPromoCode = async () => {
      try {
        // Por enquanto, usar um código padrão
        // TODO: Implementar backend para gerenciar códigos promocionais dinamicamente
        setPromoCode('WHATSAPP10');
      } catch (error) {
        setPromoCode('ERRO');
      }
    };
    fetchPromoCode();
  }, []);

  useEffect(() => {
    // Verificar se já viu o popup hoje
    const lastShown = localStorage.getItem('migrationPopupLastShown');
    const today = new Date().toDateString();
    
    if (lastShown !== today) {
      // Mostrar depois de 3 segundos
      const timer = setTimeout(() => {
        setShowPopup(true);
        localStorage.setItem('migrationPopupLastShown', today);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const message = `🚗 Central Dellas - App exclusivo para mulheres!

Use o código ${promoCode} e ganhe 10% OFF na primeira corrida!

Baixe agora: ${window.location.origin}`;

    if (navigator.share) {
      navigator.share({
        title: 'Central Dellas - 10% OFF',
        text: message
      });
    } else {
      navigator.clipboard.writeText(message);
      toast.success('Mensagem copiada! Cole no WhatsApp');
    }
    
    setShowPopup(false);
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPopup(false)}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="max-w-md w-full bg-gradient-to-br from-[#0D0D0D] to-[#1a0a15] border-[#F22998]/30 p-6 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#F22998]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#BF3B79]/10 rounded-full blur-3xl" />

              {/* Close button */}
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F22998]/10 transition-colors"
              >
                <X className="w-5 h-5 text-[#F2F2F2]/60" />
              </button>

              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center shadow-lg shadow-[#F22998]/30">
                  <Gift className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  Ganhe 10% OFF!
                </h3>
                <p className="text-[#F2F2F2]/70 mb-6">
                  Compartilhe este código com suas amigas e ganhe desconto na próxima corrida!
                </p>

                {/* Promo code box */}
                <div className="bg-[#F22998]/10 border-2 border-[#F22998]/30 rounded-xl p-4 mb-4">
                  <p className="text-[#F2F2F2]/60 text-sm mb-2">Código promocional:</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold text-[#F22998] tracking-wider">
                      {promoCode}
                    </span>
                    <Button
                      onClick={handleCopy}
                      size="icon"
                      variant="ghost"
                      className="text-[#F22998] hover:bg-[#F22998]/20"
                    >
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-[#F2F2F2]/50 text-xs mb-6">
                  ✨ Válido na primeira corrida pelo app
                </p>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleShare}
                    className="flex-1 btn-gradient py-6 font-semibold shadow-lg shadow-[#F22998]/30"
                  >
                    Compartilhar
                  </Button>
                  <Button
                    onClick={() => setShowPopup(false)}
                    variant="outline"
                    className="flex-1 border-[#F22998]/30 text-[#F2F2F2] hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(242,41,152,0.6)] active:shadow-[0_0_30px_rgba(242,41,152,0.8)] transition-all"
                  >
                    Depois
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}