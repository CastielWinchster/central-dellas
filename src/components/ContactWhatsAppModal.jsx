import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Phone, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const WHATSAPP_NUMBER = '5516994465137';

export default function ContactWhatsAppModal({
  isOpen,
  onClose,
  distance,
  pickupCity,
  dropoffCity,
  savedPrice = null,
  onPriceSubmit
}) {
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const message = encodeURIComponent(
    `Olá! Gostaria de solicitar uma corrida de longa distância:\n\n📍 ${pickupCity || 'Origem'} → ${dropoffCity || 'Destino'}\n📏 Distância: ${Math.round(distance || 0)}km\n\nPodem me passar um orçamento?`
  );

  const handleOpenWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    setTimeout(() => setShowPriceInput(true), 1000);
  };

  const handleCall = () => {
    window.location.href = `tel:+${WHATSAPP_NUMBER}`;
    setTimeout(() => setShowPriceInput(true), 1000);
  };

  const handlePriceChange = (e) => {
    const numbers = e.target.value.replace(/\D/g, '');
    if (!numbers) { setCustomPrice(''); return; }
    const decimal = (parseInt(numbers) / 100).toFixed(2);
    setCustomPrice(decimal.replace('.', ','));
  };

  const handleSubmitPrice = async () => {
    const price = parseFloat(customPrice.replace(',', '.'));
    if (!customPrice || isNaN(price)) { toast.error('Digite um valor válido'); return; }
    if (price < 50) { toast.error('Valor mínimo: R$ 50,00'); return; }
    if (price > 1500) { toast.error('Valor muito alto. Confirme com a Central.'); return; }
    setLoading(true);
    try {
      if (onPriceSubmit) await onPriceSubmit(price);
    } finally {
      setLoading(false);
    }
  };

  const handleUseSavedPrice = () => {
    if (onPriceSubmit) onPriceSubmit(savedPrice.custom_price, true);
  };

  const handleClose = () => {
    setShowPriceInput(false);
    setCustomPrice('');
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0D0D0D] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#F22998]/20 max-h-[90vh] overflow-y-auto"
          >
            <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
              <X size={22} />
            </button>

            <div className="flex justify-center mb-4">
              <div className="bg-[#F22998] rounded-full p-4">
                <MessageCircle size={30} className="text-white" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white text-center mb-2">Corrida de Longa Distância</h2>
            <p className="text-gray-400 text-center text-sm mb-4">
              Para corridas acima de <span className="text-[#F22998] font-semibold">35 km</span>, entre em contato para um orçamento personalizado.
            </p>

            {/* Info da rota */}
            <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10 text-sm space-y-1">
              {pickupCity && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Origem:</span>
                  <span className="text-white font-medium">{pickupCity}</span>
                </div>
              )}
              {dropoffCity && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Destino:</span>
                  <span className="text-white font-medium">{dropoffCity}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Distância:</span>
                <span className="text-[#F22998] font-bold">{Math.round(distance || 0)} km</span>
              </div>
            </div>

            {/* Preço salvo disponível */}
            {savedPrice && !showPriceInput && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-600/40 rounded-xl">
                <p className="text-xs text-green-400 font-semibold mb-1">✅ Orçamento salvo para esta rota</p>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-lg">R$ {savedPrice.custom_price.toFixed(2).replace('.', ',')}</span>
                  <button
                    onClick={handleUseSavedPrice}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    Usar este preço
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Usado {savedPrice.usage_count}x • {Math.round(savedPrice.distance_km)} km</p>
              </div>
            )}

            {!showPriceInput ? (
              <div className="space-y-3">
                <button onClick={handleOpenWhatsApp} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition">
                  <MessageCircle size={20} /> Consultar via WhatsApp
                </button>
                <button onClick={handleCall} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition">
                  <Phone size={20} /> Ligar Agora
                </button>
                <button onClick={() => setShowPriceInput(true)} className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-300 font-semibold py-3 rounded-xl transition">
                  <DollarSign size={20} /> Já recebi o orçamento
                </button>
                <button onClick={handleClose} className="w-full text-gray-500 hover:text-white py-2 transition text-sm">Cancelar</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-900/30 border border-blue-600/50 rounded-xl p-3">
                  <p className="text-sm text-blue-300 text-center">💡 Digite o valor combinado com a Central</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Valor combinado:</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customPrice}
                      onChange={handlePriceChange}
                      placeholder="0,00"
                      className="w-full bg-[#0D0D0D] text-white text-2xl font-bold pl-12 pr-4 py-3 rounded-xl border-2 border-[#F2F2F2]/10 focus:border-[#F22998] outline-none transition"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Ex: 150,00</p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handleSubmitPrice}
                    disabled={loading || !customPrice}
                    className="w-full bg-[#F22998] hover:bg-[#BF3B79] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
                  >
                    {loading ? 'Processando...' : 'Confirmar e Solicitar Corrida'}
                  </button>
                  <button onClick={() => setShowPriceInput(false)} className="w-full text-gray-400 hover:text-white py-2 transition text-sm">← Voltar</button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}