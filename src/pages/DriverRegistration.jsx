import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Camera, Upload, CheckCircle, AlertCircle, Car, FileText, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function DriverRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    driver_license_number: '',
    driver_license_photo: null,
    vehicle_plate: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_color: '',
    vehicle_document_photo: null,
    vehicle_cnh_photo: null,
    birth_date: '',
    cpf: '',
    identification_photo: null
  });

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
      toast.success('Documento enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar documento');
    }
  };

  const handleSubmit = async () => {
    if (!formData.driver_license_number || !formData.driver_license_photo || 
        !formData.vehicle_plate || !formData.vehicle_document_photo ||
        !formData.vehicle_cnh_photo || !formData.birth_date || 
        !formData.cpf || !formData.identification_photo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      await base44.entities.DriverDocument.create({
        user_id: user.id,
        ...formData,
        verification_status: 'pending'
      });

      await base44.auth.updateMe({ 
        user_type: 'both',
        driver_application_status: 'pending'
      });

      toast.success('Documentação enviada! Aguarde a aprovação.');
      navigate(createPageUrl('Profile'));
    } catch (error) {
      toast.error('Erro ao enviar documentação');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-[#F2F2F2] mb-2">
            Torne-se uma Motorista
          </h1>
          <p className="text-[#F2F2F2]/60">
            Complete seu cadastro com documentação necessária
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= s ? 'bg-gradient-to-r from-[#BF3B79] to-[#F22998]' : 'bg-[#F2F2F2]/10'
              }`}>
                {step > s ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-white font-semibold">{s}</span>
                )}
              </div>
              {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-[#F22998]' : 'bg-[#F2F2F2]/10'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: CNH */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#F2F2F2]">
                  <FileText className="w-5 h-5 text-[#F22998]" />
                  Carteira Nacional de Habilitação (CNH)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Número da CNH"
                  value={formData.driver_license_number}
                  onChange={(e) => setFormData({ ...formData, driver_license_number: e.target.value })}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                />

                <div className="border-2 border-dashed border-[#F22998]/30 rounded-xl p-8 text-center">
                  {formData.driver_license_photo ? (
                    <div className="space-y-3">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                      <p className="text-[#F2F2F2]">CNH enviada com sucesso!</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-[#F22998] mx-auto mb-3" />
                      <p className="text-[#F2F2F2] mb-2">Envie foto da CNH</p>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'driver_license_photo')}
                        />
                        <Button type="button" variant="outline" className="border-[#F22998]/30 text-[#F22998]">
                          Escolher Arquivo
                        </Button>
                      </label>
                    </>
                  )}
                </div>

                <div className="border-2 border-dashed border-[#F22998]/30 rounded-xl p-8 text-center">
                  {formData.vehicle_cnh_photo ? (
                    <div className="space-y-3">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                      <p className="text-[#F2F2F2]">CNH do veículo enviada!</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-[#F22998] mx-auto mb-3" />
                      <p className="text-[#F2F2F2] mb-2">Envie foto da CNH do veículo</p>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'vehicle_cnh_photo')}
                        />
                        <Button type="button" variant="outline" className="border-[#F22998]/30 text-[#F22998]">
                          Escolher Arquivo
                        </Button>
                      </label>
                    </>
                  )}
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.driver_license_number || !formData.driver_license_photo || !formData.vehicle_cnh_photo}
                  className="w-full btn-gradient"
                >
                  Próximo
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#F2F2F2]">
                  <Shield className="w-5 h-5 text-[#F22998]" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="CPF"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                />

                <Input
                  type="date"
                  placeholder="Data de Nascimento"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                />

                <div className="border-2 border-dashed border-[#F22998]/30 rounded-xl p-8 text-center">
                  {formData.identification_photo ? (
                    <div className="space-y-3">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                      <p className="text-[#F2F2F2]">Foto de identificação enviada!</p>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-[#F22998] mx-auto mb-3" />
                      <p className="text-[#F2F2F2] mb-2">Foto de identificação (mulher obrigatório)</p>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'identification_photo')}
                        />
                        <Button type="button" variant="outline" className="border-[#F22998]/30 text-[#F22998]">
                          Tirar Foto
                        </Button>
                      </label>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 border-[#F22998]/30 text-[#F22998]"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!formData.cpf || !formData.birth_date || !formData.identification_photo}
                    className="flex-1 btn-gradient"
                  >
                    Próximo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Vehicle */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#F2F2F2]">
                  <Car className="w-5 h-5 text-[#F22998]" />
                  Informações do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Placa do veículo (ABC-1234)"
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Modelo"
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                  />
                  <Input
                    placeholder="Ano"
                    type="number"
                    value={formData.vehicle_year}
                    onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })}
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                  />
                </div>

                <Input
                  placeholder="Cor"
                  value={formData.vehicle_color}
                  onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                />

                <div className="border-2 border-dashed border-[#F22998]/30 rounded-xl p-8 text-center">
                  {formData.vehicle_document_photo ? (
                    <div className="space-y-3">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                      <p className="text-[#F2F2F2]">CRLV enviado com sucesso!</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-[#F22998] mx-auto mb-3" />
                      <p className="text-[#F2F2F2] mb-2">Envie foto do CRLV</p>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'vehicle_document_photo')}
                        />
                        <Button type="button" variant="outline" className="border-[#F22998]/30 text-[#F22998]">
                          Escolher Arquivo
                        </Button>
                      </label>
                    </>
                  )}
                </div>

                <div className="bg-[#F22998]/10 border border-[#F22998]/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#F22998] mt-0.5" />
                    <div>
                      <p className="text-[#F2F2F2] font-medium mb-1">Verificação de Segurança</p>
                      <p className="text-[#F2F2F2]/60 text-sm">
                        Seus documentos serão verificados pela nossa equipe em até 48 horas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 border-[#F22998]/30 text-[#F22998]"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.vehicle_plate || !formData.vehicle_document_photo}
                    className="flex-1 btn-gradient"
                  >
                    {loading ? 'Enviando...' : 'Enviar Documentação'}
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