import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  User, FileText, CreditCard, Shield, Lock, Bell, 
  Globe, HelpCircle, LogOut, ChevronRight, Camera,
  Phone, Mail, MapPin, Calendar, FileCheck, Car,
  AlertCircle, DollarSign, Eye, EyeOff, Smartphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function DriverOptions() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('menu');
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    newRides: true,
    messages: true,
    earnings: true,
    promotional: false
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData({ ...formData, phone: userData.phone || '' });
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ photo_url: file_url });
      setUser(prev => ({ ...prev, photo_url: file_url }));
      toast.success('Foto atualizada!');
    } catch (error) {
      toast.error('Erro ao fazer upload');
    }
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    try {
      await base44.auth.updateMe({ phone: formData.phone });
      toast.success('Perfil atualizado!');
      setActiveSection('menu');
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não correspondem');
      return;
    }
    if (formData.newPassword.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    try {
      toast.success('Senha alterada com sucesso!');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveSection('menu');
    } catch (error) {
      toast.error('Erro ao alterar senha');
    }
  };

  const handleNotificationToggle = async (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
    toast.success('Preferência atualizada');
  };

  const menuSections = [
    {
      title: 'Perfil',
      items: [
        { 
          icon: User, 
          label: 'Meu Perfil', 
          description: 'Ver e editar informações',
          onClick: () => setActiveSection('profile'),
          color: 'from-[#BF3B79] to-[#F22998]'
        },
        { 
          icon: FileText, 
          label: 'Documentos', 
          description: 'CNH, Veículo e Seguros',
          onClick: () => setActiveSection('documents'),
          color: 'from-blue-500 to-blue-600'
        }
      ]
    },
    {
      title: 'Financeiro',
      items: [
        { 
          icon: CreditCard, 
          label: 'Dados Bancários', 
          description: 'Conta para saques',
          onClick: () => setActiveSection('banking'),
          color: 'from-green-500 to-green-600'
        },
        { 
          icon: DollarSign, 
          label: 'Resumo Financeiro', 
          description: 'Saldo e transações',
          to: 'Earnings',
          color: 'from-yellow-500 to-orange-500'
        }
      ]
    },
    {
      title: 'Segurança',
      items: [
        { 
          icon: Lock, 
          label: 'Alterar Senha', 
          description: 'Atualizar senha de acesso',
          onClick: () => setActiveSection('security'),
          color: 'from-red-500 to-red-600'
        },
        { 
          icon: Smartphone, 
          label: 'Autenticação 2FA', 
          description: 'Ativar/Desativar',
          onClick: () => setActiveSection('2fa'),
          color: 'from-purple-500 to-purple-600'
        }
      ]
    },
    {
      title: 'Preferências',
      items: [
        { 
          icon: Bell, 
          label: 'Notificações', 
          description: 'Gerenciar notificações',
          onClick: () => setActiveSection('notifications'),
          color: 'from-pink-500 to-pink-600'
        },
        { 
          icon: HelpCircle, 
          label: 'Central de Ajuda', 
          description: 'Suporte e FAQ',
          onClick: () => setActiveSection('help'),
          color: 'from-cyan-500 to-cyan-600'
        }
      ]
    }
  ];

  const documents = [
    { 
      icon: FileCheck, 
      label: 'CNH', 
      status: 'verified', 
      expiry: '2028-12-15',
      number: '**** **** 4567'
    },
    { 
      icon: Car, 
      label: 'Documento do Veículo', 
      status: 'verified', 
      expiry: '2026-08-20',
      plate: 'ABC-1234'
    },
    { 
      icon: Shield, 
      label: 'Seguro', 
      status: 'verified', 
      expiry: '2025-06-10',
      provider: 'Porto Seguro'
    },
    { 
      icon: Shield, 
      label: 'Verificação de Segurança', 
      status: 'verified', 
      expiry: '2025-03-01',
      nextCheck: '2025-03-01'
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
    <div className="min-h-screen bg-[#0D0D0D] text-[#F2F2F2] pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {activeSection !== 'menu' && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveSection('menu')}
              className="text-[#F2F2F2] mb-4"
            >
              ← Voltar
            </Button>
          )}
          <h1 className="text-3xl font-bold text-[#F2F2F2]">
            {activeSection === 'menu' ? 'Opções' : 
             activeSection === 'profile' ? 'Meu Perfil' :
             activeSection === 'documents' ? 'Documentos' :
             activeSection === 'banking' ? 'Dados Bancários' :
             activeSection === 'security' ? 'Alterar Senha' :
             activeSection === '2fa' ? 'Autenticação 2FA' :
             activeSection === 'notifications' ? 'Notificações' :
             'Central de Ajuda'}
          </h1>
        </motion.div>

        {/* Main Menu */}
        {activeSection === 'menu' && (
          <div className="space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-effect border-[#F22998]/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#F22998]">
                        {user.photo_url ? (
                          <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
                            <User className="w-10 h-10 text-white/80" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-[#F2F2F2]">{user.full_name}</h2>
                      <p className="text-[#F2F2F2]/60">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Conta Verificada</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Menu Sections */}
            {menuSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (sectionIndex + 1) * 0.1 }}
              >
                <h3 className="text-sm font-semibold text-[#F2F2F2]/50 mb-3 uppercase tracking-wider">
                  {section.title}
                </h3>
                <Card className="glass-effect border-[#F22998]/30">
                  <CardContent className="p-0">
                    {section.items.map((item, index) => {
                      const ItemTag = item.to ? Link : 'button';
                      const itemProps = item.to 
                        ? { to: createPageUrl(item.to) }
                        : { onClick: item.onClick };

                      return (
                        <ItemTag
                          key={index}
                          {...itemProps}
                          className={`w-full flex items-center justify-between p-4 hover:bg-[#F22998]/10 transition-colors group ${
                            index !== section.items.length - 1 ? 'border-b border-[#F22998]/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <item.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-[#F2F2F2] text-left">{item.label}</p>
                              <p className="text-sm text-[#F2F2F2]/60 text-left">{item.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998] transition-colors" />
                        </ItemTag>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Logout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={async () => {
                  const loginUrl = window.location.origin + createPageUrl('DriverLogin');
                  await base44.auth.logout(loginUrl);
                }}
                variant="outline"
                className="w-full py-6 rounded-2xl border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sair da Conta
              </Button>
            </motion.div>
          </div>
        )}

        {/* Profile Edit */}
        {activeSection === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="glass-effect border-[#F22998]/30">
              <CardContent className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#F22998]">
                      {user.photo_url ? (
                        <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
                          <User className="w-16 h-16 text-white/80" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#F22998] flex items-center justify-center cursor-pointer hover:bg-[#BF3B79] transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Nome Completo</label>
                    <Input
                      value={user.full_name}
                      disabled
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] opacity-50"
                    />
                    <p className="text-xs text-[#F2F2F2]/40 mt-1">Nome não pode ser alterado</p>
                  </div>

                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Email</label>
                    <Input
                      value={user.email}
                      disabled
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] opacity-50"
                    />
                    <p className="text-xs text-[#F2F2F2]/40 mt-1">Email não pode ser alterado</p>
                  </div>

                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Telefone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                    />
                  </div>

                  <Button onClick={handleSaveProfile} className="w-full btn-gradient py-6">
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Documents */}
        {activeSection === 'documents' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {documents.map((doc, index) => (
              <Card key={index} className="glass-effect border-[#F22998]/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${
                        doc.status === 'verified' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                      } flex items-center justify-center`}>
                        <doc.icon className={`w-6 h-6 ${
                          doc.status === 'verified' ? 'text-green-400' : 'text-yellow-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-[#F2F2F2]">{doc.label}</p>
                        <p className="text-sm text-[#F2F2F2]/60">
                          {doc.number || doc.plate || doc.provider || `Próxima verificação: ${doc.nextCheck}`}
                        </p>
                        {doc.expiry && (
                          <p className="text-xs text-[#F2F2F2]/40">Validade: {doc.expiry}</p>
                        )}
                      </div>
                    </div>
                    {doc.status === 'verified' && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-green-400">Verificado</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Banking */}
        {activeSection === 'banking' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-effect border-[#F22998]/30">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-400 font-medium mb-1">Conta Cadastrada</p>
                        <p className="text-sm text-[#F2F2F2]/60">
                          Banco do Brasil<br />
                          Agência: 1234-5<br />
                          Conta: **** **** 6789
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Último Saque</label>
                      <p className="text-lg font-bold text-[#F2F2F2]">R$ 500,00</p>
                      <p className="text-sm text-[#F2F2F2]/40">15 de Janeiro, 2025</p>
                    </div>

                    <div>
                      <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Próximo Saque Automático</label>
                      <p className="text-lg font-bold text-[#F2F2F2]">20 de Janeiro, 2025</p>
                    </div>
                  </div>

                  <Button className="w-full btn-gradient py-6">
                    Alterar Conta Bancária
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Security / Change Password */}
        {activeSection === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-effect border-[#F22998]/30">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Senha Atual</label>
                    <Input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      placeholder="Digite sua senha atual"
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Nova Senha</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        placeholder="Digite sua nova senha"
                        className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F2F2F2]/40 hover:text-[#F2F2F2]"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Confirmar Nova Senha</label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirme sua nova senha"
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-[#F22998]/10 border border-[#F22998]/30">
                    <p className="text-sm text-[#F2F2F2]/60">
                      A senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.
                    </p>
                  </div>

                  <Button onClick={handleChangePassword} className="w-full btn-gradient py-6">
                    Alterar Senha
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 2FA */}
        {activeSection === '2fa' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-effect border-[#F22998]/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-[#F2F2F2] mb-1">Autenticação em Duas Etapas</h3>
                    <p className="text-sm text-[#F2F2F2]/60">Adicione uma camada extra de segurança</p>
                  </div>
                  <Switch
                    checked={false}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#BF3B79] data-[state=checked]:to-[#F22998]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <p className="text-sm text-[#F2F2F2]/80">
                      Com a autenticação em duas etapas ativada, você precisará inserir um código enviado para seu celular ou app autenticador sempre que fizer login.
                    </p>
                  </div>

                  <Button className="w-full btn-gradient py-6" disabled>
                    Ativar Autenticação 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Notifications */}
        {activeSection === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-effect border-[#F22998]/30">
              <CardContent className="p-6 space-y-4">
                {[
                  { key: 'newRides', label: 'Novas Corridas', description: 'Notificar sobre corridas disponíveis' },
                  { key: 'messages', label: 'Mensagens', description: 'Mensagens de passageiras' },
                  { key: 'earnings', label: 'Ganhos', description: 'Atualizações sobre saques e ganhos' },
                  { key: 'promotional', label: 'Promocional', description: 'Novidades e promoções' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-[#0D0D0D]">
                    <div>
                      <p className="font-medium text-[#F2F2F2]">{item.label}</p>
                      <p className="text-sm text-[#F2F2F2]/60">{item.description}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={() => handleNotificationToggle(item.key)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#BF3B79] data-[state=checked]:to-[#F22998]"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Help Center */}
        {activeSection === 'help' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="glass-effect border-[#F22998]/30">
              <CardContent className="p-6">
                <h3 className="font-semibold text-[#F2F2F2] mb-4">Perguntas Frequentes</h3>
                <div className="space-y-3">
                  {[
                    'Como aceitar corridas?',
                    'Como funcionam os saques?',
                    'Como melhorar minha avaliação?',
                    'O que fazer em caso de emergência?',
                    'Como adicionar documentos?'
                  ].map((question, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#F22998]/10 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[#F2F2F2]">{question}</span>
                        <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-[#F22998]/30">
              <CardContent className="p-6">
                <h3 className="font-semibold text-[#F2F2F2] mb-4">Precisa de Ajuda?</h3>
                <div className="space-y-3">
                  <Button className="w-full btn-gradient py-6">
                    <Mail className="w-5 h-5 mr-2" />
                    Enviar Email
                  </Button>
                  <Button variant="outline" className="w-full border-[#F22998]/30 text-[#F22998] py-6">
                    <Phone className="w-5 h-5 mr-2" />
                    Ligar para Suporte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}