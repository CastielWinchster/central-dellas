import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  User, Camera, Star, Heart, Shield, 
  Edit3, Check, Settings, LogOut, ChevronRight, Gift, PawPrint, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PassengerProfile() {
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
        bio: editData.bio,
      });
      setUser(prev => ({ ...prev, ...editData }));
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
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
                <h1 className="text-2xl font-bold text-[#F2F2F2] mb-1">{user.full_name || 'Passageira'}</h1>
                <p className="text-[#F2F2F2]/60 mb-4">{user.email}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F22998]/20">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-[#F2F2F2]">{user.rating || 5.0}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F22998]/20">
                    <MapPin className="w-4 h-4 text-[#F22998]" />
                    <span className="text-sm text-[#F2F2F2]">{user.completed_rides || 0} corridas</span>
                  </div>
                  {user.has_pet_preference && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20">
                      <PawPrint className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-400">Viaja com Pet</span>
                    </div>
                  )}
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
                  <div className="md:col-span-2">
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Biografia</label>
                    <Input
                      value={editData.bio || ''}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      placeholder="Conte um pouco sobre você..."
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

        {/* Passenger Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10 mb-6">
            <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Preferências de Viagem</h3>
            
            <div className="space-y-4">
              {/* Pet Preference */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F22998]/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <PawPrint className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-[#F2F2F2]">Costumo viajar com Pet</p>
                    <p className="text-sm text-[#F2F2F2]/60">Mostrar sua preferência para motoristas que aceitam pets</p>
                  </div>
                </div>
                <Switch
                  checked={user.has_pet_preference || false}
                  onCheckedChange={async (checked) => {
                    await base44.auth.updateMe({ has_pet_preference: checked });
                    setUser(prev => ({ ...prev, has_pet_preference: checked }));
                  }}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#BF3B79] data-[state=checked]:to-[#F22998]"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 rounded-3xl bg-[#F2F2F2]/5 border-[#F22998]/10 mb-6">
            <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Acesso Rápido</h3>
            <div className="space-y-2">
              <Link
                to={createPageUrl('LoyaltyProgram')}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[#F22998]/10 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F22998]/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-[#F22998]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[#F2F2F2]">Programa de Fidelidade</p>
                    <p className="text-sm text-[#F2F2F2]/50">Recompensas e descontos</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998]" />
              </Link>

              <Link
                to={createPageUrl('RideHistory')}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[#F22998]/10 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F22998]/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#F22998]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[#F2F2F2]">Histórico de Corridas</p>
                    <p className="text-sm text-[#F2F2F2]/50">Veja suas viagens</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998]" />
              </Link>

              <Link
                to={createPageUrl('Profile')}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[#F22998]/10 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F22998]/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-[#F22998]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[#F2F2F2]">Configurações Completas</p>
                    <p className="text-sm text-[#F2F2F2]/50">Ver todas as opções</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#F2F2F2]/30 group-hover:text-[#F22998]" />
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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