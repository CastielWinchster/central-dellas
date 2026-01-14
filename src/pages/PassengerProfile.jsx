import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  User, Camera, Phone, Star, Heart, 
  MapPin, Shield, ArrowLeft, Gift
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function PassengerProfile() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

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
      toast.success('Foto atualizada!');
    } catch (error) {
      toast.error('Erro ao fazer upload');
    }
    setUploading(false);
  };

  const handleTogglePet = async (checked) => {
    try {
      await base44.auth.updateMe({ travels_with_pet: checked });
      setUser(prev => ({ ...prev, travels_with_pet: checked }));
      toast.success(checked ? 'Preferência de pet ativada!' : 'Preferência de pet desativada');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await base44.auth.updateMe({
        phone: editData.phone,
        bio: editData.bio
      });
      setUser(prev => ({ ...prev, ...editData }));
      setIsEditing(false);
      toast.success('Perfil atualizado!');
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Perfil da Passageira</h1>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-effect border-[#F22998]/30 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Photo */}
                <div className="relative">
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

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-[#F2F2F2] mb-1">{user.full_name}</h2>
                  <p className="text-[#F2F2F2]/60 mb-3">{user.email}</p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F22998]/20">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-[#F2F2F2]">{user.rating || 5.0}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F22998]/20">
                      <MapPin className="w-4 h-4 text-[#F22998]" />
                      <span className="text-sm text-[#F2F2F2]">{user.total_rides || 0} corridas</span>
                    </div>
                    {user.travels_with_pet && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20">
                        <span className="text-sm text-purple-400">🐾 Viaja com Pet</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  className="border-[#F22998]/30 text-[#F22998]"
                >
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>

              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 pt-6 border-t border-[#F22998]/20 space-y-4"
                >
                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Telefone</label>
                    <Input
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Bio</label>
                    <Input
                      value={editData.bio || ''}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      placeholder="Conte um pouco sobre você"
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                    />
                  </div>
                  <Button onClick={handleSaveProfile} className="btn-gradient w-full">
                    Salvar Alterações
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-[#F22998]/30 mb-6">
            <CardHeader>
              <CardTitle className="text-[#F2F2F2]">Preferências de Viagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pet */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F22998]/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl">🐾</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#F2F2F2]">Viajo com Pet</p>
                    <p className="text-sm text-[#F2F2F2]/60">
                      Indica que você costuma viajar com seu pet
                    </p>
                  </div>
                </div>
                <Switch
                  checked={user.travels_with_pet || false}
                  onCheckedChange={handleTogglePet}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#BF3B79] data-[state=checked]:to-[#F22998]"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-effect border-[#F22998]/30">
            <CardContent className="p-6 space-y-3">
              <Link
                to={createPageUrl('LoyaltyProgram')}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-[#F22998]/10 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F22998]/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-[#F22998]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#F2F2F2]">Programa de Fidelidade</p>
                    <p className="text-sm text-[#F2F2F2]/60">
                      {user.loyalty_points || 0} pontos • Próxima recompensa em {10 - ((user.completed_rides || 0) % 10)} corridas
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F22998]/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-[#F2F2F2]">Conta Verificada</p>
                    <p className="text-sm text-[#F2F2F2]/60">Sua segurança é nossa prioridade</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}