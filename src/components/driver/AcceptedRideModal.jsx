import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, User, CreditCard } from 'lucide-react';

function formatPaymentMethod(method) {
  if (!method) return 'Não informado';
  if (method === 'cash') return 'Dinheiro';
  if (method === 'pix') return 'Pix';
  if (method === 'card' || method === 'credit_card') return 'Cartão de Crédito';
  return method;
}

export default function AcceptedRideModal({ acceptedRide, passengerUser, onClose, onStartRide, onOpenChat, onCancelRide }) {
  if (!acceptedRide) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10002] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#111118] rounded-3xl overflow-hidden shadow-2xl border border-[#F22998]/30"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#BF3B79] to-[#F22998] px-6 pt-6 pb-8 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-3 border-white overflow-hidden flex-shrink-0 bg-white/20 flex items-center justify-center" style={{ borderWidth: 3 }}>
                {passengerUser?.photo_url ? (
                  <img src={passengerUser.photo_url} alt={passengerUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Corrida Aceita! 🎉</h2>
                <p className="text-white/80 text-sm mt-0.5">{passengerUser?.full_name || 'Passageira'}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Endereços */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5">
                <div className="w-3 h-3 rounded-full bg-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Partida</p>
                  <p className="text-white text-sm leading-snug">{acceptedRide.pickup_text || acceptedRide.pickup_address || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5">
                <div className="w-3 h-3 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Destino</p>
                  <p className="text-white text-sm leading-snug">{acceptedRide.dropoff_text || acceptedRide.dropoff_address || '—'}</p>
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
              <CreditCard className="w-5 h-5 text-[#F22998] flex-shrink-0" />
              <div>
                <p className="text-xs text-white/40 mb-0.5">Pagamento</p>
                <p className="text-white text-sm">{formatPaymentMethod(acceptedRide.payment_method)}</p>
              </div>
              {acceptedRide.estimated_price && (
                <p className="ml-auto font-bold text-[#F22998]">R$ {Number(acceptedRide.estimated_price).toFixed(2)}</p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="px-6 pb-6 space-y-3">
            <button
              onClick={() => { onOpenChat(); onClose(); }}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              💬 Conversar com passageiro
            </button>
            <button
              onClick={onStartRide}
              className="w-full py-3.5 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              🗺️ Iniciar corrida
            </button>
            {onCancelRide && (
              <button
                onClick={onCancelRide}
                className="w-full py-3.5 rounded-2xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                ❌ Cancelar corrida
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl border border-white/10 text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}