import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WelcomeCouponModal() {
  const [show, setShow] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const active = await base44.entities.PromoCode.filter(
          { is_active: true },
          '-created_date',
          1
        );

        if (active.length === 0) return; // Sem cupom ativo → não mostra nada

        const c = active[0];

        // Verificar se usuário já viu este cupom específico
        const seenKey = `welcome_coupon_seen_${c.id}`;
        if (localStorage.getItem(seenKey)) return;

        setCoupon(c);
        // Pequeno delay para não aparecer imediatamente ao carregar
        setTimeout(() => setShow(true), 2000);
      } catch (e) {
        console.error('[WelcomeCouponModal] Erro ao buscar cupom:', e);
      }
    };

    fetchCoupon();
  }, []);

  const dismiss = () => {
    if (coupon) {
      localStorage.setItem(`welcome_coupon_seen_${coupon.id}`, 'true');
    }
    setShow(false);
  };

  const handleSave = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.code).catch(() => {});
      setCopied(true);
      localStorage.setItem(`welcome_coupon_seen_${coupon.id}`, 'true');
      toast.success(`Cupom ${coupon.code} copiado! Use ao solicitar sua corrida.`);
      setTimeout(() => { setCopied(false); setShow(false); }, 1500);
    }
  };

  if (!coupon) return null;

  // Formatar desconto para exibição
  const discountText = coupon.discount_amount
    ? `R$ ${Number(coupon.discount_amount).toFixed(2)} OFF`
    : coupon.discount_percentage
    ? `${coupon.discount_percentage}% OFF`
    : 'Desconto especial';

  const subtitleText = coupon.first_ride_only
    ? `${discountText} na sua primeira corrida`
    : discountText;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full bg-[#1a1a1a]/95 backdrop-blur-xl rounded-3xl border border-[#F22998]/30 overflow-hidden"
          >
            {/* Decoração de fundo */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#F22998]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#BF3B79]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Botão fechar */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#F22998]/10 hover:bg-[#F22998]/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-[#F22998]" />
            </button>

            <div className="relative z-10 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-[#F2F2F2] mb-2">
                Obrigada por apoiar nosso lançamento!
              </h2>

              {/* Card do cupom */}
              <div className="my-6 p-4 rounded-2xl bg-[#F22998]/10 border border-[#F22998]/30">
                <p className="text-sm text-[#F2F2F2]/60 mb-2">Cupom de Desconto</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-3xl font-bold text-[#F22998] tracking-wide">
                    {coupon.code.toUpperCase()}
                  </p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(coupon.code).catch(() => {}); toast.success('Código copiado!'); }}
                    className="p-1.5 rounded-lg bg-[#F22998]/20 hover:bg-[#F22998]/30 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-[#F22998]" />
                  </button>
                </div>
                <p className="text-lg text-[#F2F2F2] mt-2">{subtitleText}</p>
              </div>

              <p className="text-[#F2F2F2]/60 text-sm mb-6 italic">
                De mulher para mulher, sua segurança é nossa prioridade.
              </p>

              <Button
                onClick={handleSave}
                className="w-full btn-gradient py-6 rounded-2xl text-lg font-semibold"
              >
                {copied ? (
                  <><Check className="w-5 h-5 mr-2" /> Copiado!</>
                ) : (
                  <><Check className="w-5 h-5 mr-2" /> Salvar Cupom</>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}