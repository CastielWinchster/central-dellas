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

const ALLOWED_EMAILS = ['dellasadvogadas@gmail.com'];

export default function DevSeed() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [authorized, setAuthorized] = useState(false);

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
          '1. Passageira:\n' +
          '   Email: passageira.teste@centraldellas.dev\n' +
          '   Senha: Central@12345\n\n' +
          '2. Motorista:\n' +
          '   Email: motorista.teste@centraldellas.dev\n' +
          '   Senha: Central@12345\n\n' +
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

  const handleCreateRideConversation = async () => {
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('devSeed', { 
        action: 'create_ride_conversation' 
      });
      
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        toast.success('Corrida e conversa criadas/verificadas com sucesso!');
      }
      
      await loadStatus();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar corrida/conversa: ' + error.message);
    } finally {
      setProcessing(false);
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
                <span className="text-[#F2F2F2]/70">Corrida de Teste</span>
                {status.ride ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">Criada</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">Não criada</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0D0D0D]">
                <span className="text-[#F2F2F2]/70">Conversa de Chat</span>
                {status.conversation ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">Criada</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">Não criada</span>
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
                  2. Criar Corrida + Conversa
                </h3>
                <p className="text-sm text-[#F2F2F2]/60 mb-4">
                  Cria uma corrida fake vinculando passageira e motorista, depois cria a conversa e mensagens iniciais.
                </p>
                <Button
                  onClick={handleCreateRideConversation}
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
                      <Car className="w-4 h-4 mr-2" />
                      Criar Corrida + Chat
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {status?.conversation && (
            <Card className="p-6 bg-[#1A1A1A] border-green-500/30">
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Chat Pronto para Testes
              </h3>
              
              <div className="space-y-3">
                <a
                  href={createPageUrl(`Chat?conversation=${status.conversation}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-between border-[#F22998]/30 hover:bg-[#F22998]/10">
                    <span>Abrir Chat (Nova Aba)</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>

                <div className="p-4 rounded-lg bg-[#0D0D0D]">
                  <p className="text-sm text-[#F2F2F2]/60 mb-2">
                    Para testar o chat entre passageira e motorista:
                  </p>
                  <ol className="text-sm text-[#F2F2F2]/80 space-y-2 list-decimal list-inside">
                    <li>Abra uma aba anônima e faça login como passageira</li>
                    <li>Abra outra aba anônima e faça login como motorista</li>
                    <li>Acesse "Mensagens" em cada uma e clique na conversa</li>
                    <li>Teste o envio de mensagens, fotos e áudios</li>
                  </ol>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-blue-200">
                    <strong>Credenciais:</strong><br />
                    Passageira: passageira.teste@centraldellas.dev<br />
                    Motorista: motorista.teste@centraldellas.dev<br />
                    Senha (ambos): Central@12345
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