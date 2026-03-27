import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  User, FileText, Shield, Bell, 
  Settings, HelpCircle, LogOut, ChevronRight, Camera,
  DollarSign, Car, Package, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DriverOptions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        
        // Verificar se é motorista
        if (userData.user_type !== 'driver' && userData.user_type !== 'both') {
          toast.error('Você não tem permissão para acessar esta página');
          await base44.auth.logout();
          return;
        }
        
        setUser(userData);
        setPhone(userData.phone || '');
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const handleSavePhone = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      setPhoneError('Informe um telefone válido');
      return;
    }
    setPhoneError('');
    setSavingPhone(true);
    try {
      await base44.auth.updateMe({ phone });
      toast.success('Telefone salvo com sucesso!');
    } catch (e) {
      toast.error('Erro ao salvar telefone');
    } finally {
      setSavingPhone(false);
    }
  };

  const menuSections = [
    {
      title: '👤 MEU PERFIL',
      items: [
        { 
          icon: User, 
          label: 'Editar Perfil', 
          description: 'Atualizar informações pessoais',
          page: 'DriverProfile'
        }
      ]
    },
    {
      title: '📋 DOCUMENTOS',
      items: [
        { 
          icon: FileText, 
          label: 'Documentos do Motorista', 
          description: 'CNH, RG, CRLV e Seguro',
          page: 'DriverDocuments'
        }
      ]
    },
    {
      title: '🚗 MEU VEÍCULO',
      items: [
        { 
          icon: Car, 
          label: 'Informações do Veículo', 
          description: 'Placa, modelo e documentação',
          page: 'DriverVehicle'
        },
        { 
          icon: Package, 
          label: 'Serviços', 
          description: 'Frete e pets',
          page: 'DriverProfile'
        }
      ]
    },
    {
      title: '💰 FINANCEIRO',
      items: [
        { 
          icon: DollarSign, 
          label: 'Meus Ganhos', 
          description: 'Histórico de corridas e ganhos',
          page: 'Earnings'
        }
      ]
    },
    {
      title: '❓ SUPORTE',
      items: [
        { 
          icon: HelpCircle, 
          label: 'Central de Ajuda', 
          description: 'FAQ e suporte',
          page: 'DriverHelp'
        }
      ]
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0D0D0D] flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-[#0D0D0D] border-b-2 border-[#8C0D60] p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#F2F2F2]">⚙️ Opções - Motorista</h1>
          <Link to={createPageUrl('DriverDashboard')}>
            <Button variant="ghost" size="sm" className="text-[#F2F2F2]">
              ✕
            </Button>
          </Link>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 rounded-2xl bg-[#1A1A1A] border border-[#8C0D60]"
          >
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#F22998]">
                {user.photo_url ? (
                  <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
                    <User className="w-10 h-10 text-white/80" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#F2F2F2]">{user.full_name}</h2>
                <p className="text-[#F2F2F2]/60">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Verificada</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Telefone de Contato */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <h3 className="text-xs font-bold text-[#8C0D60] mb-3 uppercase tracking-wider px-2">
              📞 TELEFONE DE CONTATO
            </h3>
            <div className="bg-[#1A1A1A] border border-[#8C0D60] rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-[#F22998]/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-[#F22998]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#F2F2F2]">Telefone (WhatsApp/Celular)</p>
                  <p className="text-xs text-[#CCCCCC]">Visível para passageiras após aceitar corrida</p>
                </div>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                placeholder="(99) 99999-9999"
                className="w-full bg-[#2A2A2A] border border-[#F22998]/20 rounded-xl px-4 py-3 text-[#F2F2F2] placeholder-[#F2F2F2]/30 focus:outline-none focus:border-[#F22998]/60 mb-2"
              />
              {phoneError && (
                <p className="text-red-400 text-xs mb-2">{phoneError}</p>
              )}
              <Button
                onClick={handleSavePhone}
                disabled={savingPhone}
                className="w-full btn-gradient rounded-xl py-2"
              >
                {savingPhone ? 'Salvando...' : 'Salvar Telefone'}
              </Button>
            </div>
          </motion.div>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.05 }}
              className="mb-6"
            >
              <h3 className="text-xs font-bold text-[#8C0D60] mb-3 uppercase tracking-wider px-2">
                {section.title}
              </h3>
              <div className="bg-[#1A1A1A] border border-[#8C0D60] rounded-2xl overflow-hidden">
                {section.items.map((item, index) => (
                  <Link
                    key={index}
                    to={createPageUrl(item.page)}
                    className={`flex items-center justify-between p-4 bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-all group ${
                      index !== section.items.length - 1 ? 'border-b border-[#1A1A1A]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#F22998]/20 flex items-center justify-center group-hover:bg-[#F22998]/30 transition-colors">
                        <item.icon className="w-6 h-6 text-[#F22998]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#F2F2F2] text-left">{item.label}</p>
                        <p className="text-sm text-[#CCCCCC] text-left">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998] transition-colors" />
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={async () => {
                const loginUrl = window.location.origin + createPageUrl('DriverLogin');
                await base44.auth.logout(loginUrl);
              }}
              variant="outline"
              className="w-full py-6 rounded-2xl border-red-500/30 text-red-400 hover:bg-red-500/10 bg-[#2A2A2A]"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sair da Conta
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}