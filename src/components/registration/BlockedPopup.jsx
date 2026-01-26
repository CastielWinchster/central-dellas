import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BlockedPopup({ blockedUntil, onClose }) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isBlocked, setIsBlocked] = useState(true);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const blockEnd = new Date(blockedUntil);
      const diff = blockEnd - now;

      if (diff <= 0) {
        setIsBlocked(false);
        setTimeRemaining('');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [blockedUntil]);

  if (!isBlocked) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0D0D0D] border-2 border-green-500/30 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-green-400">
                Bloqueio Expirado!
              </h2>
              <p className="text-[#F2F2F2]/70">
                Você pode tentar se cadastrar novamente agora.
              </p>
              <Button
                onClick={onClose}
                className="w-full btn-gradient py-6 text-lg"
              >
                Continuar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#0D0D0D] border-2 border-red-500/30 rounded-2xl p-8 max-w-md w-full"
        >
          <div className="text-center space-y-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center"
            >
              <AlertCircle className="w-10 h-10 text-red-400" />
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">
                Limite de Tentativas Excedido
              </h2>
              <p className="text-[#F2F2F2]/70">
                Você atingiu o máximo de 5 tentativas de cadastro. Por favor, aguarde para tentar novamente.
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-red-400" />
                <span className="text-[#F2F2F2]/60 text-sm">Tempo Restante:</span>
              </div>
              <motion.div
                key={timeRemaining}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-5xl font-bold text-red-400 font-mono"
              >
                {timeRemaining}
              </motion.div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-[#F2F2F2]/50">
                💡 <strong>Dica:</strong> Certifique-se de ter todos os documentos necessários prontos antes de tentar novamente.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}