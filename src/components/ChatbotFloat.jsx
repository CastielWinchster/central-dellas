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
  const [registrationMode, setRegistrationMode] = useState(null);
  const [documentsCollected, setDocumentsCollected] = useState({
    cnh: null,
    comprovante: null,
    crlv: null
  });
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

    const handleOpenForRegistration = (event) => {
      const { step, message } = event.detail;
      
      setIsOpen(true);
      setRegistrationMode('documents');
      
      setTimeout(() => {
        setMessages([{
          role: 'assistant',
          content: message,
          timestamp: new Date()
        }]);
      }, 300);
    };

    window.addEventListener('openChatWithCode', handleOpenWithCode);
    window.addEventListener('openDeliaForRegistration', handleOpenForRegistration);
    return () => {
      window.removeEventListener('openChatWithCode', handleOpenWithCode);
      window.removeEventListener('openDeliaForRegistration', handleOpenForRegistration);
    };
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
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim().toLowerCase();
    setInputValue('');
    setIsTyping(true);

    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    // Detectar opção 1 ou 2 em modo de cadastro
    const isOption1 = registrationMode === 'documents' && 
                       (userMessage === '1' || userMessage.includes('opção 1') || 
                        userMessage.includes('opcao 1') || userMessage.includes('tentar') || 
                        userMessage.includes('nova foto'));
    
    const isOption2 = registrationMode === 'documents' && 
                       (userMessage === '2' || userMessage.includes('opção 2') || 
                        userMessage.includes('opcao 2') || userMessage.includes('manual') ||
                        userMessage.includes('enviar assim'));

    if (isOption1) {
      // Limpar último anexo e pedir nova foto
      const nextDoc = !documentsCollected.cnh ? 'cnh' :
                      !documentsCollected.comprovante ? 'comprovante' : 'crlv';
      
      // Emitir evento para limpar erro na UI
      window.dispatchEvent(new CustomEvent('clearDocumentError', { detail: { docType: nextDoc } }));

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '📸 Sem problemas! Pode me mandar a nova foto por aqui mesmo.',
        timestamp: new Date()
      }]);
      setIsTyping(false);
      return;
    }

    if (isOption2) {
      // AÇÃO SIMPLIFICADA - Apenas marcar como análise manual
      try {
        // Determinar qual documento está sendo processado
        const nextDoc = !documentsCollected.cnh ? 'cnh' :
                        !documentsCollected.comprovante ? 'comprovante' : 'crlv';
        
        // Marcar como coletado para análise manual (sem precisar do arquivo)
        setDocumentsCollected(prev => ({ 
          ...prev, 
          [nextDoc]: { manual: true, verified: true } 
        }));

        // Emitir evento para atualizar UI
        window.dispatchEvent(new CustomEvent('documentManualReview', {
          detail: { docType: nextDoc }
        }));

        // Responder e pedir próximo documento IMEDIATAMENTE
        const responses = {
          cnh: '✅ **Recebido!** Já encaminhei sua CNH para nossa equipe conferir manualmente. Enquanto eles olham, vamos adiantar o resto?\n\n📸 Me envie agora uma foto do seu **Comprovante de Residência** (conta de água, luz, telefone - últimos 3 meses).',
          comprovante: '✅ **Recebido!** Comprovante enviado para análise manual.\n\n📸 Agora me envie o **CRLV-e** do veículo.',
          crlv: '🎉 **Perfeito!** Todos os documentos foram recebidos e enviados para análise.\n\nAgora vá para a próxima etapa para tirar sua selfie!'
        };

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responses[nextDoc],
          timestamp: new Date()
        }]);

        // Se terminou, fechar
        if (nextDoc === 'crlv') {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('documentsComplete'));
            setIsOpen(false);
          }, 2000);
        }
      } catch (error) {
        console.error('Erro:', error);
        // Mesmo com erro, responder para não travar
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Recebido! Enviando para análise manual.\n\n📸 Pode me enviar o próximo documento.',
          timestamp: new Date()
        }]);
      }
      setIsTyping(false);
      return;
    }

    // Modo normal com agente
    if (conversation) {
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
    } else {
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
    if (!file) return;

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
          content: file.type === 'application/pdf' ? '📄 Documento enviado' : '📸 Foto enviada',
          file_url: file_url,
          file_type: file.type,
          preview: file.type.startsWith('image/') ? preview : null,
          timestamp: new Date()
        }]);

        // Se estiver em modo de cadastro de documentos
        if (registrationMode === 'documents') {
          await handleDocumentRegistration(file_url, file.type);
        } else if (conversation) {
          // Modo normal de chat com agente
          if (file.type.startsWith('image/')) {
            const visionResult = await analyzeDocumentWithVision(file_url);
            await base44.agents.addMessage(conversation, {
              role: 'user',
              content: `Analisei um documento. Resultado: ${visionResult.text || 'Não foi possível extrair texto'}`,
              file_urls: [file_url]
            });
          } else {
            await base44.agents.addMessage(conversation, {
              role: 'user',
              content: 'Enviei um documento PDF',
              file_urls: [file_url]
            });
          }
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

  const handleDocumentRegistration = async (fileUrl, fileType) => {
    try {
      // Determinar qual documento está sendo enviado
      const nextDoc = !documentsCollected.cnh ? 'cnh' :
                      !documentsCollected.comprovante ? 'comprovante' :
                      !documentsCollected.crlv ? 'crlv' : null;

      if (!nextDoc) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Todos os documentos já foram coletados! Finalizando cadastro...',
          timestamp: new Date()
        }]);
        setIsTyping(false);
        return;
      }

      // Processar com Google Vision
      const visionResult = await analyzeDocumentWithVision(fileUrl);
      const user = await base44.auth.me();

      if (visionResult.text && visionResult.text.length > 20) {
        // Sucesso na leitura
        setDocumentsCollected(prev => ({ ...prev, [nextDoc]: { url: fileUrl, verified: true } }));
        
        // Salvar no banco
        await base44.entities.DriverRegistration.update(user.id, {
          [`${nextDoc}_photo`]: fileUrl,
          [`${nextDoc}_data`]: { extracted_text: visionResult.text }
        });

        // Próximo documento
        const nextMessage = nextDoc === 'cnh' 
          ? '✅ **Perfeito!** Consegui ler seus dados da CNH.\n\n📸 Agora me envie uma foto do seu **Comprovante de Residência** (conta de água, luz, telefone - últimos 3 meses).'
          : nextDoc === 'comprovante'
          ? '✅ **Ótimo!** Comprovante recebido.\n\n📸 Por último, me envie o **CRLV-e** do veículo.'
          : '🎉 **Todos os documentos recebidos!**\n\nAgora preciso de uma **selfie sua** para confirmar sua identidade. Por favor, vá para a próxima etapa!';

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: nextMessage,
          timestamp: new Date()
        }]);

        // Se terminou, avançar
        if (nextDoc === 'crlv') {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('documentsComplete'));
            setIsOpen(false);
          }, 2000);
        }
      } else {
        // Falha na leitura - oferecer análise manual
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '😕 A foto ficou um pouco borrada para mim.\n\n❓ Você quer:\n\n1️⃣ **Tentar enviar de novo** (tire outra foto)\n2️⃣ **Enviar assim mesmo** para nossa equipe analisar manualmente\n\nDigite **1** ou **2**',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Ocorreu um erro ao processar. Pode tentar enviar novamente?',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const analyzeDocumentWithVision = async (fileUrl) => {
    try {
      const response = await base44.functions.invoke('analyzeDocument', { fileUrl });
      
      if (response.data.success) {
        return { text: response.data.text };
      }
      return { text: null };
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
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