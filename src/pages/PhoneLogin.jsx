import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Phone, MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function PhoneLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const getRawPhone = () => {
    const digits = phone.replace(/\D/g, '');
    return `+55${digits}`;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      toast.error('Digite um telefone válido com DDD');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('gerarCodigoVerificacao', {
        telefone: getRawPhone(),
      });

      if (res.data?.success) {
        setStep('code');
        toast.success('Código enviado por SMS!');
      } else {
        toast.error(res.data?.error || 'Erro ao enviar SMS. Tente novamente.');
      }
    } catch (err) {
      toast.error('Erro ao enviar código. Verifique o número e tente novamente.');
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('validarCodigoVerificacao', {
        telefone: getRawPhone(),
        codigo: code,
      });

      if (res.data?.valido) {
        toast.success('Telefone verificado com sucesso!');
        // Redireciona para o login oficial da Base44 para criar/autenticar a conta
        base44.auth.redirectToLogin(createPageUrl('PassengerHome'));
      } else {
        toast.error(res.data?.erro || 'Código inválido ou expirado. Tente novamente.');
      }
    } catch (err) {
      toast.error('Erro ao validar código.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#1a0a1a] to-[#0D0D0D] flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left - Branding */}
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
            Acesse com<br />
            <span className="bg-gradient-to-r from-[#BF3B79] to-[#F22998] bg-clip-text text-transparent">
              seu telefone
            </span>
          </h1>
          <p className="text-[#F2F2F2]/70 text-lg mb-6">
            Simples, rápido e seguro — sem precisar lembrar senha
          </p>
          <div className="flex flex-col gap-3 justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Código enviado por SMS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Verificação em segundos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">100% seguro</span>
            </div>
          </div>
        </motion.div>

        {/* Right - Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="p-8 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center shadow-lg shadow-[#F22998]/50">
                {step === 'phone' ? <Phone className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#F2F2F2]">
                  {step === 'phone' ? 'Entrar com Telefone' : 'Confirmar Código'}
                </h2>
                <p className="text-[#F2F2F2]/60 text-sm">
                  {step === 'phone' ? 'Digite seu número com DDD' : `Enviamos um SMS para ${phone}`}
                </p>
              </div>
            </div>

            {/* Step: Phone */}
            {step === 'phone' && (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Número de telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F2]/40" />
                    <Input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={handlePhoneChange}
                      maxLength={15}
                      className="pl-10 bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998] text-lg"
                      required
                    />
                  </div>
                  <p className="text-xs text-[#F2F2F2]/40 mt-1">Inclua o DDD. Ex: (16) 99999-9999</p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 text-lg btn-gradient shadow-lg shadow-[#F22998]/30"
                >
                  {loading ? 'Enviando...' : 'Enviar código por SMS'}
                </Button>
              </form>
            )}

            {/* Step: Code */}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div className="bg-[#F22998]/10 border border-[#F22998]/30 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-[#F22998] mx-auto mb-2" />
                  <p className="text-[#F2F2F2]/80 text-sm">
                    Código enviado para <strong className="text-[#F22998]">{phone}</strong>
                  </p>
                </div>

                <div>
                  <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Código de verificação</label>
                  <Input
                    type="number"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.slice(0, 6))}
                    maxLength={6}
                    className="bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998] text-center text-2xl tracking-widest"
                    required
                  />
                  <p className="text-xs text-[#F2F2F2]/40 mt-1 text-center">Digite os 6 dígitos recebidos por SMS</p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-6 text-lg btn-gradient shadow-lg shadow-[#F22998]/30"
                >
                  {loading ? 'Verificando...' : 'Confirmar código'}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('phone'); setCode(''); }}
                  className="w-full flex items-center justify-center gap-2 text-[#F2F2F2]/50 hover:text-[#F22998] text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Usar outro número
                </button>
              </form>
            )}

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-3 border-t border-[#F2F2F2]/10 pt-4">
              <p className="text-[#F2F2F2]/40 text-xs">ou acesse de outra forma</p>
              <Link
                to={createPageUrl('PassengerLogin')}
                className="text-[#F22998] hover:underline text-sm block"
              >
                Entrar com e-mail e senha
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}