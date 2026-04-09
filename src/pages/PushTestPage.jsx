import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function PushTestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingPush, setSendingPush] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).finally(() => setLoading(false));
  }, []);

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
      if (response.data?.success) {
        toast.success('Notificação enviada!');
      } else {
        toast.error('Erro ao enviar notificação');
      }
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#F2F2F2] mb-2">🧪 Teste de Notificações</h1>
          <p className="text-[#F2F2F2]/60">Ambiente de teste para notificações</p>
        </div>

        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20">
          <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Enviar Notificação de Teste</h3>
          <Button
            onClick={handleSendTestPush}
            disabled={sendingPush || !user}
            className="w-full bg-gradient-to-r from-[#BF3B79] to-[#F22998] hover:opacity-90"
          >
            {sendingPush ? (
              <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />Enviando...</>
            ) : (
              <><Bell className="w-5 h-5 mr-2" />Enviar Push de Teste para Mim</>
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}