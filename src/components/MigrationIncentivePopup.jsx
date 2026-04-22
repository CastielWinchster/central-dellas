import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function MigrationIncentivePopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [promoData, setPromoData] = useState(null); // { code, discount }

  useEffect(() => {
    // Buscar cupom ativo mais recente do banco
    const fetchActivePromo = async () => {
      try {
        const active = await base44.entities.PromoCode.filter(
          { is_active: true },
          '-created_date',
          1
        );
        if (active.length > 0) {
          const p = active[0];
          const discount = p.discount_amount
            ? `R$ ${Number(p.discount_amount).toFixed(2)} OFF`
            : p.discount_percentage
            ? `${p.discount_percentage}% OFF`
            : 'desconto especial';
          setPromoData({ code: p.code, discount });
        }
      } catch (error) {
        console.error('[MigrationPopup] Erro ao buscar cupom:', error);
      }
    };
    fetchActivePromo();
  }, []);

  useEffect(() => {
    // Só mostrar se houver cupom ativo
    if (!promoData) return;

    // Verificar se já viu o popup hoje
    const lastShown = localStorage.getItem('migrationPopupLastShown');
    const today = new Date().toDateString();
    
    if (lastShown !== today) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        localStorage.setItem('migrationPopupLastShown', today);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [promoData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promoData?.code || '');
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const message = `🚗 Central Dellas - App exclusivo para mulheres!

Use o código ${promoData?.code} e ganhe ${promoData?.discount} na próxima corrida!

Baixe agora: ${window.location.origin}`;

    if (navigator.share) {
      navigator.share({
        title: 'Central Dellas - Cupom exclusivo',
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
                  Cupom disponível! 🎁
                </h3>
                <p className="text-[#F2F2F2]/70 mb-6">
                  Use este código e ganhe <span className="text-[#F22998] font-bold">{promoData?.discount}</span> na sua próxima corrida!
                </p>

                {/* Promo code box */}
                <div className="bg-[#F22998]/10 border-2 border-[#F22998]/30 rounded-xl p-4 mb-4">
                  <p className="text-[#F2F2F2]/60 text-sm mb-2">Código promocional:</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold text-[#F22998] tracking-wider">
                      {promoData?.code}
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
                  ✨ Use no app ao solicitar sua corrida
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