import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { registerAllPushChannels, verifyPushRegistration } from '@/lib/pushRegistration';
import { clearPushKeysCache } from '@/lib/pushConfig';
import AdminPasswordGate from '@/components/admin/AdminPasswordGate';
import { unwrapInvoke } from '@/utils/invokeResponse';

export default function PushTestPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingPush, setSendingPush] = useState(false);
  const [diag, setDiag] = useState(null);

  const refreshDiag = async () => {
    const d = await verifyPushRegistration();
    setDiag(d);
    return d;
  };

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (!u || u.role !== 'admin') {
        navigate('/PassengerHome');
        return;
      }
      setUser(u);
    }).finally(() => setLoading(false));
    refreshDiag();
  }, [navigate]);

  const handleRegisterPush = async () => {
    clearPushKeysCache();
    const result = await registerAllPushChannels({ requestPermission: true });
    await refreshDiag();
    if (result.ok) toast.success('Push registrado!');
    else toast.error(`Falha: ${result.vapid.reason || result.fcmWeb.reason || 'desconhecido'}`);
  };

  const handleSendTestPush = async () => {
    if (!user) return;
    setSendingPush(true);
    try {
      const response = await base44.functions.invoke('sendPushToUser', {
        userId: user.id,
        type: 'ride_offer',
        title: '🚗 Teste — Nova corrida!',
        body: 'Feche o app agora. Se aparecer esta notificação, push funciona.',
        rideId: 'test-push',
        offerId: 'test-offer',
        url: '/DriverDashboard?from=push&rideId=test-push',
        persistent: true,
        skipInApp: true,
      });
      const data = unwrapInvoke(response);
      if (data?.success) {
        toast.success(`Push enviado via ${data.method}. Feche o app e veja se chega.`);
      } else {
        toast.error(`Push falhou: ${data?.error || 'erro'} — ${JSON.stringify(data?.details || [])}`);
      }
    } catch (error) {
      toast.error('Erro ao enviar push de teste');
    } finally {
      setSendingPush(false);
      refreshDiag();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F472B6] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AdminPasswordGate>
    <div className="min-h-screen bg-[#0D0D0D] p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F2F2F2] mb-2">Teste de Push (app fechado)</h1>
          <p className="text-[#F2F2F2]/60">Registre, envie teste e feche o app completamente.</p>
        </div>

        <Card className="p-6 bg-[#1A1A1A] border-[#F472B6]/20 space-y-3">
          <Button onClick={handleRegisterPush} variant="outline" className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" /> Registrar push neste dispositivo
          </Button>
          <Button
            onClick={handleSendTestPush}
            disabled={sendingPush || !user}
            className="w-full bg-gradient-to-r from-[#EC4899] to-[#F472B6]"
          >
            {sendingPush ? 'Enviando…' : <><Bell className="w-5 h-5 mr-2" />Enviar push de corrida (teste)</>}
          </Button>
        </Card>

        {diag && (
          <Card className="p-4 bg-[#1A1A1A] border-[#F472B6]/20 text-xs text-[#F2F2F2]/80 font-mono whitespace-pre-wrap">
            {JSON.stringify(diag, null, 2)}
          </Card>
        )}
      </div>
    </div>
    </AdminPasswordGate>
  );
}
