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
import BlockedPopup from '../components/registration/BlockedPopup';

export default function DriverRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [attemptRecord, setAttemptRecord] = useState(null);
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

  // Verificar bloqueio e tentativas
  useEffect(() => {
    const checkAttempts = async () => {
      try {
        const user = await base44.auth.me();
        const attempts = await base44.entities.DriverRegistrationAttempt.filter({ user_id: user.id });
        
        if (attempts.length > 0) {
          const record = attempts[0];
          setAttemptRecord(record);
          
          // Verificar se está bloqueada
          if (record.blocked_until) {
            const blockEnd = new Date(record.blocked_until);
            const now = new Date();
            
            if (now < blockEnd) {
              setIsBlocked(true);
              setBlockedUntil(record.blocked_until);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar tentativas:', error);
      }
    };
    
    checkAttempts();
  }, []);

  // Carregar progresso salvo
  useEffect(() => {
    if (isBlocked) return;
    
    const savedProgress = localStorage.getItem('driver_registration_progress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setFormData(parsed.formData);
      setStep(parsed.step);
      toast.success('Progresso carregado!');
    }
  }, [isBlocked]);

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
      
      // Incrementar tentativas
      await incrementAttempt(user.id);
      
      // Salvar todos os dados no banco DriverRegistration
      await base44.entities.DriverRegistration.create({
        user_id: user.id,
        full_name: formData.full_name,
        birth_date: formData.birth_date,
        cpf: formData.cpf,
        phone: formData.phone,
        phone_verified: formData.phone_verified,
        cnh_photo: formData.cnh?.photo,
        cnh_data: formData.cnh?.extracted_data,
        comprovante_photo: formData.comprovante?.photo,
        comprovante_data: formData.comprovante?.extracted_data,
        crlv_photo: formData.crlv?.photo,
        crlv_data: formData.crlv?.extracted_data,
        facial_photo: data.facial_photo,
        facial_verification_data: data.facial_verification_data,
        registration_status: 'pending_review',
        registration_completed_at: new Date().toISOString()
      });
      
      // Criar registro de documentos
      await base44.entities.DriverDocument.create({
        user_id: user.id,
        driver_license_photo: formData.cnh?.photo,
        driver_license_number: formData.cnh?.extracted_data?.document_number || 'Pendente',
        vehicle_plate: formData.crlv?.extracted_data?.plate || 'Pendente',
        vehicle_model: formData.crlv?.extracted_data?.model || 'Pendente',
        vehicle_year: 2020,
        vehicle_color: 'Pendente',
        vehicle_document_photo: formData.crlv?.photo,
        verification_status: 'pending'
      });

      // Atualizar usuário
      await base44.auth.updateMe({ 
        user_type: 'both',
        driver_application_status: 'pending',
        phone: formData.phone,
        cpf: formData.cpf,
        birth_date: formData.birth_date
      });

      // Limpar progresso salvo
      localStorage.removeItem('driver_registration_progress');

      toast.success('Cadastro concluído! Aguarde aprovação em até 48h.');
      navigate(createPageUrl('Profile'));
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      toast.error('Erro ao finalizar cadastro');
      
      // Incrementar tentativa mesmo em caso de erro
      const user = await base44.auth.me();
      await incrementAttempt(user.id);
    }
  };

  const incrementAttempt = async (userId) => {
    try {
      const attempts = await base44.entities.DriverRegistrationAttempt.filter({ user_id: userId });
      
      if (attempts.length === 0) {
        // Criar primeiro registro
        await base44.entities.DriverRegistrationAttempt.create({
          user_id: userId,
          attempt_number: 1,
          total_attempts: 1
        });
      } else {
        const record = attempts[0];
        const newTotal = record.total_attempts + 1;
        
        if (newTotal >= 5) {
          // Bloquear por 10 minutos
          const blockedUntilTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
          await base44.entities.DriverRegistrationAttempt.update(record.id, {
            total_attempts: newTotal,
            attempt_number: newTotal,
            blocked_until: blockedUntilTime
          });
          
          setIsBlocked(true);
          setBlockedUntil(blockedUntilTime);
          toast.error('Limite de tentativas excedido! Você foi bloqueada por 10 minutos.');
        } else {
          await base44.entities.DriverRegistrationAttempt.update(record.id, {
            total_attempts: newTotal,
            attempt_number: newTotal
          });
          
          const remaining = 5 - newTotal;
          toast.warning(`Tentativa ${newTotal}/5. ${remaining} tentativas restantes.`);
        }
      }
    } catch (error) {
      console.error('Erro ao incrementar tentativa:', error);
    }
  };

  const handleBlockedClose = () => {
    setIsBlocked(false);
    setBlockedUntil(null);
    window.location.reload();
  };

  const stepLabels = [
    'Dados Pessoais',
    'Documentos',
    'Verificação Facial'
  ];

  if (isBlocked && blockedUntil) {
    return <BlockedPopup blockedUntil={blockedUntil} onClose={handleBlockedClose} />;
  }

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