import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, AlertCircle, Check, X, Lock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TOLERANCE = 0.10; // ±10%
const MAX_ATTEMPTS = 3;
const BLOCK_MINUTES = 5;

export default function PriceValidationModal({ ride, offer, onValidated, onCancel }) {
  const [priceInput, setPriceInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockUntil, setBlockUntil] = useState(null);
  const [error, setError] = useState('');

  const isCustomPrice = ride?.is_custom_price || ride?.is_intercity;
  const systemPrice = ride?.agreed_price || ride?.estimated_price || 0;

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setPriceInput(''); return; }
    const decimal = (parseInt(raw) / 100).toFixed(2);
    setPriceInput(decimal.replace('.', ','));
    setError('');
  };

  const handleValidate = async () => {
    const price = parseFloat(priceInput.replace(',', '.'));
    if (!priceInput || isNaN(price) || price <= 0) {
      setError('Digite um valor válido');
      return;
    }

    // Verificar bloqueio ativo
    if (blocked && blockUntil && new Date() < blockUntil) {
      const remaining = Math.ceil((blockUntil - new Date()) / 60000);
      setError(`Aguarde ${remaining} minuto(s) antes de tentar novamente`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      let valid = false;
      let validationMsg = '';

      if (isCustomPrice) {
        // Corrida >35km: aceita qualquer valor (foi orçamento personalizado)
        valid = true;
        validationMsg = `Valor personalizado R$ ${price.toFixed(2)} confirmado`;
      } else {
        // Corrida normal: validar tolerância ±10%
        const min = systemPrice * (1 - TOLERANCE);
        const max = systemPrice * (1 + TOLERANCE);
        valid = price >= min && price <= max;

        if (!valid) {
          validationMsg = `Valor fora do esperado. Valor correto: R$ ${systemPrice.toFixed(2).replace('.', ',')} (±10%)`;
        }
      }

      if (valid) {
        // Salvar validação no banco
        await base44.entities.Ride.update(ride.id, {
          driver_confirmed_price: price,
          price_validation_attempts: (ride.price_validation_attempts || 0) + 1,
          price_validated_at: new Date().toISOString(),
        });
        toast.success('✅ Valor confirmado!');
        onValidated(price);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        // Registrar tentativa no banco
        await base44.entities.Ride.update(ride.id, {
          price_validation_attempts: (ride.price_validation_attempts || 0) + 1,
        });

        if (newAttempts >= MAX_ATTEMPTS) {
          const until = new Date(Date.now() + BLOCK_MINUTES * 60 * 1000);
          setBlocked(true);
          setBlockUntil(until);
          setError(`❌ 3 tentativas incorretas. Aguarde ${BLOCK_MINUTES} minutos.`);
          // Notificar admin
          try {
            await base44.entities.Notification.create({
              user_id: 'admin',
              title: '⚠️ Tentativas de fraude detectadas',
              message: `Motorista tentou ${MAX_ATTEMPTS}x com valores incorretos na corrida ${ride.id}`,
              type: 'system',
              is_persistent: true,
            });
          } catch (e) {}
        } else {
          setError(`${validationMsg} (Tentativa ${newAttempts}/${MAX_ATTEMPTS})`);
        }
      }
    } catch (e) {
      console.error('[PriceValidation]', e);
      setError('Erro ao validar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const remainingAttempts = MAX_ATTEMPTS - attempts;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md"
          style={{ borderRadius: '24px 24px 0 0' }}
        >
          <div className="bg-[#1a1a2e] border-t-2 border-[#F22998] rounded-t-3xl sm:rounded-3xl p-6 space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F22998]/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#F22998]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Confirmar Valor da Corrida</h2>
                <p className="text-sm text-gray-400">
                  {isCustomPrice ? 'Corrida de longa distância — orçamento personalizado' : 'Digite o valor combinado com a passageira'}
                </p>
              </div>
            </div>

            {/* Info da corrida */}
            <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300 line-clamp-2">{ride?.pickup_text}</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F22998] mt-1 flex-shrink-0" />
                <span className="text-gray-300 line-clamp-2">{ride?.dropoff_text}</span>
              </div>
              {!isCustomPrice && (
                <div className="pt-2 border-t border-white/10 flex justify-between">
                  <span className="text-gray-400">Valor calculado:</span>
                  <span className="text-[#F22998] font-bold">R$ {systemPrice?.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {isCustomPrice && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-yellow-400 text-xs">⚠️ Corrida acima de 35km — aceita o valor negociado</span>
                </div>
              )}
            </div>

            {/* Input de valor */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Valor combinado com a passageira:</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceInput}
                  onChange={handlePriceChange}
                  placeholder="0,00"
                  disabled={blocked}
                  className="w-full bg-[#0D0D0D] text-white text-2xl font-bold pl-14 pr-4 py-4 rounded-xl border-2 border-white/10 focus:border-[#F22998] outline-none transition disabled:opacity-40"
                  autoFocus
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-xl bg-red-900/30 border border-red-600/40"
              >
                {blocked ? <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Tentativas restantes */}
            {!isCustomPrice && attempts > 0 && !blocked && (
              <p className="text-xs text-yellow-400 text-center">
                ⚠️ {remainingAttempts} tentativa{remainingAttempts !== 1 ? 's' : ''} restante{remainingAttempts !== 1 ? 's' : ''} antes do bloqueio temporário
              </p>
            )}

            {/* Ações */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onCancel}
                variant="outline"
                className="py-5 rounded-2xl border-white/20 text-gray-400 hover:text-white hover:border-white/40"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleValidate}
                disabled={loading || blocked || !priceInput}
                className="py-5 rounded-2xl btn-gradient"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Validando...
                  </span>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Este valor será registrado para auditoria.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}