import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, ChevronLeft, AlertCircle, Pencil, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuthUser } from '@/components/AuthProvider';

export default function PassengerProfile() {
  const { user, refreshUser } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  
  const [formState, setFormState] = useState({
    full_name: '',
    phone: '',
    gender: 'nao_informar',
    birth_date: '',
    city: '',
    state: '',
    photo_url: ''
  });

  const [editForm, setEditForm] = useState({});

  const [preferences, setPreferences] = useState({
    travel_with_pet: false,
    accessibility_needs: false,
    prefer_silence: false,
    prefer_ac: false
  });

  const [editPreferences, setEditPreferences] = useState({});

  const [profileId, setProfileId] = useState(null);
  const [preferencesId, setPreferencesId] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      const prefs = await base44.entities.UserPreferences.filter({ user_id: user.id });
      
      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        setProfileId(profile.id);
        setFormState({
          full_name: profile.full_name || user.full_name || '',
          phone: profile.phone || '',
          gender: profile.gender || 'nao_informar',
          birth_date: profile.birth_date || '',
          city: profile.city || '',
          state: profile.state || '',
          photo_url: profile.photo_url || user.photo_url || ''
        });
      } else {
        setFormState(prev => ({
          ...prev,
          full_name: user.full_name || '',
          photo_url: user.photo_url || ''
        }));
      }
      
      if (prefs && prefs.length > 0) {
        const pref = prefs[0];
        setPreferencesId(pref.id);
        setPreferences({
          travel_with_pet: pref.travel_with_pet || false,
          accessibility_needs: pref.accessibility_needs || false,
          prefer_silence: pref.prefer_silence || false,
          prefer_ac: pref.prefer_ac || false
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const maskPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const validateDate = (dateString) => {
    if (!dateString) return true;
    const date = new Date(dateString);
    const today = new Date();
    const minDate = new Date(1900, 0, 1);
    
    if (isNaN(date.getTime())) return false;
    if (date > today) return false;
    if (date < minDate) return false;
    
    const age = calculateAge(dateString);
    if (age !== null && age < 13) return false;
    
    return true;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setSaving(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const profileData = {
        full_name: formState.full_name || user.full_name,
        phone: formState.phone || null,
        gender: formState.gender,
        birth_date: formState.birth_date || null,
        city: formState.city || null,
        state: formState.state || null,
        photo_url: file_url
      };
      
      if (profileId) {
        await base44.entities.UserProfile.update(profileId, profileData);
      } else {
        const created = await base44.entities.UserProfile.create({
          ...profileData,
          user_id: user.id
        });
        setProfileId(created.id);
      }
      
      await base44.auth.updateMe({ photo_url: file_url });
      await refreshUser();
      
      setFormState(prev => ({ ...prev, photo_url: file_url }));
      toast.success('Foto atualizada!');
    } catch (error) {
      console.error('Erro upload:', error);
      toast.error('Erro ao carregar foto');
    } finally {
      setSaving(false);
    }
  };

  const openEditInfo = () => {
    setEditForm({ ...formState });
    setEditingSection('info');
  };

  const openEditPreferences = () => {
    setEditPreferences({ ...preferences });
    setEditingSection('preferences');
  };

  const closeEdit = () => {
    setEditingSection(null);
    setEditForm({});
    setEditPreferences({});
  };

  const saveInfo = async () => {
    if (!editForm.full_name || editForm.full_name.trim().length < 3) {
      toast.error('Nome deve ter pelo menos 3 caracteres');
      return;
    }
    
    if (editForm.phone) {
      const cleaned = editForm.phone.replace(/\D/g, '');
      if (cleaned.length > 0 && cleaned.length < 10) {
        toast.error('Telefone inválido');
        return;
      }
    }
    
    if (editForm.birth_date && !validateDate(editForm.birth_date)) {
      toast.error('Data de nascimento inválida');
      return;
    }
    
    setSaving(true);
    
    try {
      console.log('🔄 Salvando perfil...');
      
      const profileData = {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone || null,
        gender: editForm.gender,
        birth_date: editForm.birth_date || null,
        city: editForm.city || null,
        state: editForm.state || null,
        photo_url: editForm.photo_url || null
      };
      
      if (profileId) {
        console.log('📝 Atualizando perfil ID:', profileId);
        await base44.entities.UserProfile.update(profileId, profileData);
      } else {
        console.log('✨ Criando novo perfil');
        const created = await base44.entities.UserProfile.create({
          ...profileData,
          user_id: user.id
        });
        setProfileId(created.id);
        console.log('✅ Perfil criado com ID:', created.id);
      }
      
      await base44.auth.updateMe({
        full_name: editForm.full_name.trim(),
        photo_url: editForm.photo_url
      });
      
      await refreshUser();
      setFormState({ ...editForm });
      toast.success('✓ Informações salvas!');
      closeEdit();
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    
    try {
      console.log('🔄 Salvando preferências...');
      
      const prefData = {
        travel_with_pet: editPreferences.travel_with_pet,
        accessibility_needs: editPreferences.accessibility_needs,
        prefer_silence: editPreferences.prefer_silence,
        prefer_ac: editPreferences.prefer_ac
      };
      
      if (preferencesId) {
        console.log('📝 Atualizando preferências ID:', preferencesId);
        await base44.entities.UserPreferences.update(preferencesId, prefData);
      } else {
        console.log('✨ Criando novas preferências');
        const created = await base44.entities.UserPreferences.create({
          ...prefData,
          user_id: user.id
        });
        setPreferencesId(created.id);
        console.log('✅ Preferências criadas com ID:', created.id);
      }
      
      setPreferences({ ...editPreferences });
      toast.success('✓ Preferências salvas!');
      closeEdit();
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  const age = calculateAge(formState.birth_date);

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('PassengerOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Meu Perfil</h1>
        </div>

        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#F22998]">
                {formState.photo_url ? (
                  <img src={formState.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#F22998] flex items-center justify-center cursor-pointer hover:bg-[#BF3B79] transition-colors">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <p className="text-sm text-[#F2F2F2]/60">Clique para alterar foto</p>
          </div>
        </Card>

        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#F2F2F2]">Informações Pessoais</h3>
            <Button
              onClick={openEditInfo}
              size="sm"
              variant="ghost"
              className="text-[#F22998] hover:bg-[#F22998]/10"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Nome Completo</label>
              <div className="p-3 bg-[#0D0D0D] border border-[#F22998]/20 rounded-xl text-[#F2F2F2]">
                {formState.full_name || '-'}
              </div>
            </div>
            
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Telefone</label>
              <div className="p-3 bg-[#0D0D0D] border border-[#F22998]/20 rounded-xl text-[#F2F2F2]">
                {formState.phone || '-'}
              </div>
            </div>
            
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Gênero</label>
              <div className="p-3 bg-[#0D0D0D] border border-[#F22998]/20 rounded-xl text-[#F2F2F2]">
                {formState.gender === 'feminino' ? 'Feminino' : 
                 formState.gender === 'masculino' ? 'Masculino' : 
                 formState.gender === 'outro' ? 'Outro' : 'Prefiro não informar'}
              </div>
            </div>
            
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Data de Nascimento</label>
              <div className="p-3 bg-[#0D0D0D] border border-[#F22998]/20 rounded-xl text-[#F2F2F2]">
                {formState.birth_date ? `${new Date(formState.birth_date).toLocaleDateString('pt-BR')}${age ? ` (${age} anos)` : ''}` : '-'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Cidade</label>
                <div className="p-3 bg-[#0D0D0D] border border-[#F22998]/20 rounded-xl text-[#F2F2F2]">
                  {formState.city || '-'}
                </div>
              </div>
              <div>
                <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Estado</label>
                <div className="p-3 bg-[#0D0D0D] border border-[#F22998]/20 rounded-xl text-[#F2F2F2]">
                  {formState.state || '-'}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#F2F2F2]">Preferências de Viagem</h3>
            <Button
              onClick={openEditPreferences}
              size="sm"
              variant="ghost"
              className="text-[#F22998] hover:bg-[#F22998]/10"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <span className="text-[#F2F2F2]">Viajo com pet</span>
              <div className={`w-10 h-6 rounded-full ${preferences.travel_with_pet ? 'bg-[#F22998]' : 'bg-[#F2F2F2]/20'} flex items-center ${preferences.travel_with_pet ? 'justify-end' : 'justify-start'} px-1`}>
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <span className="text-[#F2F2F2]">Necessito acessibilidade</span>
              <div className={`w-10 h-6 rounded-full ${preferences.accessibility_needs ? 'bg-[#F22998]' : 'bg-[#F2F2F2]/20'} flex items-center ${preferences.accessibility_needs ? 'justify-end' : 'justify-start'} px-1`}>
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <span className="text-[#F2F2F2]">Prefiro silêncio</span>
              <div className={`w-10 h-6 rounded-full ${preferences.prefer_silence ? 'bg-[#F22998]' : 'bg-[#F2F2F2]/20'} flex items-center ${preferences.prefer_silence ? 'justify-end' : 'justify-start'} px-1`}>
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <span className="text-[#F2F2F2]">Prefiro ar condicionado</span>
              <div className={`w-10 h-6 rounded-full ${preferences.prefer_ac ? 'bg-[#F22998]' : 'bg-[#F2F2F2]/20'} flex items-center ${preferences.prefer_ac ? 'justify-end' : 'justify-start'} px-1`}>
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Edição de Informações */}
      <AnimatePresence>
        {editingSection === 'info' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closeEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1A1A1A] rounded-2xl border border-[#F22998]/20 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#F2F2F2]">Editar Informações</h2>
                <Button onClick={closeEdit} variant="ghost" size="icon">
                  <X className="w-5 h-5 text-[#F2F2F2]" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Nome Completo</label>
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                    placeholder="Digite seu nome"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Telefone</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: maskPhone(e.target.value) })}
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
                
                <div>
                  <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Gênero</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full p-3 bg-[#0D0D0D] border border-[#F22998]/20 rounded-xl text-[#F2F2F2]"
                  >
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                    <option value="nao_informar">Prefiro não informar</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Data de Nascimento</label>
                  <Input
                    type="date"
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Cidade</label>
                    <Input
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                      placeholder="Sua cidade"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Estado</label>
                    <Input
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value.toUpperCase() })}
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={closeEdit}
                  variant="outline"
                  className="flex-1 border-[#F22998]/20 text-[#F2F2F2]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveInfo}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Edição de Preferências */}
      <AnimatePresence>
        {editingSection === 'preferences' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closeEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1A1A1A] rounded-2xl border border-[#F22998]/20 p-6 max-w-lg w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#F2F2F2]">Editar Preferências</h2>
                <Button onClick={closeEdit} variant="ghost" size="icon">
                  <X className="w-5 h-5 text-[#F2F2F2]" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
                  <span className="text-[#F2F2F2]">Viajo com pet</span>
                  <Switch
                    checked={editPreferences.travel_with_pet}
                    onCheckedChange={(checked) => setEditPreferences({ ...editPreferences, travel_with_pet: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
                  <span className="text-[#F2F2F2]">Necessito acessibilidade</span>
                  <Switch
                    checked={editPreferences.accessibility_needs}
                    onCheckedChange={(checked) => setEditPreferences({ ...editPreferences, accessibility_needs: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
                  <span className="text-[#F2F2F2]">Prefiro silêncio</span>
                  <Switch
                    checked={editPreferences.prefer_silence}
                    onCheckedChange={(checked) => setEditPreferences({ ...editPreferences, prefer_silence: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
                  <span className="text-[#F2F2F2]">Prefiro ar condicionado</span>
                  <Switch
                    checked={editPreferences.prefer_ac}
                    onCheckedChange={(checked) => setEditPreferences({ ...editPreferences, prefer_ac: checked })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={closeEdit}
                  variant="outline"
                  className="flex-1 border-[#F22998]/20 text-[#F2F2F2]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={savePreferences}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}