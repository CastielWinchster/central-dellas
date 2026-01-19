import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatMessage({ message, isOwn, onReport }) {
  const [showReport, setShowReport] = useState(false);

  const formatTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    return msgDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderContent = () => {
    if (message.message_type === 'image') {
      return (
        <a 
          href={message.content} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <img 
            src={message.content} 
            alt="Imagem enviada" 
            className="max-w-full rounded-lg max-h-80 object-contain"
          />
        </a>
      );
    }

    if (message.message_type === 'audio') {
      const duration = message.metadata?.duration || 0;
      return (
        <div className="flex flex-col gap-2 min-w-[200px]">
          <audio 
            src={message.content} 
            controls 
            className="w-full"
            style={{ height: '40px' }}
          />
          {duration > 0 && (
            <span className="text-xs opacity-60">
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
      );
    }

    if (message.message_type === 'attachment') {
      return (
        <a 
          href={message.content} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 underline"
        >
          📎 Ver anexo
        </a>
      );
    }

    // Auto-detect URLs and make them clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-300"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
    >
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white'
              : 'bg-[#2A2A2A] text-[#F2F2F2]'
          } break-words`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderContent()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <p className={`text-xs ${isOwn ? 'text-[#F2F2F2]/50' : 'text-[#F2F2F2]/40'}`}>
            {formatTime(message.created_date)}
          </p>
          
          {isOwn && (
            <div className="flex items-center">
              {message.is_read ? (
                <div className="flex">
                  <Check className="w-3 h-3 text-blue-400" />
                  <Check className="w-3 h-3 text-blue-400 -ml-2" />
                </div>
              ) : (
                <Check className="w-3 h-3 text-[#F2F2F2]/50" />
              )}
            </div>
          )}

          {!isOwn && (
            <button
              onClick={() => setShowReport(!showReport)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Reportar mensagem"
            >
              <Flag className="w-3 h-3 text-red-400 hover:text-red-300" />
            </button>
          )}
        </div>

        {showReport && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1A1A1A] rounded-lg p-3 border border-[#F22998]/20 space-y-2"
          >
            <p className="text-xs text-[#F2F2F2]/60">Motivo do reporte:</p>
            {['Assédio', 'Spam', 'Conteúdo inapropriado'].map((reason) => (
              <Button
                key={reason}
                onClick={() => {
                  onReport(message.id, reason);
                  setShowReport(false);
                }}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[#F2F2F2] hover:bg-[#F22998]/10"
              >
                {reason}
              </Button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}