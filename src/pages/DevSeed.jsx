import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle, XCircle, Loader2, 
  Users, MessageCircle, Car, ExternalLink, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const ALLOWED_EMAILS = ['dellasadvogadas@gmail.com', 'luishcosta3@gmail.com', 'rossideh77@gmail.com'];

export default function DevSeed() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    lastRequestPayload: null,
    lastResponse: null,
    lastError: null,
    timestamp: null,
    httpStatus: null,
    responseText: null,
    parsedJson: null
  });

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (!ALLOWED_EMAILS.includes(userData.email)) {
        setAuthorized(false);
        toast.error('Acesso negado: apenas desenvolvedores autorizados');
      } else {
        setAuthorized(true);
        await loadStatus();
      }
    } catch (error) {
      console.error('Erro ao verificar autorização:', error);
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await base44.functions.invoke('devSeed', { 
        action: 'get_status' 
      });
      setStatus(response.data);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      toast.error('Erro ao carregar status');
    }
  };

  const handleCreateUsers = async () => {
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('devSeed', { 
        action: 'create_users' 
      });
      
      console.log('Resultado:', response.data);
      
      toast.success('Verificação concluída! Veja os detalhes abaixo.');
      
      // Mostrar instruções de registro manual
      const needsRegistration = response.data.passenger?.credentials || response.data.driver?.credentials;
      if (needsRegistration) {
        alert(
          'INSTRUÇÕES DE REGISTRO:\n\n' +
          'Os usuários de teste precisam ser registrados manualmente:\n\n' +
          '1. Passageiro:\n' +
          '   Email: luishcosta3@gmail.com\n' +
          '   Senha: (definida por você)\n\n' +
          '2. Motorista:\n' +
          '   Email: rossideh77@gmail.com\n' +
          '   Senha: (definida por você)\n\n' +
          'Faça logout e registre cada um na tela de login correspondente.'
        );
      }
      
      await loadStatus();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar usuários: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateConversation = async () => {
    setProcessing(true);
    
    const payload = { 
      action: 'create_conversation',
      userAEmail: 'luishcosta3@gmail.com',
      userBEmail: 'rossideh77@gmail.com'
    };
    const timestamp = new Date().toISOString();
    
    console.log('🚀 START createChat', {
      timestamp,
      payload,
      functionName: 'devSeed'
    });
    
    setDebugInfo({
      lastRequestPayload: payload,
      lastResponse: null,
      lastError: null,
      timestamp,
      httpStatus: null,
      responseText: null,
      parsedJson: null
    });
    
    try {
      console.log('📡 Invocando base44.functions.invoke("devSeed", payload)...');
      
      const response = await base44.functions.invoke('devSeed', payload);
      
      console.log('📦 RESULT - HTTP Status:', response.status);
      console.log('📦 RESULT - Response Headers:', response.headers);
      console.log('📦 RESULT - Response.data:', response.data);
      console.log('📦 RESULT - Response completo:', response);
      
      // Capturar informações completas
      const httpStatus = response.status;
      const responseData = response.data;
      const responseText = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
      let parsedJson = null;
      
      try {
        parsedJson = typeof responseData === 'object' ? responseData : JSON.parse(responseData);
      } catch (parseErr) {
        console.warn('⚠️ Não foi possível parsear JSON:', parseErr);
      }
      
      setDebugInfo(prev => ({
        ...prev,
        lastResponse: parsedJson,
        httpStatus,
        responseText,
        parsedJson,
        timestamp: new Date().toISOString()
      }));
      
      if (parsedJson?.ok === true) {
        const { conversationId, messageId, senderId, receiverId, senderName, receiverName, context } = parsedJson;
        
        console.log('✅ SUCESSO!', {
          conversationId,
          messageId,
          sender: { id: senderId, name: senderName },
          receiver: { id: receiverId, name: receiverName },
          context
        });
        
        toast.success(`Chat criado! Mensagem "Oi" enviada de ${senderName} para ${receiverName}.`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadStatus();
        
      } else if (parsedJson?.ok === false) {
        const { message, stack, context } = parsedJson;
        
        console.error('❌ ERRO - ok:false', {
          message,
          stack,
          context
        });
        
        setDebugInfo(prev => ({
          ...prev,
          lastError: {
            message,
            stack,
            context
          }
        }));
        
        toast.error(`Erro: ${message}`);
        
      } else {
        console.warn('⚠️ Resposta sem campo "ok":', parsedJson);
        toast.warning('Resposta inesperada do servidor');
      }
      
    } catch (error) {
      console.error('💥 ERROR createChat - EXCEÇÃO capturada:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
        error
      });
      
      // Capturar detalhes do erro HTTP (se for erro axios/fetch)
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        fullError: error.toString(),
        httpStatus: error.response?.status || null,
        responseData: error.response?.data || null,
        responseText: error.response?.data ? JSON.stringify(error.response.data) : null
      };
      
      setDebugInfo(prev => ({
        ...prev,
        lastError: errorDetails,
        httpStatus: error.response?.status || null,
        responseText: errorDetails.responseText
      }));
      
      toast.error(`Erro ao criar chat: ${error.message}`);
      
    } finally {
      setProcessing(false);
      console.log('🏁 FIM createChat');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-[#1A1A1A] border-red-500/30 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Negado</h1>
          <p className="text-[#F2F2F2]/60 mb-4">
            Apenas desenvolvedores autorizados podem acessar esta página.
          </p>
          <p className="text-sm text-[#F2F2F2]/40 mb-6">
            Seu email: {user?.email}
          </p>
          <Link to={createPageUrl('PassengerHome')}>
            <Button className="w-full">Voltar</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#F2F2F2]">Dev Seed</h1>
              <p className="text-[#F2F2F2]/60">Ambiente de Desenvolvimento</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-[#F2F2F2]/40">
            <Shield className="w-4 h-4" />
            <span>Usuário autorizado: {user?.email}</span>
          </div>
        </motion.div>

        {/* Alerta de Segurança */}
        <Card className="p-4 mb-6 bg-red-500/10 border-red-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-200 font-medium">Ambiente Protegido</p>
              <p className="text-xs text-red-200/70 mt-1">
                Esta página cria dados de teste para desenvolvimento. Use apenas em ambiente de desenvolvimento.
              </p>
            </div>
          </div>
        </Card>

        {/* Status Atual */}
        {status && (
          <Card className="p-6 mb-6 bg-[#1A1A1A] border-[#F22998]/20">
            <h2 className="text-lg font-semibold text-[#F2F2F2] mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Status Atual
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0D0D0D]">
                <span className="text-[#F2F2F2]/70">Passageira de Teste</span>
                {status.users.passenger ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">Existe</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">Não existe</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0D0D0D]">
                <span className="text-[#F2F2F2]/70">Motorista de Teste</span>
                {status.users.driver ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">Existe</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">Não existe</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0D0D0D]">
                <span className="text-[#F2F2F2]/70">Chat entre Usuários</span>
                {status.conversation ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">Criado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">Não criado</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Ações */}
        <div className="space-y-4">
          <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F22998]/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-[#F22998]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#F2F2F2] mb-2">
                  1. Criar/Verificar Usuários de Teste
                </h3>
                <p className="text-sm text-[#F2F2F2]/60 mb-4">
                  Verifica se os usuários de teste existem. Se não existirem, você precisará registrá-los manualmente.
                </p>
                <Button
                  onClick={handleCreateUsers}
                  disabled={processing}
                  className="btn-gradient"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Verificar Usuários
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F22998]/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-[#F22998]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#F2F2F2] mb-2">
                  2. Criar Chat entre Usuários
                </h3>
                <p className="text-sm text-[#F2F2F2]/60 mb-4">
                  Cria/reutiliza conversa entre as contas e SEMPRE envia mensagem "Oi". Veja logs no console (F12).
                </p>
                <Button
                  onClick={handleCreateConversation}
                  disabled={processing || !status?.users.passenger || !status?.users.driver}
                  className="btn-gradient"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Criar Chat
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Debug Panel */}
          <Card className="p-6 bg-[#1A1A1A] border-yellow-500/30">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Painel de Debug
            </h3>
            
            <div className="space-y-3 text-xs">
              {/* Status Header com Version e Step */}
              {debugInfo.httpStatus && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  <div className={`px-3 py-1 rounded-full border ${
                    debugInfo.httpStatus === 200 
                      ? 'bg-green-500/20 border-green-500/30' 
                      : 'bg-red-500/20 border-red-500/30'
                  }`}>
                    <span className={`font-mono text-[10px] ${
                      debugInfo.httpStatus === 200 ? 'text-green-300' : 'text-red-300'
                    }`}>
                      HTTP {debugInfo.httpStatus}
                    </span>
                  </div>
                  {debugInfo.lastResponse?.version && (
                    <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                      <span className="text-purple-300 font-mono text-[10px]">
                        {debugInfo.lastResponse.version}
                      </span>
                    </div>
                  )}
                  {debugInfo.lastResponse?.step && (
                    <div className={`px-3 py-1 rounded-full border ${
                      debugInfo.lastResponse.ok 
                        ? 'bg-green-500/20 border-green-500/30' 
                        : 'bg-red-500/20 border-red-500/30'
                    }`}>
                      <span className={`font-mono text-[10px] ${
                        debugInfo.lastResponse.ok ? 'text-green-300' : 'text-red-300'
                      }`}>
                        step: {debugInfo.lastResponse.step}
                      </span>
                    </div>
                  )}
                  {debugInfo.lastResponse?.ok !== undefined && (
                    <div className={`px-3 py-1 rounded-full border ${
                      debugInfo.lastResponse.ok 
                        ? 'bg-green-500/20 border-green-500/30' 
                        : 'bg-red-500/20 border-red-500/30'
                    }`}>
                      <span className={`font-bold text-[10px] ${
                        debugInfo.lastResponse.ok ? 'text-green-300' : 'text-red-300'
                      }`}>
                        ok: {String(debugInfo.lastResponse.ok)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-[#F2F2F2]/60 mb-1">Timestamp:</p>
                <pre className="bg-[#0D0D0D] p-2 rounded text-green-400 overflow-x-auto">
                  {debugInfo.timestamp || 'Nenhuma ação ainda'}
                </pre>
              </div>

              <div>
                <p className="text-[#F2F2F2]/60 mb-1">HTTP Status:</p>
                <pre className="bg-[#0D0D0D] p-2 rounded text-cyan-300 overflow-x-auto">
                  {debugInfo.httpStatus !== null ? String(debugInfo.httpStatus) : 'null'}
                </pre>
              </div>

              <div>
                <p className="text-[#F2F2F2]/60 mb-1">Request Payload:</p>
                <pre className="bg-[#0D0D0D] p-2 rounded text-blue-300 overflow-x-auto">
                  {debugInfo.lastRequestPayload ? JSON.stringify(debugInfo.lastRequestPayload, null, 2) : 'null'}
                </pre>
              </div>

              <div>
                <p className="text-[#F2F2F2]/60 mb-1">Response Text (Raw):</p>
                <pre className="bg-[#0D0D0D] p-2 rounded text-yellow-300 overflow-x-auto max-h-40">
                  {debugInfo.responseText || 'null'}
                </pre>
              </div>

              <div>
                <p className="text-[#F2F2F2]/60 mb-1">Parsed JSON:</p>
                <pre className="bg-[#0D0D0D] p-2 rounded text-green-300 overflow-x-auto max-h-60">
                  {debugInfo.parsedJson ? JSON.stringify(debugInfo.parsedJson, null, 2) : 'null'}
                </pre>
              </div>

              {debugInfo.lastResponse?.ok === false && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm font-semibold text-red-400 mb-2">❌ Erro Detectado</p>
                  <div className="space-y-1 text-xs">
                    <p className="text-red-300">
                      <strong>Version:</strong> {debugInfo.lastResponse.version || 'N/A'}
                    </p>
                    <p className="text-red-300">
                      <strong>Step:</strong> {debugInfo.lastResponse.step || 'N/A'}
                    </p>
                    <p className="text-red-300">
                      <strong>Message:</strong> {debugInfo.lastResponse.message || 'N/A'}
                    </p>
                    {debugInfo.lastResponse.context && (
                      <div className="mt-2 p-2 rounded bg-[#0D0D0D]">
                        <p className="text-red-200 mb-1"><strong>Context:</strong></p>
                        <pre className="text-[10px] text-red-200 overflow-x-auto">
                          {JSON.stringify(debugInfo.lastResponse.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {debugInfo.lastResponse?.ok === true && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-sm font-semibold text-green-400 mb-2">✅ Sucesso</p>
                  <div className="space-y-1 text-xs">
                    <p className="text-green-300">
                      <strong>Conversation ID:</strong> {debugInfo.lastResponse.conversationId || 'N/A'}
                    </p>
                    <p className="text-green-300">
                      <strong>Message ID:</strong> {debugInfo.lastResponse.messageId || 'N/A'}
                    </p>
                    <p className="text-green-300">
                      <strong>Sender:</strong> {debugInfo.lastResponse.senderName || 'N/A'} ({debugInfo.lastResponse.senderId})
                    </p>
                    <p className="text-green-300">
                      <strong>Receiver:</strong> {debugInfo.lastResponse.receiverName || 'N/A'} ({debugInfo.lastResponse.receiverId})
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {status?.conversation && (
            <Card className="p-6 bg-[#1A1A1A] border-green-500/30">
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Chat Criado com Sucesso!
              </h3>
              
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-[#0D0D0D]">
                  <p className="text-sm text-[#F2F2F2]/60 mb-2">
                    Como acessar o chat:
                  </p>
                  <ol className="text-sm text-[#F2F2F2]/80 space-y-2 list-decimal list-inside">
                    <li>Faça login com uma das contas abaixo</li>
                    <li>Vá até a aba "Mensagens" no menu</li>
                    <li>A conversa estará disponível com notificação</li>
                    <li>Teste mensagens de texto, fotos e áudios</li>
                  </ol>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-blue-200">
                    <strong>Contas de Teste:</strong><br />
                    Passageiro: luishcosta3@gmail.com<br />
                    Motorista: rossideh77@gmail.com<br />
                    Senha: (definida por cada usuário)
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}