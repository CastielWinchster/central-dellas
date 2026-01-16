import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function KeyboardShortcutsHelp({ shortcuts }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-24 md:right-6 z-[86] w-14 h-14 rounded-full bg-[#F2F2F2]/10 backdrop-blur-sm border border-[#F22998]/30 shadow-lg flex items-center justify-center hover:bg-[#F22998]/20 transition-colors"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 176px)' }}
      >
        <Keyboard className="w-6 h-6 text-[#F22998]" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0D0D0D] border border-[#F22998]/30 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#F2F2F2]">Atalhos de Teclado</h3>
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5 text-[#F2F2F2]/60" />
                </button>
              </div>

              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-[#F2F2F2]/80">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd key={i} className="px-2 py-1 bg-[#F22998]/20 text-[#F22998] rounded text-xs font-mono">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}