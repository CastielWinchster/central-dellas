import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CheckCircle, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import Step1PersonalData from '../components/registration/Step1PersonalData';
import Step2Documents from '../components/registration/Step2Documents';
import Step3FacialVerification from '../components/registration/Step3FacialVerification';

export default function DriverRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Etapa 1
    full_name: '',
    birth_date: '',
    cpf: '',
    email: '',
    phone: '',
    phone_verified: false,
    agrees_woman: false,
    // Etapa 2
    cnh: { uploaded: false, verified: false, photo: null },
    rg: { uploaded: false, verified: false, photo: null },
    comprovante: { uploaded: false, verified: false, photo: null },
    crlv: { uploaded: false, verified: false, photo: null },
    seguro: { uploaded: false, verified: false, photo: null },
    // Etapa 3
    facial_verification: null
  });

  // Carregar progresso salvo
  useEffect(() => {
    const savedProgress = localStorage.getItem('driver_registration_progress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setFormData(parsed.formData);
      setStep(parsed.step);
      toast.success('Progresso carregado!');
    }
  }, []);

  // Salvar progresso automaticamente
  useEffect(() => {
    if (step > 1 || formData.full_name) {
      localStorage.setItem('driver_registration_progress', JSON.stringify({
        formData,
        step,
        timestamp: new Date().toISOString()
      }));
    }
  }, [formData, step]);

  const handleUpdateData = (newData) => {
    setFormData({ ...formData, ...newData });
  };

  const handleStep1Next = (data) => {
    handleUpdateData(data);
    setStep(2);
  };

  const handleStep2Next = (data) => {
    handleUpdateData(data);
    setStep(3);
  };

  const handleComplete = async (data) => {
    try {
      const user = await base44.auth.me();
      
      // Criar registro de documentos
      await base44.entities.DriverDocument.create({
        user_id: user.id,
        driver_license_photo: data.cnh.photo,
        driver_license_number: 'Pending',
        vehicle_plate: 'Pending',
        vehicle_model: 'Pending',
        vehicle_year: 2020,
        vehicle_color: 'Pending',
        vehicle_document_photo: data.crlv.photo,
        verification_status: 'pending'
      });

      // Atualizar usuário
      await base44.auth.updateMe({ 
        user_type: 'both',
        driver_application_status: 'pending',
        phone: data.phone,
        cpf: data.cpf,
        birth_date: data.birth_date
      });

      // Limpar progresso salvo
      localStorage.removeItem('driver_registration_progress');

      toast.success('Cadastro concluído! Aguarde aprovação em até 48h.');
      navigate(createPageUrl('Profile'));
    } catch (error) {
      toast.error('Erro ao finalizar cadastro');
    }
  };

  const stepLabels = [
    'Dados Pessoais',
    'Documentos',
    'Verificação Facial'
  ];

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
            Complete as 3 etapas de verificação
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  step >= s ? 'bg-gradient-to-r from-[#BF3B79] to-[#F22998]' : 'bg-[#F2F2F2]/10'
                }`}>
                  {step > s ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <span className="text-white font-bold">{s}</span>
                  )}
                </div>
                {s < 3 && <div className={`w-20 h-1 transition-all ${step > s ? 'bg-[#F22998]' : 'bg-[#F2F2F2]/10'}`} />}
              </div>
            ))}
          </div>
          
          <p className="text-center text-[#F2F2F2]/60 text-sm">
            {step === 1 ? '✅' : step > 1 ? '✅' : '🔵'} {stepLabels[0]} • 
            {step === 2 ? '🔵' : step > 2 ? '✅' : '⚪'} {stepLabels[1]} • 
            {step === 3 ? '🔵' : '⚪'} {stepLabels[2]}
          </p>
        </div>

        {/* Auto-save indicator */}
        {step > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-sm text-[#F2F2F2]/50 mb-4"
          >
            <Save className="w-4 h-4" />
            Progresso salvo automaticamente
          </motion.div>
        )}

        {/* Etapas */}
        {step === 1 && (
          <Step1PersonalData
            data={formData}
            onUpdate={handleUpdateData}
            onNext={handleStep1Next}
          />
        )}

        {step === 2 && (
          <Step2Documents
            data={formData}
            onUpdate={handleUpdateData}
            onNext={handleStep2Next}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step3FacialVerification
            data={formData}
            onUpdate={handleUpdateData}
            onComplete={handleComplete}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}