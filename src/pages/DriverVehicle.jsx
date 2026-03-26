import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Car, ArrowLeft, Camera, Loader2, Pencil, Power, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

const CATEGORY_LABELS = { standard: 'Padrão', premium: 'Premium', suv: 'SUV' };
const CURRENT_YEAR = new Date().getFullYear();
const EMPTY_FORM = { brand: '', model: '', plate: '', year: '', color: '', category: 'standard', photo_url: '' };

export default function DriverVehicle() {
  const [user, setUser] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const vehicles = await base44.entities.Vehicle.filter({ driver_id: userData.id });
      setVehicle(vehicles[0] || null);
    } catch {
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = () => {
    setFormData({
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      plate: vehicle.plate || '',
      year: vehicle.year ? String(vehicle.year) : '',
      color: vehicle.color || '',
      category: vehicle.category || 'standard',
      photo_url: vehicle.photo_url || '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(p => ({ ...p, photo_url: file_url }));
    } catch {
      toast.error('Erro ao fazer upload da foto');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!formData.brand.trim()) { toast.error('Marca é obrigatória'); return; }
    if (!formData.model.trim()) { toast.error('Modelo é obrigatório'); return; }
    if (!formData.plate.trim()) { toast.error('Placa é obrigatória'); return; }

    const yearNum = formData.year ? parseInt(formData.year) : null;
    if (yearNum && (yearNum < 1980 || yearNum > CURRENT_YEAR)) {
      toast.error(`Ano deve estar entre 1980 e ${CURRENT_YEAR}`); return;
    }

    setSaving(true);
    try {
      const payload = {
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        plate: formData.plate.trim().toUpperCase(),
        ...(yearNum && { year: yearNum }),
        ...(formData.color.trim() && { color: formData.color.trim() }),
        ...(formData.photo_url && { photo_url: formData.photo_url }),
        category: formData.category,
      };

      if (isEditing && vehicle) {
        await base44.entities.Vehicle.update(vehicle.id, payload);
        toast.success('Veículo atualizado!');
      } else {
        await base44.entities.Vehicle.create({ ...payload, driver_id: user.id, is_active: true });
        toast.success('Veículo cadastrado!');
      }

      const vehicles = await base44.entities.Vehicle.filter({ driver_id: user.id });
      setVehicle(vehicles[0] || null);
      setShowModal(false);
    } catch (err) {
      console.error('Erro ao salvar veículo:', err);
      toast.error('Erro ao salvar veículo. Tente novamente.');
    }
    setSaving(false);
  };

  const handleToggleActive = async () => {
    try {
      const newStatus = !vehicle.is_active;
      await base44.entities.Vehicle.update(vehicle.id, { is_active: newStatus });
      setVehicle(prev => ({ ...prev, is_active: newStatus }));
      toast.success(newStatus ? 'Veículo ativado!' : 'Veículo desativado');
    } catch {
      toast.error('Erro ao atualizar status');
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
    <div className="min-h-screen bg-[#0D0D0D] text-[#F2F2F2] pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('DriverOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#F2F2F2]">Informações do veículo</h1>
            <p className="text-sm text-[#F2F2F2]/50">Placa, modelo e identificação durante a corrida</p>
          </div>
        </div>

        {/* Estado vazio */}
        {!vehicle && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-[#1A1A1A] border-[#F22998]/20 rounded-3xl">
              <CardContent className="p-10 flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 rounded-full bg-[#F22998]/10 flex items-center justify-center">
                  <Car className="w-10 h-10 text-[#F22998]/50" />
                </div>
                <div>
                  <p className="text-[#F2F2F2]/60 text-lg mb-1">Nenhum veículo cadastrado ainda</p>
                  <p className="text-[#F2F2F2]/30 text-sm">Cadastre seu veículo para começar a receber corridas</p>
                </div>
                <Button onClick={openCreate} className="btn-gradient px-8 py-5 rounded-2xl text-base font-semibold">
                  <Car className="w-5 h-5 mr-2" />
                  Cadastrar veículo
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Card do veículo */}
        {vehicle && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-[#1A1A1A] border-[#F22998]/30 rounded-3xl overflow-hidden">
              {vehicle.photo_url ? (
                <div className="w-full h-52 overflow-hidden">
                  <img src={vehicle.photo_url} alt="Foto do veículo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-36 bg-[#F22998]/5 flex items-center justify-center">
                  <Car className="w-16 h-16 text-[#F22998]/25" />
                </div>
              )}

              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-[#F2F2F2]">{vehicle.brand} {vehicle.model}</h2>
                {(vehicle.year || vehicle.color) && (
                  <p className="text-[#F2F2F2]/50 text-sm mt-1">
                    {[vehicle.year, vehicle.color].filter(Boolean).join(' • ')}
                  </p>
                )}

                <div className="mt-4 inline-block px-5 py-2 rounded-xl border-2 border-[#F22998]/60 bg-[#F22998]/10">
                  <p className="text-xl font-bold tracking-widest text-[#F22998]">{vehicle.plate}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <span className="px-3 py-1 rounded-full bg-[#F22998]/20 text-[#F22998] text-sm font-medium">
                    {CATEGORY_LABELS[vehicle.category] || vehicle.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    vehicle.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {vehicle.is_active ? '✓ Veículo ativo para corridas' : '✗ Veículo inativo'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Button onClick={openEdit} variant="outline" className="py-5 rounded-2xl border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10">
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar veículo
                  </Button>
                  <Button
                    onClick={handleToggleActive}
                    variant="outline"
                    className={`py-5 rounded-2xl ${vehicle.is_active
                      ? 'border-gray-500/30 text-gray-400 hover:bg-gray-500/10'
                      : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    {vehicle.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Modal do formulário */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#1A1A1A] border border-[#F22998]/30"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#F22998]/10">
                <div>
                  <h2 className="text-xl font-bold text-[#F2F2F2]">
                    {isEditing ? 'Editar veículo' : 'Cadastrar veículo'}
                  </h2>
                  <p className="text-sm text-[#F2F2F2]/40 mt-0.5">Preencha as informações do seu veículo</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="text-[#F2F2F2]/50 hover:text-[#F2F2F2]">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">

                {/* Foto */}
                <div>
                  <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Foto do veículo</label>
                  <div className="flex items-center gap-4">
                    {formData.photo_url ? (
                      <img src={formData.photo_url} alt="Veículo" className="w-28 h-18 h-16 object-cover rounded-xl border border-[#F22998]/30" />
                    ) : (
                      <div className="w-24 h-16 rounded-xl border border-dashed border-[#F22998]/30 bg-[#F22998]/5 flex items-center justify-center flex-shrink-0">
                        <Car className="w-8 h-8 text-[#F22998]/30" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#F22998]/30 text-[#F22998] text-sm cursor-pointer hover:bg-[#F22998]/10 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      {uploading ? 'Enviando...' : 'Escolher foto'}
                    </label>
                  </div>
                </div>

                {/* Marca e Modelo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Marca *</label>
                    <Input
                      value={formData.brand}
                      onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))}
                      placeholder="Ex: Chevrolet"
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] placeholder:text-[#F2F2F2]/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Modelo *</label>
                    <Input
                      value={formData.model}
                      onChange={e => setFormData(p => ({ ...p, model: e.target.value }))}
                      placeholder="Ex: Onix"
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] placeholder:text-[#F2F2F2]/30"
                    />
                  </div>
                </div>

                {/* Placa */}
                <div>
                  <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Placa *</label>
                  <Input
                    value={formData.plate}
                    onChange={e => setFormData(p => ({ ...p, plate: e.target.value.toUpperCase() }))}
                    placeholder="Ex: ABC1D23"
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] placeholder:text-[#F2F2F2]/30 font-mono"
                    maxLength={8}
                  />
                </div>

                {/* Ano e Cor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Ano</label>
                    <Input
                      type="number"
                      value={formData.year}
                      onChange={e => setFormData(p => ({ ...p, year: e.target.value }))}
                      placeholder={String(CURRENT_YEAR)}
                      min={1980}
                      max={CURRENT_YEAR}
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] placeholder:text-[#F2F2F2]/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Cor</label>
                    <Input
                      value={formData.color}
                      onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                      placeholder="Ex: Prata"
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] placeholder:text-[#F2F2F2]/30"
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="text-sm text-[#F2F2F2]/60 mb-2 block">Categoria</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, category: value }))}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          formData.category === value
                            ? 'border-[#F22998] bg-[#F22998]/10 text-[#F22998]'
                            : 'border-[#F22998]/15 bg-[#0D0D0D] text-[#F2F2F2]/50 hover:border-[#F22998]/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-5 rounded-2xl border-[#F22998]/20 text-[#F2F2F2]/60 hover:text-[#F2F2F2]"
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="flex-1 py-5 rounded-2xl btn-gradient font-semibold"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}