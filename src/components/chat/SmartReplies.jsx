import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function SmartReplies({ lastMessage, onSelect }) {
  if (!lastMessage || lastMessage.sender_id === lastMessage.receiver_id) {
    return null;
  }

  const getReplies = () => {
    const content = lastMessage.content.toLowerCase();
    
    if (content.includes('cheg') || content.includes('a caminho')) {
      return ['Obrigada!', 'Qual é a placa?', 'Já vejo você'];
    }
    
    if (content.includes('destino') || content.includes('onde')) {
      return ['Endereço no mapa', 'Vou te passar', 'Já está no app'];
    }
    
    if (content.includes('quanto tempo') || content.includes('demora')) {
      return ['Sem pressa', 'Tá bom!', 'Obrigada'];
    }

    // Default replies
    return ['Obrigada!', 'Ok!', 'Tudo bem'];
  };

  const replies = getReplies();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="px-4 py-2 max-w-4xl mx-auto w-full"
      >
        <p className="text-xs text-[#F2F2F2]/40 mb-2">Respostas rápidas:</p>
        <div className="flex flex-wrap gap-2">
          {replies.map((reply, index) => (
            <Button
              key={index}
              onClick={() => onSelect(reply)}
              variant="outline"
              size="sm"
              className="border-[#F22998]/30 text-[#F2F2F2] hover:bg-[#F22998]/10 rounded-full"
            >
              {reply}
            </Button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}