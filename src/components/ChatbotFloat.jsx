import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ChatbotFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !conversation) {
      initConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initConversation = async () => {
    try {
      const newConversation = await base44.agents.createConversation({
        agent_name: 'gheni',
        metadata: {
          name: 'Chat com Delia',
          source: 'floating_chat'
        }
      });
      
      setConversation(newConversation);
      
      // Mensagem de boas-vindas
      setMessages([{
        role: 'assistant',
        content: 'Olá! 👋 Sou a **Delia**, sua assistente virtual da Central Dellas! 💖\n\nPosso te ajudar a:\n🚗 Agendar corridas\n💎 Conhecer nossos planos Clube Dellas\n🎁 Informar sobre promoções\n❓ Tirar dúvidas\n\nComo posso te ajudar hoje?',
        timestamp: new Date()
      }]);

      // Subscrever a atualizações
      base44.agents.subscribeToConversation(newConversation.id, (data) => {
        setMessages(data.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp || new Date()
        })));
        setIsTyping(false);
      });
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      toast.error('Erro ao conectar com Delia');
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !conversation) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 md:bottom-6 md:right-6 z-[85] w-16 h-16 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] shadow-2xl shadow-[#F22998]/50 flex items-center justify-center group"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
          >
            <div className="relative">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ea008a15739746d55f4e/a4506990a_vania.jpeg"
                alt="Delia"
                className="w-10 h-10 rounded-full object-cover"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
              />
            </div>
            <div className="absolute -top-2 -right-2 bg-[#F22998] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-3 h-3" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 z-[85] w-auto md:w-96 h-[600px] max-h-[80vh] bg-[#0D0D0D] rounded-3xl shadow-2xl border border-[#F22998]/30 flex flex-col overflow-hidden"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#BF3B79] to-[#F22998] p-4 flex items-center justify-center md:justify-start gap-3 relative">
              <div className="relative">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ea008a15739746d55f4e/a4506990a_vania.jpeg"
                  alt="Delia"
                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-white font-bold text-lg">Delia</h3>
                <p className="text-white/80 text-xs">Assistente Virtual • Online</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#0D0D0D] to-[#1a0a15]">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[#BF3B79] to-[#F22998] text-white'
                        : 'bg-[#F2F2F2]/10 text-[#F2F2F2]'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-white/60' : 'text-[#F2F2F2]/40'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#F2F2F2]/10 rounded-2xl p-4">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-[#F22998] rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-[#F22998] rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-[#F22998] rounded-full"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 md:p-4 bg-[#1a0a15] border-t border-[#F22998]/20">
              <div className="flex gap-2 items-center">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] placeholder:text-[#F2F2F2]/40 focus:border-[#F22998] text-sm"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-gradient-to-br from-[#BF3B79] to-[#F22998] hover:opacity-90 transition-opacity shrink-0"
                  size="icon"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-[#F2F2F2]/40 text-xs text-center mt-2">
                Delia pode cometer erros. Verifique informações importantes.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}