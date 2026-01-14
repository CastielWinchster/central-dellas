import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  User, Camera, Phone, Mail, Shield, Star, 
  Car, CreditCard, MapPin, Bell, ChevronRight,
  LogOut, Heart, Settings, Edit3, Plus, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setEditData(userData);
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
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    try {
      await base44.auth.updateMe({
        phone: editData.phone,
      });
      setUser(prev => ({ ...prev, ...editData }));
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const menuItems = [
    {
      title: 'Conta',
      items: [
        { icon: User, label: 'Dados Pessoais', description: 'Nome, email e telefone' },
        { icon: Shield, label: 'Segurança', description: 'Contatos de emergência' },
        { icon: Bell, label: 'Notificações', description: 'Preferências de alertas' },
      ]
    },
    {
      title: 'Pagamentos',
      items: [
        { icon: CreditCard, label: 'Métodos de Pagamento', description: 'Adicionar ou remover cartões' },
        { icon: MapPin, label: 'Endereços Salvos', description: 'Casa, trabalho e favoritos' },
      ]
    },
    {
      title: 'Motorista',
      items: [
        { icon: Car, label: 'Meu Veículo', description: 'Informações do carro' },
        { icon: Star, label: 'Avaliações', description: 'Ver feedback das passageiras' },
      ]
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8 rounded-3xl bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/20 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Photo */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#F22998]">
                  {user.photo_url ? (
                    <img 
                      src={user.photo_url} 
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
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

              {/* Profile Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl font-bold text-[#F2F2F2] mb-1">{user.full_name || 'Usuária'}</h1>
                <p className="text-[#F2F2F2]/60 mb-4">{user.email}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F22998]/20">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-[#F2F2F2]">{user.average_rating || 5.0}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F22998]/20">
                    <Car className="w-4 h-4 text-[#F22998]" />
                    <span className="text-sm text-[#F2F2F2]">{user.total_rides || 0} corridas</span>
                  </div>
                  {user.user_type === 'driver' || user.user_type === 'both' ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Motorista Verificada</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                className="border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-[#F22998]/20"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Telefone</label>
                    <Input
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="border-[#F22998]/30 text-[#F2F2F2]"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveProfile} className="btn-gradient">
                    <Check className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10 mb-6">
            <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#F22998]" />
              Minhas Conquistas
            </h3>
            <div className="flex flex-wrap gap-3">
              {['Primeira Corrida', 'Passageira VIP', 'Avaliação 5 Estrelas', 'Sempre Pontual'].map((badge, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#BF3B79]/20 to-[#F22998]/20 border border-[#F22998]/30 text-[#F2F2F2] text-sm"
                >
                  ✨ {badge}
                </motion.span>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Emergency Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#F2F2F2] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#F22998]" />
                Contatos de Emergência
              </h3>
              <Button variant="outline" size="sm" className="border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
            
            {user.emergency_contacts?.length > 0 ? (
              <div className="space-y-3">
                {user.emergency_contacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F22998]/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#F22998]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#F2F2F2]">{contact.name}</p>
                        <p className="text-sm text-[#F2F2F2]/50">{contact.phone}</p>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-red-500/10 text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#F2F2F2]/50 text-center py-4">
                Adicione contatos para sua segurança durante as corridas
              </p>
            )}
          </Card>
        </motion.div>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 + 0.3 }}
          >
            <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10 mb-6">
              <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[#F22998]/10 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#F22998]/10 flex items-center justify-center group-hover:bg-[#F22998]/20 transition-colors">
                        <item.icon className="w-5 h-5 text-[#F22998]" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[#F2F2F2]">{item.label}</p>
                        <p className="text-sm text-[#F2F2F2]/50">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998] transition-colors" />
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={() => base44.auth.logout()}
            variant="outline"
            className="w-full py-6 rounded-2xl border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair da conta
          </Button>
        </motion.div>
      </div>
    </div>
  );
}