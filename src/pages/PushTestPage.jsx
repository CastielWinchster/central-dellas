import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { requestPermissionAndSaveToken, checkSupport } from '../components/firebase/pushService';

export default function PushTestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(false);
  const [sendingPush, setSendingPush] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      await checkToken(userData.id);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const checkToken = async (userId) => {
    setCheckingToken(true);
    try {
      const { db } = await import('../components/firebase/firebaseConfig');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const deviceRef = doc(db, 'user_devices', `${userId}_web`);
      const deviceSnap = await getDoc(deviceRef);
      
      setHasToken(deviceSnap.exists());
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      setHasToken(false);
    } finally {
      setCheckingToken(false);
    }
  };

  const handleRequestPermission = async () => {
    if (!user) return;
    
    try {
      const token = await requestPermissionAndSaveToken(user.id);
      if (token) {
        toast.success('Permissão concedida e token salvo!');
        setHasToken(true);
      } else {
        toast.error('Não foi possível obter o token');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao solicitar permissão');
    }
  };

  const handleSendTestPush = async () => {
    if (!user) return;
    
    setSendingPush(true);
    try {
      const response = await base44.functions.invoke('notifyUser', {
        toUserId: user.id,
        type: 'system',
        title: '🔔 Push de Teste',
        body: 'Se você está vendo isso, seu push notification está funcionando!',
        data: { test: true }
      });

      console.log('Resposta:', response.data);

      if (response.data.success) {
        toast.success(
          response.data.pushSent 
            ? 'Push enviado com sucesso!' 
            : 'Inbox criado (push não disponível)'
        );
      } else {
        toast.error('Erro ao enviar push');
      }
    } catch (error) {
      console.error('Erro ao enviar push:', error);
      toast.error('Erro ao enviar push de teste');
    } finally {
      setSendingPush(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isSupported = checkSupport();

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#F2F2F2] mb-2">
            🧪 Teste de Push Notifications
          </h1>
          <p className="text-[#F2F2F2]/60">
            Ambiente de desenvolvimento para testar notificações push
          </p>
        </div>

        <div className="space-y-4">
          {/* Status de Suporte */}
          <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#F2F2F2] mb-1">
                  Suporte do Navegador
                </h3>
                <p className="text-sm text-[#F2F2F2]/60">
                  {isSupported 
                    ? 'Push notifications são suportadas neste navegador' 
                    : 'Push notifications NÃO são suportadas neste navegador'}
                </p>
              </div>
              {isSupported ? (
                <Check className="w-8 h-8 text-green-400" />
              ) : (
                <X className="w-8 h-8 text-red-400" />
              )}
            </div>
          </Card>

          {/* Status do Token */}
          <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#F2F2F2] mb-1">
                  Token FCM
                </h3>
                <p className="text-sm text-[#F2F2F2]/60">
                  {checkingToken 
                    ? 'Verificando...' 
                    : hasToken 
                      ? 'Token registrado no Firestore' 
                      : 'Nenhum token registrado'}
                </p>
              </div>
              {checkingToken ? (
                <div className="w-6 h-6 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
              ) : hasToken ? (
                <Check className="w-8 h-8 text-green-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-yellow-400" />
              )}
            </div>
          </Card>

          {/* Ações */}
          <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20">
            <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">
              Ações de Teste
            </h3>
            
            <div className="space-y-3">
              {!hasToken && (
                <Button
                  onClick={handleRequestPermission}
                  disabled={!isSupported}
                  className="w-full bg-gradient-to-r from-[#BF3B79] to-[#F22998] hover:opacity-90"
                >
                  <Bell className="w-5 h-5 mr-2" />
                  Solicitar Permissão e Obter Token
                </Button>
              )}

              <Button
                onClick={handleSendTestPush}
                disabled={sendingPush}
                variant={hasToken ? "default" : "outline"}
                className={hasToken 
                  ? "w-full bg-gradient-to-r from-[#8C0D60] to-[#BF3B79]" 
                  : "w-full border-[#F22998]/30"}
              >
                {sendingPush ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5 mr-2" />
                    Enviar Push de Teste para Mim
                  </>
                )}
              </Button>

              <Button
                onClick={() => checkToken(user.id)}
                variant="outline"
                className="w-full border-[#F22998]/30"
              >
                Recarregar Status
              </Button>
            </div>
          </Card>

          {/* Informações */}
          <Card className="p-6 bg-[#1A1A1A]/50 border-[#F22998]/10">
            <h3 className="text-sm font-semibold text-[#F2F2F2]/70 mb-2">
              ℹ️ Como funciona
            </h3>
            <ul className="text-xs text-[#F2F2F2]/50 space-y-1">
              <li>• Notificação Inbox sempre é criada no Firestore</li>
              <li>• Push real só é enviado se houver token registrado</li>
              <li>• Token é salvo em: user_devices/{'{userId}_web'}</li>
              <li>• Notificações são salvas em: notifications</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}