import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Paperclip, Camera, Image as ImageIcon } from 'lucide-react';
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !conversation) {
      initConversation();
    }
  }, [isOpen]);

  // Escutar evento para abrir chat e enviar código automaticamente
  useEffect(() => {
    const handleOpenWithCode = (event) => {
      const { codigo, telefone } = event.detail;
      
      // Abrir chat
      setIsOpen(true);
      
      // Aguardar um pouco e adicionar mensagem da Délia
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🎉 **Central Dellas**\n\nSeu código de verificação é:\n\n✅ **${codigo}**\n\n⏰ Válido por 10 minutos\n🔒 Não compartilhe este código!\n\nDigite esse código no campo de verificação para continuar seu cadastro.`,
          timestamp: new Date()
        }]);
      }, 500);
    };

    window.addEventListener('openChatWithCode', handleOpenWithCode);
    return () => window.removeEventListener('openChatWithCode', handleOpenWithCode);
  }, []);

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

  const handleFileSelect = async (file) => {
    if (!file || !conversation) return;

    // Validar tipo
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Apenas imagens (.jpg, .png, .jpeg) ou PDF');
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setUploadingFile(true);
    setIsTyping(true);

    try {
      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Adicionar mensagem do usuário com preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        const preview = e.target.result;
        
        // Adicionar mensagem com imagem
        setMessages(prev => [...prev, {
          role: 'user',
          content: file.type === 'application/pdf' ? '📄 Documento PDF enviado' : '',
          file_url: file_url,
          file_type: file.type,
          preview: file.type.startsWith('image/') ? preview : null,
          timestamp: new Date()
        }]);

        // Processar com Google Vision se for imagem
        if (file.type.startsWith('image/')) {
          toast.info('🔍 Analisando documento...');
          
          const visionResult = await analyzeDocumentWithVision(file_url);
          
          // Enviar resultado para o agente
          await base44.agents.addMessage(conversation, {
            role: 'user',
            content: `Analisei um documento. Resultado: ${visionResult.text || 'Não foi possível extrair texto'}`,
            file_urls: [file_url]
          });
        } else {
          // Se for PDF, apenas enviar ao agente
          await base44.agents.addMessage(conversation, {
            role: 'user',
            content: 'Enviei um documento PDF',
            file_urls: [file_url]
          });
        }
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
      setIsTyping(false);
    } finally {
      setUploadingFile(false);
    }
  };

  const analyzeDocumentWithVision = async (fileUrl) => {
    try {
      const imageResponse = await fetch(fileUrl);
      const imageBlob = await imageResponse.blob();
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result.split(',')[1]);
        };
        reader.readAsDataURL(imageBlob);
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const visionResponse = await fetch(
        'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAPH-bGo4FnzaXeA3onA1CtG_poSs01QH8',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64Image },
              features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
            }]
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      const data = await visionResponse.json();

      if (data.responses?.[0]?.textAnnotations) {
        return { text: data.responses[0].textAnnotations[0].description };
      }
      return { text: null };
    } catch (error) {
      console.error('Erro Vision API:', error);
      return { text: null };
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
            className="fixed bottom-6 right-6 md:bottom-6 md:right-6 z-[9999] w-16 h-16 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] shadow-2xl shadow-[#F22998]/50 flex items-center justify-center group"
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
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 z-[9999] w-auto md:w-96 h-[600px] max-h-[80vh] bg-[#0D0D0D] rounded-3xl shadow-2xl border border-[#F22998]/30 flex flex-col overflow-hidden"
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
                    {/* Preview de imagem */}
                    {message.preview && (
                      <img 
                        src={message.preview} 
                        alt="Documento" 
                        className="max-w-full max-h-48 rounded-lg mb-2 object-contain"
                      />
                    )}
                    {/* Ícone PDF */}
                    {message.file_type === 'application/pdf' && (
                      <div className="flex items-center gap-2 mb-2 bg-white/10 p-2 rounded-lg">
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-xs">Documento PDF</span>
                      </div>
                    )}
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
                {/* Inputs ocultos para arquivos */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />

                {/* Botão Arquivos */}
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping || uploadingFile}
                  variant="ghost"
                  size="icon"
                  className="text-[#F22998] hover:bg-[#F22998]/10 shrink-0"
                  title="Enviar arquivo"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>

                {/* Botão Câmera */}
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isTyping || uploadingFile}
                  variant="ghost"
                  size="icon"
                  className="text-[#F22998] hover:bg-[#F22998]/10 shrink-0"
                  title="Tirar foto"
                >
                  <Camera className="w-5 h-5" />
                </Button>

                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={uploadingFile ? "Enviando..." : "Digite sua mensagem..."}
                  className="flex-1 bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] placeholder:text-[#F2F2F2]/40 focus:border-[#F22998] text-sm"
                  disabled={isTyping || uploadingFile}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping || uploadingFile}
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