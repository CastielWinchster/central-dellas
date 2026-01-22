import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { User, CheckCircle, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function Step1PersonalData({ data, onUpdate, onNext }) {
  const [formData, setFormData] = useState({
    full_name: data.full_name || '',
    birth_date: data.birth_date || '',
    cpf: data.cpf || '',
    email: data.email || '',
    phone: data.phone || '',
    phone_verified: data.phone_verified || false,
    agrees_woman: data.agrees_woman || false
  });

  const [validation, setValidation] = useState({
    full_name: null,
    birth_date: null,
    cpf: null,
    email: null,
    phone: null
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Validar nome
  const validateName = (name) => {
    if (!name) return null;
    if (name.length < 5) return false;
    if (name.length > 100) return false;
    if (!/^[a-záàâãéèêíïóôõöúçñ\s]+$/i.test(name)) return false;
    return true;
  };

  // Validar idade (mínimo 18 anos)
  const validateAge = (date) => {
    if (!date) return null;
    const birth = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 18;
  };

  // Validar CPF
  const validateCPF = (cpf) => {
    if (!cpf) return null;
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Validação básica de CPF (dígitos verificadores)
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
  };

  // Validar email
  const validateEmail = (email) => {
    if (!email) return null;
    const emailRegex = /^[a-z][a-z0-9._-]*@[a-z0-9.-]+\.[a-z]{2,}$/i;
    return emailRegex.test(email);
  };

  // Validar telefone
  const validatePhone = (phone) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 11;
  };

  // Formatar CPF
  const formatCPF = (value) => {
    const clean = value.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  };

  // Formatar telefone
  const formatPhone = (value) => {
    const clean = value.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 2) return clean;
    if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  };

  // Atualizar campo
  const handleChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    }
    
    setFormData({ ...formData, [field]: formattedValue });
    onUpdate({ ...data, [field]: formattedValue });
  };

  // Validar todos os campos
  useEffect(() => {
    setValidation({
      full_name: validateName(formData.full_name),
      birth_date: validateAge(formData.birth_date),
      cpf: validateCPF(formData.cpf),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone)
    });
  }, [formData]);

  // Enviar código de verificação via SMS
  const handleSendCode = async () => {
    if (!validation.phone) {
      toast.error('Digite um telefone válido');
      return;
    }
    
    setSendingCode(true);
    try {
      const response = await base44.functions.invoke('sendSMSCode', {
        telefone: formData.phone
      });
      
      if (response.data.sucesso) {
        setShowVerificationInput(true);
        toast.success(response.data.mensagem);
        toast.info('💬 Abra o chat com a Délia e peça: "qual é meu código?"', { duration: 6000 });
      } else {
        toast.error(response.data.erro || 'Erro ao enviar código');
      }
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      toast.error('Erro ao enviar código. Tente novamente.');
    }
    setSendingCode(false);
  };

  // Verificar código via SMS automaticamente
  const handleVerifyCode = async (codigo) => {
    if (codigo.length !== 6) return;

    setVerifyingCode(true);
    try {
      const response = await base44.functions.invoke('verifySMSCode', {
        telefone: formData.phone,
        codigo: codigo
      });

      if (response.data.sucesso) {
        setFormData({ ...formData, phone_verified: true });
        onUpdate({ ...data, phone_verified: true });
        toast.success(response.data.mensagem);
        setShowVerificationInput(false);
        setVerificationCode('');
      } else {
        toast.error(response.data.erro || 'Código incorreto');
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast.error('Erro ao verificar código. Tente novamente.');
    }
    setVerifyingCode(false);
  };

  // Verificar se pode prosseguir
  const canProceed = () => {
    const isFullNameValid = validation.full_name === true;
    const isBirthDateValid = validation.birth_date === true;
    const isCpfValid = validation.cpf === true;
    const isEmailValid = validation.email === true;
    const isPhoneValid = validation.phone === true;
    const isPhoneVerified = formData.phone_verified === true;
    const agreesWoman = formData.agrees_woman === true;

    console.log("🔍 Validação do Formulário:", {
      isFullNameValid,
      isBirthDateValid,
      isCpfValid,
      isEmailValid,
      isPhoneValid,
      isPhoneVerified,
      agreesWoman,
      formData,
      validation
    });

    return (
      isFullNameValid &&
      isBirthDateValid &&
      isCpfValid &&
      isEmailValid &&
      isPhoneValid &&
      isPhoneVerified &&
      agreesWoman
    );
  };

  useEffect(() => {
    const result = canProceed();
    console.log("✅ Pode prosseguir?", result);
  }, [validation, formData]);

  const getAgeWarning = () => {
    if (!formData.birth_date) return null;
    const birth = new Date(formData.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (age < 18) return 'Idade mínima é 18 anos para ser motorista';
    if (age > 65) return 'Aviso: Motoristas com mais de 65 anos requerem verificação adicional';
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card className="bg-[#0D0D0D] border-[#F22998]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F2F2F2]">
            <User className="w-5 h-5 text-[#F22998]" />
            Etapa 1: Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome Completo */}
          <div>
            <label className="text-sm text-[#F2F2F2]/70 mb-2 block">
              Nome Completo *
            </label>
            <div className="relative">
              <Input
                placeholder="Seu nome completo"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className={`bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] pr-10 ${
                  validation.full_name === true ? 'border-green-500' :
                  validation.full_name === false ? 'border-red-500' : ''
                }`}
                maxLength={100}
              />
              {validation.full_name === true && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
              )}
              {validation.full_name === false && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
              )}
            </div>
            {validation.full_name === false && (
              <p className="text-xs text-red-400 mt-1">Nome inválido. Use apenas letras (mín. 5 caracteres).</p>
            )}
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="text-sm text-[#F2F2F2]/70 mb-2 block">
              Data de Nascimento *
            </label>
            <div className="relative">
              <Input
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
                className={`bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] pr-10 ${
                  validation.birth_date === true ? 'border-green-500' :
                  validation.birth_date === false ? 'border-red-500' : ''
                }`}
                max={new Date().toISOString().split('T')[0]}
              />
              {validation.birth_date === true && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
              )}
            </div>
            {getAgeWarning() && (
              <p className={`text-xs mt-1 ${
                validation.birth_date === false ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {getAgeWarning()}
              </p>
            )}
          </div>

          {/* CPF */}
          <div>
            <label className="text-sm text-[#F2F2F2]/70 mb-2 block">
              CPF *
            </label>
            <div className="relative">
              <Input
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                className={`bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] pr-10 ${
                  validation.cpf === true ? 'border-green-500' :
                  validation.cpf === false ? 'border-red-500' : ''
                }`}
              />
              {validation.cpf === true && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
              )}
              {validation.cpf === false && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
              )}
            </div>
            {validation.cpf === false && (
              <p className="text-xs text-red-400 mt-1">CPF inválido. Verifique os dígitos.</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-[#F2F2F2]/70 mb-2 block">
              Email *
            </label>
            <div className="relative">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] pr-10 ${
                  validation.email === true ? 'border-green-500' :
                  validation.email === false ? 'border-red-500' : ''
                }`}
              />
              {validation.email === true && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
              )}
              {validation.email === false && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
              )}
            </div>
            {validation.email === false && (
              <p className="text-xs text-red-400 mt-1">Email inválido.</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="text-sm text-[#F2F2F2]/70 mb-2 block">
              Telefone (WhatsApp) *
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={formData.phone_verified}
                  className={`bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] pr-10 ${
                    formData.phone_verified ? 'opacity-70' :
                    validation.phone === true ? 'border-green-500' :
                    validation.phone === false ? 'border-red-500' : ''
                  }`}
                />
                {formData.phone_verified && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                )}
              </div>
              {!formData.phone_verified && (
                <Button
                  onClick={handleSendCode}
                  disabled={!validation.phone || sendingCode}
                  className="btn-gradient shrink-0"
                >
                  {sendingCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Enviar Código
                    </>
                  )}
                </Button>
              )}
            </div>
            {validation.phone === false && !formData.phone_verified && (
              <p className="text-xs text-red-400 mt-1">Telefone inválido (deve ter 11 dígitos).</p>
            )}
          </div>

          {/* Verificação de código */}
          {showVerificationInput && !formData.phone_verified && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <div className="relative">
                <Input
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const codigo = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(codigo);
                    if (codigo.length === 6) {
                      handleVerifyCode(codigo);
                    }
                  }}
                  disabled={verifyingCode}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] text-center text-lg tracking-widest pr-10"
                  maxLength={6}
                />
                {verifyingCode && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F22998] animate-spin" />
                )}
              </div>
              {verifyingCode && (
                <p className="text-sm text-[#F22998] text-center">
                  Verificando código...
                </p>
              )}
            </motion.div>
          )}

          {/* Checkbox de confirmação */}
          <div className="p-4 rounded-xl bg-[#F22998]/10 border border-[#F22998]/30">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={formData.agrees_woman}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, agrees_woman: checked });
                  onUpdate({ ...data, agrees_woman: checked });
                }}
                className="mt-1 border-white data-[state=checked]:bg-[#F22998] data-[state=checked]:border-[#F22998]"
              />
              <label className="text-sm text-[#F2F2F2] cursor-pointer">
                Eu sou uma mulher e declaro que sou motorista profissional. Entendo que a Central Dellas é exclusiva para mulheres motoristas.
              </label>
            </div>
          </div>

          {!formData.agrees_woman && (
            <p className="text-xs text-[#F22998] text-center">
              É obrigatório confirmar que você é mulher para prosseguir
            </p>
          )}

          {/* Botão Próximo */}
          <Button
            onClick={() => onNext(formData)}
            disabled={!canProceed()}
            className={`w-full py-6 ${
              canProceed() ? 'btn-gradient' : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            Próximo
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}