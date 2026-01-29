import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Moon, Sun, Globe, Shield, Eye, Type, Contrast, MapPin, 
  Bell, LogOut, Trash2, ChevronLeft, FileText, Lock, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
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
      if (prefs.length > 0) {
        setPreferences(prefs[0]);
      }
    } catch (error) {
      console.error(error);
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    // Verificar localização
    if (navigator.permissions) {
      try {
        const locPerm = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(locPerm.state);
      } catch (e) {
        setLocationPermission('unknown');
      }
    }
    
    // Verificar notificações
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const handleThemeChange = async (theme) => {
    try {
      await base44.auth.updateMe({ theme });
      setUser(prev => ({ ...prev, theme }));
      document.documentElement.classList.toggle('light-theme', theme === 'light');
      document.documentElement.classList.toggle('dark-theme', theme === 'dark');
      toast.success('Tema atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar tema');
    }
  };

  const handlePreferenceToggle = async (key, value) => {
    try {
      if (preferences) {
        await base44.entities.UserPreferences.update(preferences.id, { [key]: value });
      } else {
        const newPrefs = await base44.entities.UserPreferences.create({
          user_id: user.id,
          [key]: value
        });
        setPreferences(newPrefs);
      }
      setPreferences(prev => ({ ...prev, [key]: value }));
      toast.success('Preferência atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Digite "EXCLUIR" para confirmar a exclusão permanente da sua conta:');
    
    if (confirmation !== 'EXCLUIR') {
      toast.info('Exclusão cancelada');
      return;
    }
    
    const finalConfirm = confirm('Tem certeza absoluta? Esta ação é IRREVERSÍVEL.');
    if (!finalConfirm) return;
    
    try {
      // Deletar dados do usuário
      await base44.asServiceRole.entities.User.delete(user.id);
      toast.success('Conta excluída');
      await base44.auth.logout();
    } catch (error) {
      toast.error('Erro ao excluir conta. Entre em contato com o suporte.');
    }
  };

  const requestLocationPermission = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        toast.success('Permissão de localização concedida');
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
        toast.success('Permissão de notificações concedida');
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

        {/* Tema */}
        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <h3 className="text-sm font-bold text-[#BF3B79] mb-4 uppercase">🎨 APARÊNCIA</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  user?.theme === 'dark' || !user?.theme
                    ? 'border-[#F22998] bg-[#F22998]/10'
                    : 'border-[#F22998]/20 bg-[#0D0D0D]'
                }`}
              >
                <Moon className="w-6 h-6 text-[#F22998] mx-auto mb-2" />
                <p className="text-xs text-[#F2F2F2]">Escuro</p>
              </button>
              
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  user?.theme === 'light'
                    ? 'border-[#F22998] bg-[#F22998]/10'
                    : 'border-[#F22998]/20 bg-[#0D0D0D]'
                }`}
              >
                <Sun className="w-6 h-6 text-[#F22998] mx-auto mb-2" />
                <p className="text-xs text-[#F2F2F2]">Claro</p>
              </button>
              
              <button
                onClick={() => handleThemeChange('auto')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  user?.theme === 'auto'
                    ? 'border-[#F22998] bg-[#F22998]/10'
                    : 'border-[#F22998]/20 bg-[#0D0D0D]'
                }`}
              >
                <Globe className="w-6 h-6 text-[#F22998] mx-auto mb-2" />
                <p className="text-xs text-[#F2F2F2]">Auto</p>
              </button>
            </div>
          </div>
        </Card>

        {/* Privacidade */}
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

        {/* Acessibilidade */}
        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <h3 className="text-sm font-bold text-[#BF3B79] mb-4 uppercase">♿ ACESSIBILIDADE</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-[#F22998]" />
                <p className="text-[#F2F2F2] font-medium">Fonte maior</p>
              </div>
              <Switch
                checked={preferences?.larger_font || false}
                onCheckedChange={(v) => handlePreferenceToggle('larger_font', v)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <div className="flex items-center gap-3">
                <Contrast className="w-5 h-5 text-[#F22998]" />
                <p className="text-[#F2F2F2] font-medium">Alto contraste</p>
              </div>
              <Switch
                checked={preferences?.high_contrast || false}
                onCheckedChange={(v) => handlePreferenceToggle('high_contrast', v)}
              />
            </div>
          </div>
        </Card>

        {/* Permissões */}
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

        {/* Conta */}
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

        {/* Legal */}
        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <h3 className="text-sm font-bold text-[#BF3B79] mb-4 uppercase">📄 LEGAL</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => toast.info('Abrindo termos de uso...')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D] hover:bg-[#F22998]/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#F22998]" />
                <span className="text-[#F2F2F2]">Termos de Uso</span>
              </div>
            </button>
            
            <button
              onClick={() => toast.info('Abrindo política de privacidade...')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D] hover:bg-[#F22998]/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#F22998]" />
                <span className="text-[#F2F2F2]">Política de Privacidade</span>
              </div>
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[#F22998]/10">
            <p className="text-xs text-[#F2F2F2]/40 text-center">
              Central Dellas v1.0.0
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}