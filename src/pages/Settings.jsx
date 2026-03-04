import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Shield, Eye, Type, Contrast, MapPin, 
  Bell, LogOut, Trash2, ChevronLeft, FileText, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    share_location_during_rides_only: true,
    save_location_history: true,
    hide_photo_from_drivers: false
  });
  const [preferencesId, setPreferencesId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState('unknown');
  const [notificationPermission, setNotificationPermission] = useState('unknown');

  useEffect(() => {
    loadData();
    checkPermissions();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const prefs = await base44.entities.UserPreferences.filter({ user_id: userData.id });
      if (prefs && prefs.length > 0) {
        setPreferences(prev => ({ ...prev, ...prefs[0] }));
        setPreferencesId(prefs[0].id);
      }
    } catch (error) {
      console.error(error);
      if (error.message?.includes('401')) {
        base44.auth.redirectToLogin();
      } else {
        toast.error('Erro ao carregar dados');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    if (navigator.permissions) {
      try {
        const locPerm = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(locPerm.state);
      } catch (e) {
        setLocationPermission('unknown');
      }
    }
    
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const handlePreferenceToggle = async (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    
    try {
      if (preferencesId) {
        await base44.entities.UserPreferences.update(preferencesId, { [key]: value });
      } else {
        const created = await base44.entities.UserPreferences.create({
          user_id: user.id,
          [key]: value
        });
        setPreferencesId(created.id);
        setPreferences(created);
      }
      toast.success('✓ Preferência salva');
    } catch (error) {
      console.error(error);
      setPreferences(prev => ({ ...prev, [key]: !value }));
      toast.error('Erro ao salvar');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Digite "EXCLUIR" para confirmar a exclusão permanente:');
    
    if (confirmation !== 'EXCLUIR') {
      toast.info('Cancelado');
      return;
    }
    
    const finalConfirm = confirm('Tem certeza? Esta ação é IRREVERSÍVEL.');
    if (!finalConfirm) return;
    
    try {
      toast.error('Entre em contato com o suporte para excluir sua conta');
    } catch (error) {
      toast.error('Erro. Entre em contato com o suporte.');
    }
  };

  const requestLocationPermission = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        toast.success('Localização permitida');
        checkPermissions();
      },
      () => {
        toast.error('Permissão negada');
      }
    );
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('Notificações permitidas');
      } else {
        toast.error('Permissão negada');
      }
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
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('PassengerOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Configurações</h1>
        </div>

        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <h3 className="text-sm font-bold text-[#BF3B79] mb-4 uppercase">🔒 PRIVACIDADE</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <div className="flex-1">
                <p className="text-[#F2F2F2] font-medium">Localização apenas em corridas</p>
                <p className="text-sm text-[#F2F2F2]/50">Compartilhar apenas durante viagens</p>
              </div>
              <Switch
                checked={preferences?.share_location_during_rides_only !== false}
                onCheckedChange={(v) => handlePreferenceToggle('share_location_during_rides_only', v)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <div className="flex-1">
                <p className="text-[#F2F2F2] font-medium">Salvar histórico de locais</p>
                <p className="text-sm text-[#F2F2F2]/50">Guardar endereços usados</p>
              </div>
              <Switch
                checked={preferences?.save_location_history !== false}
                onCheckedChange={(v) => handlePreferenceToggle('save_location_history', v)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <div className="flex-1">
                <p className="text-[#F2F2F2] font-medium">Ocultar foto para motoristas</p>
                <p className="text-sm text-[#F2F2F2]/50">Maior privacidade</p>
              </div>
              <Switch
                checked={preferences?.hide_photo_from_drivers || false}
                onCheckedChange={(v) => handlePreferenceToggle('hide_photo_from_drivers', v)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <h3 className="text-sm font-bold text-[#BF3B79] mb-4 uppercase">✅ PERMISSÕES</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#F22998]" />
                  <p className="text-[#F2F2F2] font-medium">Localização</p>
                </div>
                <p className="text-sm text-[#F2F2F2]/50 mt-1">
                  Status: {
                    locationPermission === 'granted' ? '✅ Permitido' :
                    locationPermission === 'denied' ? '❌ Negado' :
                    '⚠️ Não solicitado'
                  }
                </p>
              </div>
              {locationPermission !== 'granted' && (
                <Button
                  onClick={requestLocationPermission}
                  size="sm"
                  className="btn-gradient"
                >
                  Ativar
                </Button>
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#F22998]" />
                  <p className="text-[#F2F2F2] font-medium">Notificações</p>
                </div>
                <p className="text-sm text-[#F2F2F2]/50 mt-1">
                  Status: {
                    notificationPermission === 'granted' ? '✅ Permitido' :
                    notificationPermission === 'denied' ? '❌ Negado' :
                    '⚠️ Não solicitado'
                  }
                </p>
              </div>
              {notificationPermission !== 'granted' && (
                <Button
                  onClick={requestNotificationPermission}
                  size="sm"
                  className="btn-gradient"
                >
                  Ativar
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <h3 className="text-sm font-bold text-[#BF3B79] mb-4 uppercase">👤 CONTA</h3>
          
          <div className="space-y-3">
            <Button
              onClick={async () => {
                const loginUrl = window.location.origin + createPageUrl('PassengerLogin');
                await base44.auth.logout(loginUrl);
              }}
              variant="outline"
              className="w-full border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10 py-6 rounded-2xl"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sair da Conta
            </Button>
            
            <Button
              onClick={handleDeleteAccount}
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 py-6 rounded-2xl"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Excluir Conta Permanentemente
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}