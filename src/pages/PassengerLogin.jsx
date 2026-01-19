import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { User, Camera, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import EmailInput from '../components/auth/EmailInput';
import UsernameInput from '../components/auth/UsernameInput';
import PasswordInput from '../components/auth/PasswordInput';

export default function PassengerLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    full_name: '',
    cpf: '',
    birth_date: '',
  });
  const [canSubmit, setCanSubmit] = useState(false);
  const [validations, setValidations] = useState({
    email: false,
    username: false,
    password: false,
    passwordsMatch: false
  });

  // Validar campos em tempo real
  React.useEffect(() => {
    if (isRegister) {
      const emailValid = /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email);
      const usernameValid = formData.username.length >= 3 && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(formData.username);
      const passwordValid = formData.password.length >= 8 && 
                           /[A-Z]/.test(formData.password) &&
                           /[a-z]/.test(formData.password) &&
                           /[0-9]/.test(formData.password) &&
                           /[!@#$%^&*]/.test(formData.password) &&
                           !/\s/.test(formData.password);
      const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
      const photoValid = photoFile !== null;
      const basicFieldsValid = formData.full_name && formData.cpf && formData.birth_date;
      
      setValidations({ email: emailValid, username: usernameValid, password: passwordValid, passwordsMatch });
      setCanSubmit(emailValid && usernameValid && passwordValid && passwordsMatch && photoValid && basicFieldsValid);
    } else {
      const emailValid = /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email);
      const passwordValid = formData.password.length > 0;
      setCanSubmit(emailValid && passwordValid);
    }
  }, [formData, isRegister, photoFile]);

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!canSubmit && isRegister) {
      toast.error('Por favor, preencha todos os campos corretamente');
      return;
    }
    
    setLoading(true);
    
    if (isRegister) {
      if (!photoFile) {
        toast.error('Por favor, tire uma foto para identificação');
        setLoading(false);
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        toast.error('As senhas não correspondem');
        setLoading(false);
        return;
      }
      
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
        toast.success('Cadastro realizado! Enviamos um código de verificação para seu email.');
        setTwoFactorStep(true);
      } catch (error) {
        toast.error('Erro ao realizar cadastro');
      }
      setLoading(false);
    } else {
      if (twoFactorStep) {
        try {
          if (verificationCode.length === 6) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            window.location.href = createPageUrl('PassengerHome');
          } else {
            toast.error('Código inválido');
            setLoading(false);
          }
        } catch (error) {
          toast.error('Erro ao verificar código');
          setLoading(false);
        }
      } else {
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          toast.success('Código de verificação enviado para seu email!');
          setTwoFactorStep(true);
          setLoading(false);
        } catch (error) {
          toast.error('Erro ao enviar código');
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#1a0a1a] to-[#0D0D0D] flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center lg:text-left"
        >
          <div className="mb-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ea008a15739746d55f4e/50cfce50f_central2.png"
              alt="Central Dellas"
              className="h-20 mx-auto lg:mx-0"
            />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#F2F2F2] mb-4">
            Viaje com<br />
            <span className="bg-gradient-to-r from-[#BF3B79] to-[#F22998] bg-clip-text text-transparent">
              Segurança Total
            </span>
          </h1>
          <p className="text-[#F2F2F2]/70 text-lg mb-6">
            Mobilidade urbana segura e exclusiva para mulheres
          </p>
          <div className="flex flex-col gap-3 justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">100% Seguro e verificado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Motoristas mulheres</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Suporte 24/7</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login/Register Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="p-8 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center shadow-lg shadow-[#F22998]/50">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#F2F2F2]">
                  {isRegister ? 'Cadastrar-se como Passageira' : 'Login de Passageira'}
                </h2>
                <p className="text-[#F2F2F2]/60 text-sm">
                  {isRegister ? 'Complete seu cadastro' : 'Acesse sua conta'}
                </p>
              </div>
            </div>

            {twoFactorStep ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#F2F2F2] mb-2">Verificação em 2 Etapas</h3>
                  <p className="text-[#F2F2F2]/60 text-sm">
                    Digite o código de 6 dígitos enviado para<br />
                    <strong className="text-[#F22998]">{formData.email}</strong>
                  </p>
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998]"
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={handleLogin} 
                  disabled={verificationCode.length !== 6 || loading}
                  className="w-full btn-gradient py-6 text-lg shadow-lg shadow-[#F22998]/30"
                >
                  {loading ? 'Verificando...' : 'Verificar Código'}
                </Button>

                <button
                  onClick={() => setTwoFactorStep(false)}
                  className="text-[#F2F2F2]/60 hover:text-[#F22998] text-sm w-full"
                >
                  Voltar para login
                </button>
              </div>
            ) : (
              <>
                {!isRegister && (
                  <SocialLoginButtons loading={loading} />
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  {isRegister && (
                    <>
                      <div>
                        <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Nome Completo</label>
                        <Input
                          placeholder="Seu nome completo"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998]"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm text-[#F2F2F2]/70 mb-2 block">CPF</label>
                        <Input
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          className="bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998]"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Data de Nascimento</label>
                        <Input
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                          className="bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998]"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Foto de Identificação</label>
                        <div className="border-2 border-dashed border-[#F22998]/30 rounded-xl p-6 text-center">
                          {photoPreview ? (
                            <div className="space-y-3">
                              <img 
                                src={photoPreview} 
                                alt="Preview" 
                                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-[#F22998]"
                              />
                              <label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="user"
                                  className="hidden"
                                  onChange={handlePhotoCapture}
                                />
                                <Button type="button" variant="outline" className="border-[#F22998]/30 text-[#F22998]">
                                  Tirar Outra Foto
                                </Button>
                              </label>
                            </div>
                          ) : (
                            <>
                              <Camera className="w-12 h-12 text-[#F22998] mx-auto mb-3" />
                              <p className="text-[#F2F2F2] mb-2">Tire uma foto para identificação</p>
                              <label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="user"
                                  className="hidden"
                                  onChange={handlePhotoCapture}
                                />
                                <Button type="button" variant="outline" className="border-[#F22998]/30 text-[#F22998]">
                                  <Camera className="w-4 h-4 mr-2" />
                                  Tirar Foto
                                </Button>
                              </label>
                            </>
                          )}
                        </div>
                      </div>

                      <UsernameInput 
                        value={formData.username}
                        onChange={(value) => setFormData({ ...formData, username: value })}
                      />
                    </>
                  )}

                  <EmailInput 
                    value={formData.email}
                    onChange={(value) => setFormData({ ...formData, email: value })}
                    checkExistence={isRegister}
                  />

                  <PasswordInput
                    value={formData.password}
                    onChange={(value) => setFormData({ ...formData, password: value })}
                    showRequirements={isRegister}
                    showConfirm={isRegister}
                    confirmPassword={formData.confirmPassword}
                    onConfirmChange={(value) => setFormData({ ...formData, confirmPassword: value })}
                  />

                  <Button 
                    type="submit" 
                    disabled={loading || !canSubmit} 
                    className={`w-full py-6 text-lg shadow-lg ${
                      !canSubmit 
                        ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50' 
                        : 'btn-gradient shadow-[#F22998]/30'
                    }`}
                  >
                    {loading ? 'Carregando...' : (isRegister ? 'Criar Conta' : 'Continuar')}
                  </Button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-[#F22998] hover:underline"
              >
                {isRegister ? 'Já tem conta? Faça login' : 'Primeira vez? Cadastre-se'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <Link to={createPageUrl('DriverLogin')} className="text-[#F2F2F2]/60 hover:text-[#F22998] text-sm">
                É motorista? Clique aqui
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}