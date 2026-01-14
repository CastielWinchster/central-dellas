import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, Sun, Bell, Shield, CreditCard, MapPin, 
  ChevronRight, Check, Plus, Trash2, Mail, Phone, 
  Home, Briefcase, Heart, X, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  const [newAddress, setNewAddress] = useState({ label: '', address: '' });
  const [newPayment, setNewPayment] = useState({ 
    type: 'credit_card', 
    cardholder_name: '', 
    card_number_last4: '', 
    card_brand: '',
    expiry_month: '',
    expiry_year: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const addresses = await base44.entities.SavedAddress.filter({ user_id: userData.id });
        setSavedAddresses(addresses);
        
        const payments = await base44.entities.PaymentMethod.filter({ user_id: userData.id });
        setPaymentMethods(payments);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleTheme = async () => {
    const newTheme = user.theme === 'dark' ? 'light' : 'dark';
    await base44.auth.updateMe({ theme: newTheme });
    setUser(prev => ({ ...prev, theme: newTheme }));
    toast.success(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`);
  };

  const sendVerificationEmail = async () => {
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: '🔐 Verifique sua conta - Central Dellas',
        body: `
          <h2>Olá, ${user.full_name}!</h2>
          <p>Clique no link abaixo para verificar sua conta:</p>
          <a href="${window.location.origin}" style="background: linear-gradient(135deg, #BF3B79, #F22998); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Verificar Conta
          </a>
          <p>Central Dellas - Mobilidade urbana segura e exclusiva para mulheres</p>
        `
      });
      
      await base44.auth.updateMe({ verification_sent_at: new Date().toISOString() });
      toast.success('Email de verificação enviado!');
    } catch (e) {
      toast.error('Erro ao enviar email');
    }
  };

  const addAddress = async () => {
    if (!newAddress.label || !newAddress.address) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      await base44.entities.SavedAddress.create({
        user_id: user.id,
        ...newAddress
      });
      
      const addresses = await base44.entities.SavedAddress.filter({ user_id: user.id });
      setSavedAddresses(addresses);
      setNewAddress({ label: '', address: '' });
      setAddAddressOpen(false);
      toast.success('Endereço adicionado!');
    } catch (e) {
      toast.error('Erro ao adicionar endereço');
    }
  };

  const deleteAddress = async (id) => {
    try {
      await base44.entities.SavedAddress.delete(id);
      setSavedAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Endereço removido');
    } catch (e) {
      toast.error('Erro ao remover endereço');
    }
  };

  const addPaymentMethod = async () => {
    if (!newPayment.cardholder_name || !newPayment.card_number_last4) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      await base44.entities.PaymentMethod.create({
        user_id: user.id,
        ...newPayment
      });
      
      const payments = await base44.entities.PaymentMethod.filter({ user_id: user.id });
      setPaymentMethods(payments);
      setNewPayment({ 
        type: 'credit_card', 
        cardholder_name: '', 
        card_number_last4: '', 
        card_brand: '',
        expiry_month: '',
        expiry_year: ''
      });
      setAddPaymentOpen(false);
      toast.success('Cartão adicionado!');
    } catch (e) {
      toast.error('Erro ao adicionar cartão');
    }
  };

  const deletePaymentMethod = async (id) => {
    try {
      await base44.entities.PaymentMethod.delete(id);
      setPaymentMethods(prev => prev.filter(p => p.id !== id));
      toast.success('Método de pagamento removido');
    } catch (e) {
      toast.error('Erro ao remover método');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isDark = user?.theme === 'dark';

  return (
    <div className={`min-h-screen pb-24 md:pb-10 transition-colors ${isDark ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-3xl font-bold mb-8 ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}
        >
          Configurações
        </motion.h1>

        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`mb-6 ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#F22998]/10' : 'bg-[#F22998]/20'}`}>
                    {isDark ? <Moon className="w-6 h-6 text-[#F22998]" /> : <Sun className="w-6 h-6 text-[#F22998]" />}
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                      Tema {isDark ? 'Escuro' : 'Claro'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-500'}`}>
                      Alternar entre temas claro e escuro
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={toggleTheme}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#BF3B79] data-[state=checked]:to-[#F22998]"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`mb-6 ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                <Bell className="w-5 h-5 text-[#F22998]" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Email</p>
                  <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-500'}`}>
                    Receber notificações por email
                  </p>
                </div>
                <Switch
                  checked={user?.email_notifications || false}
                  onCheckedChange={async (checked) => {
                    await base44.auth.updateMe({ email_notifications: checked });
                    setUser(prev => ({ ...prev, email_notifications: checked }));
                  }}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#BF3B79] data-[state=checked]:to-[#F22998]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Push</p>
                  <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-500'}`}>
                    Notificações no aplicativo
                  </p>
                </div>
                <Switch
                  checked={user?.push_notifications || false}
                  onCheckedChange={async (checked) => {
                    await base44.auth.updateMe({ push_notifications: checked });
                    setUser(prev => ({ ...prev, push_notifications: checked }));
                  }}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#BF3B79] data-[state=checked]:to-[#F22998]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>SMS</p>
                  <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-500'}`}>
                    Receber SMS sobre corridas
                  </p>
                </div>
                <Switch
                  checked={user?.sms_notifications || false}
                  onCheckedChange={async (checked) => {
                    await base44.auth.updateMe({ sms_notifications: checked });
                    setUser(prev => ({ ...prev, sms_notifications: checked }));
                  }}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#BF3B79] data-[state=checked]:to-[#F22998]"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={`mb-6 ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                <Shield className="w-5 h-5 text-[#F22998]" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-[#F22998]/5' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  {user?.is_verified ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Mail className="w-5 h-5 text-[#F22998]" />
                  )}
                  <div>
                    <p className={`font-medium ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                      {user?.is_verified ? 'Conta Verificada' : 'Verificar Conta'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-500'}`}>
                      {user?.is_verified ? 'Sua conta está verificada' : 'Enviaremos um email de confirmação'}
                    </p>
                  </div>
                </div>
                {!user?.is_verified && (
                  <Button
                    onClick={sendVerificationEmail}
                    size="sm"
                    className="btn-gradient"
                  >
                    Enviar Email
                  </Button>
                )}
              </div>

              <div className={`p-4 rounded-xl ${isDark ? 'bg-[#F22998]/5' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`font-medium ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                    Contato de Emergência
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Nome"
                    value={user?.emergency_contact_name || ''}
                    onChange={(e) => setUser(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                    className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}
                  />
                  <Input
                    placeholder="Telefone"
                    value={user?.emergency_contact_phone || ''}
                    onChange={(e) => setUser(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                    className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}
                  />
                </div>
                <Button
                  onClick={async () => {
                    await base44.auth.updateMe({
                      emergency_contact_name: user.emergency_contact_name,
                      emergency_contact_phone: user.emergency_contact_phone
                    });
                    toast.success('Contato salvo!');
                  }}
                  size="sm"
                  className="mt-3 btn-gradient"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`mb-6 ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                  <CreditCard className="w-5 h-5 text-[#F22998]" />
                  Métodos de Pagamento
                </CardTitle>
                <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="btn-gradient">
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/30' : 'bg-white'}>
                    <DialogHeader>
                      <DialogTitle className={isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}>
                        Adicionar Cartão
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        placeholder="Nome no cartão"
                        value={newPayment.cardholder_name}
                        onChange={(e) => setNewPayment({ ...newPayment, cardholder_name: e.target.value })}
                        className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}
                      />
                      <Input
                        placeholder="Últimos 4 dígitos"
                        value={newPayment.card_number_last4}
                        onChange={(e) => setNewPayment({ ...newPayment, card_number_last4: e.target.value })}
                        maxLength={4}
                        className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}
                      />
                      <Input
                        placeholder="Bandeira (Visa, Master, etc)"
                        value={newPayment.card_brand}
                        onChange={(e) => setNewPayment({ ...newPayment, card_brand: e.target.value })}
                        className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Mês"
                          value={newPayment.expiry_month}
                          onChange={(e) => setNewPayment({ ...newPayment, expiry_month: e.target.value })}
                          maxLength={2}
                          className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}
                        />
                        <Input
                          placeholder="Ano"
                          value={newPayment.expiry_year}
                          onChange={(e) => setNewPayment({ ...newPayment, expiry_year: e.target.value })}
                          maxLength={4}
                          className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}
                        />
                      </div>
                      <Button onClick={addPaymentMethod} className="w-full btn-gradient">
                        Adicionar Cartão
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((payment) => (
                    <div 
                      key={payment.id} 
                      className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-[#F22998]/5' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-[#F22998]" />
                        <div>
                          <p className={`font-medium ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                            {payment.card_brand} •••• {payment.card_number_last4}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-500'}`}>
                            {payment.cardholder_name}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => deletePaymentMethod(payment.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center py-4 ${isDark ? 'text-[#F2F2F2]/50' : 'text-gray-400'}`}>
                  Nenhum método de pagamento cadastrado
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Saved Addresses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={`mb-6 ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                  <MapPin className="w-5 h-5 text-[#F22998]" />
                  Endereços Salvos
                </CardTitle>
                <Dialog open={addAddressOpen} onOpenChange={setAddAddressOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="btn-gradient">
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/30' : 'bg-white'}>
                    <DialogHeader>
                      <DialogTitle className={isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}>
                        Adicionar Endereço
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        placeholder="Nome (Casa, Trabalho, etc)"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}
                      />
                      <Input
                        placeholder="Endereço completo"
                        value={newAddress.address}
                        onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                        className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}
                      />
                      <Button onClick={addAddress} className="w-full btn-gradient">
                        Salvar Endereço
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {savedAddresses.length > 0 ? (
                <div className="space-y-3">
                  {savedAddresses.map((address) => {
                    const icons = { Casa: Home, Trabalho: Briefcase, Favorito: Heart };
                    const Icon = icons[address.label] || MapPin;
                    
                    return (
                      <div 
                        key={address.id} 
                        className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-[#F22998]/5' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-[#F22998]" />
                          <div>
                            <p className={`font-medium ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                              {address.label}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-500'}`}>
                              {address.address}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => deleteAddress(address.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={`text-center py-4 ${isDark ? 'text-[#F2F2F2]/50' : 'text-gray-400'}`}>
                  Nenhum endereço salvo
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}