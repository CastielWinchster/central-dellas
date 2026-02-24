import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Bell, ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PassengerNotifications() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const notifSettings = await base44.entities.NotificationSettings.filter({ user_id: userData.id });
      
      if (notifSettings.length > 0) {
        setSettings(notifSettings[0]);
      } else {
        // Criar com defaults
        const newSettings = await base44.entities.NotificationSettings.create({
          user_id: userData.id,
          ride_status: true,
          driver_on_way: true,
          driver_arrived: true,
          ride_completed: true,
          receipt: true,
          safety_alerts: true,
          marketing: false
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        base44.auth.redirectToLogin();
      } else {
        toast.error('Erro ao carregar dados');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key, value) => {
    try {
      await base44.entities.NotificationSettings.update(settings.id, { [key]: value });
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Preferência atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  const notificationGroups = [
    {
      title: '🚗 Corridas',
      items: [
        { key: 'ride_status', label: 'Status da corrida', description: 'Atualizações sobre sua corrida' },
        { key: 'driver_on_way', label: 'Motorista a caminho', description: 'Quando a motorista estiver chegando' },
        { key: 'driver_arrived', label: 'Motorista chegou', description: 'Quando a motorista chegar' },
        { key: 'ride_completed', label: 'Corrida finalizada', description: 'Quando a corrida for concluída' },
        { key: 'receipt', label: 'Recibo', description: 'Recebimento do recibo da corrida' }
      ]
    },
    {
      title: '🛡️ Segurança',
      items: [
        { key: 'safety_alerts', label: 'Alertas de segurança', description: 'Notificações importantes de segurança' }
      ]
    },
    {
      title: '📢 Marketing',
      items: [
        { key: 'marketing', label: 'Promoções e novidades', description: 'Ofertas especiais e atualizações' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('PassengerOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Notificações</h1>
        </div>

        {/* Info Card */}
        <Card className="p-4 mb-6 bg-blue-500/10 border-blue-500/30 rounded-2xl">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-200 font-medium">Notificações Push</p>
              <p className="text-xs text-blue-200/70 mt-1">
                As notificações in-app estão ativas. Você receberá alertas enquanto estiver usando o app.
              </p>
            </div>
          </div>
        </Card>

        {/* Notification Groups */}
        {notificationGroups.map((group, index) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-6"
          >
            <h3 className="text-xs font-bold text-[#BF3B79] mb-3 uppercase tracking-wider px-2">
              {group.title}
            </h3>
            <Card className="p-4 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl">
              <div className="space-y-4">
                {group.items.map((item, itemIndex) => (
                  <div
                    key={item.key}
                    className={`flex items-start justify-between p-3 rounded-xl bg-[#0D0D0D] ${
                      itemIndex !== group.items.length - 1 ? 'mb-2' : ''
                    }`}
                  >
                    <div className="flex-1 mr-4">
                      <p className="text-[#F2F2F2] font-medium">{item.label}</p>
                      <p className="text-sm text-[#F2F2F2]/50 mt-1">{item.description}</p>
                    </div>
                    <Switch
                      checked={settings?.[item.key] || false}
                      onCheckedChange={(v) => handleToggle(item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Coming Soon */}
        <Card className="p-4 bg-[#F22998]/10 border-[#F22998]/30 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#F22998] mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[#F2F2F2] font-medium">Em Breve</p>
              <p className="text-xs text-[#F2F2F2]/70 mt-1">
                Notificações via Email e SMS estarão disponíveis em breve para manter você informada de todas as formas.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}