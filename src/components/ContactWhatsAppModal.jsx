import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Phone } from 'lucide-react';

const WHATSAPP_NUMBER = '5516991234567'; // ← Substituir pelo número real da CentralDellas

export default function ContactWhatsAppModal({ isOpen, onClose, distance }) {
  const message = encodeURIComponent(
    `Olá! Gostaria de solicitar uma corrida de longa distância (${Math.round(distance || 0)} km). Podem me ajudar?`
  );

  const handleOpenWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:+${WHATSAPP_NUMBER}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0D0D0D] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#F22998]/20"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <X size={22} />
            </button>

            <div className="flex justify-center mb-4">
              <div className="bg-[#F22998] rounded-full p-4">
                <MessageCircle size={30} className="text-white" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white text-center mb-2">
              Corrida de Longa Distância
            </h2>
            <p className="text-gray-400 text-center text-sm mb-5">
              Para corridas acima de{' '}
              <span className="text-[#F22998] font-semibold">35 km</span>, entre em contato
              conosco via WhatsApp para um orçamento personalizado!
            </p>

            <div className="bg-white/5 rounded-xl p-3 mb-5 text-center border border-white/10">
              <p className="text-xs text-gray-400">Distância estimada</p>
              <p className="text-3xl font-bold text-[#F22998]">{Math.round(distance || 0)} km</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleOpenWhatsApp}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
              >
                <MessageCircle size={20} />
                Abrir WhatsApp
              </button>
              <button
                onClick={handleCall}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
              >
                <Phone size={20} />
                Ligar Agora
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white py-2 text-sm transition"
              >
                Voltar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}