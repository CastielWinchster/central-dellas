import { motion, AnimatePresence } from 'framer-motion';
import { X, Car, MessageCircle, Bell } from 'lucide-react';

const TYPE_CONFIG = {
  ride:    { icon: Car,           color: 'from-pink-600 to-pink-900',  label: 'Corrida' },
  message: { icon: MessageCircle, color: 'from-blue-600 to-blue-900',  label: 'Mensagem' },
  default: { icon: Bell,          color: 'from-gray-700 to-gray-900',  label: 'Aviso' },
};

export default function NotificationToast({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.default;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={toast.toastId}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0,   scale: 1   }}
              exit={{   opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="pointer-events-auto"
            >
              <div className={`bg-gradient-to-r ${cfg.color} text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 border border-white/10`}>
                <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{toast.title || cfg.label}</p>
                  <p className="text-xs text-white/80 mt-0.5 line-clamp-2">{toast.message}</p>
                </div>
                <button
                  onClick={() => onDismiss(toast.toastId)}
                  className="text-white/60 hover:text-white flex-shrink-0 mt-0.5"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}