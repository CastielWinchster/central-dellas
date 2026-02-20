import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { User, Camera, Save, ChevronLeft, AlertCircle } from 'lucide-react';
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
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    gender: 'nao_informar',
    birth_date: '',
    city: '',
    state: '',
    photo_url: ''
  });

  const [preferences, setPreferences] = useState({
    travel_with_pet: false,
    accessibility_needs: false,
    prefer_silence: false,
    prefer_ac: false
  });

  const [profileId, setProfileId] = useState(null);
  const [preferencesId, setPreferencesId] = useState(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      const prefs = await base44.entities.UserPreferences.filter({ user_id: user.id });
      
      if (profiles.length > 0) {
        const p = profiles[0];
        setProfileId(p.id);
        setFormData({
          full_name: p.full_name || user.full_name || '',
          phone: p.phone || '',
          gender: p.gender || 'nao_informar',
          birth_date: p.birth_date || '',
          city: p.city || '',
          state: p.state || '',
          photo_url: p.photo_url || user.photo_url || ''
        });
      } else {
        setFormData(prev => ({
          ...prev,
          full_name: user.full_name || '',
          photo_url: user.photo_url || ''
        }));
      }
      
      if (prefs.length > 0) {
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
    if (age < 13) return false;
    
    return true;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      toast.success('Foto atualizada!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload');
    }
  };

  const handleSave = async () => {
    if (!formData.full_name || formData.full_name.length < 3) {
      toast.error('Digite seu nome completo (mínimo 3 caracteres)');
      return;
    }
    
    if (formData.phone) {
      const cleaned = formData.phone.replace(/\D/g, '');
      if (cleaned.length < 10 || cleaned.length > 11) {
        toast.error('Telefone inválido. Use o formato (00) 00000-0000');
        return;
      }
    }
    
    if (formData.birth_date && !validateDate(formData.birth_date)) {
      toast.error('Data de nascimento inválida. Idade mínima: 13 anos');
      return;
    }
    
    setSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        full_name: formData.full_name,
        phone: formData.phone || null,
        gender: formData.gender,
        birth_date: formData.birth_date || null,
        city: formData.city || null,
        state: formData.state || null,
        photo_url: formData.photo_url || null
      };
      
      let savedProfile;
      if (profileId) {
        savedProfile = await base44.entities.UserProfile.update(profileId, profileData);
      } else {
        savedProfile = await base44.entities.UserProfile.create(profileData);
        setProfileId(savedProfile.id);
      }
      
      await base44.auth.updateMe({
        full_name: formData.full_name,
        photo_url: formData.photo_url
      });
      
      await refreshUser();
      toast.success('✓ Todas as informações foram salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      const errorMsg = error.message || error.toString();
      toast.error(`Erro ao salvar: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceToggle = async (key) => {
    const newValue = !preferences[key];
    
    setPreferences(prev => ({ ...prev, [key]: newValue }));
    
    try {
      const prefData = { user_id: user.id, [key]: newValue };
      
      if (preferencesId) {
        await base44.entities.UserPreferences.update(preferencesId, prefData);
      } else {
        const created = await base44.entities.UserPreferences.create({ ...preferences, ...prefData });
        setPreferencesId(created.id);
      }
      
      toast.success('✓ Preferência salva!');
    } catch (error) {
      console.error('Erro ao atualizar preferência:', error);
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
      toast.error('Erro ao salvar preferência');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  const age = calculateAge(formData.birth_date);

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('PassengerOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Editar Perfil</h1>
        </div>

        {/* Photo */}
        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#F22998]">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="" className="w-full h-full object-cover" />
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

        {/* Personal Info */}
        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Informações Pessoais</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Nome Completo</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                placeholder="Digite seu nome"
              />
            </div>
            
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Telefone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Gênero</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full p-3 bg-[#0D0D0D] border border-[#F22998]/20 rounded-xl text-[#F2F2F2]"
              >
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="nao_informar">Prefiro não informar</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block flex items-center gap-2">
                Data de Nascimento
                {age && <span className="text-xs text-[#F22998]">({age} anos)</span>}
              </label>
              <Input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
              />
              <div className="flex items-start gap-2 mt-2 p-2 bg-blue-500/10 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-200">
                  Sua data de nascimento é privada e usada apenas para segurança
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Cidade</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                  placeholder="Sua cidade"
                />
              </div>
              <div>
                <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Estado</label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Preferências de Viagem</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <span className="text-[#F2F2F2]">Viajo com pet</span>
              <Switch
                checked={preferences.travel_with_pet}
                onCheckedChange={() => handlePreferenceToggle('travel_with_pet')}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <span className="text-[#F2F2F2]">Necessito acessibilidade</span>
              <Switch
                checked={preferences.accessibility_needs}
                onCheckedChange={() => handlePreferenceToggle('accessibility_needs')}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <span className="text-[#F2F2F2]">Prefiro silêncio</span>
              <Switch
                checked={preferences.prefer_silence}
                onCheckedChange={() => handlePreferenceToggle('prefer_silence')}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
              <span className="text-[#F2F2F2]">Prefiro ar condicionado</span>
              <Switch
                checked={preferences.prefer_ac}
                onCheckedChange={() => handlePreferenceToggle('prefer_ac')}
              />
            </div>
          </div>
        </Card>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-gradient py-6 rounded-2xl"
        >
          {saving ? (
            <>Salvando...</>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}