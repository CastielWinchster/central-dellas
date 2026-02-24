import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function CustomSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Verificar se já está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          navigate(createPageUrl('PassengerHome'));
        }
      } catch (err) {
        // Não autenticado, ok
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      // Criar conta usando Base44 Auth
      const { user } = await base44.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: 'passenger'
          }
        }
      });

      // Atualizar o perfil do usuário no User entity
      if (user) {
        try {
          await base44.auth.updateMe({
            full_name: formData.full_name,
            role: 'passenger'
          });
        } catch (updateError) {
          console.warn('Erro ao atualizar perfil:', updateError);
        }
      }

      toast.success('Conta criada com sucesso!');
      window.location.href = createPageUrl('PassengerHome');
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast.error(error.message || 'Erro ao criar conta. Email pode já estar em uso.');
      setLoading(false);
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
            Junte-se a nós!
          </h1>
          <p className="text-[#F2F2F2]/70 text-lg mb-6">
            Crie sua conta e viaje com segurança e conforto
          </p>
          <div className="flex flex-col gap-3 justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Cadastro rápido e simples</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">100% seguro e verificado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Comece a viajar em minutos</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Signup Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="p-8 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center shadow-lg shadow-[#F22998]/50">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#F2F2F2]">Criar Conta</h2>
                <p className="text-[#F2F2F2]/60 text-sm">Cadastre-se gratuitamente</p>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F2]/40" />
                  <Input
                    placeholder="Seu nome completo"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="pl-10 bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F2]/40" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F2]/40" />
                  <Input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F2F2F2]/40" />
                  <Input
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998]"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full btn-gradient py-6 text-lg shadow-lg shadow-[#F22998]/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <Link
                to={createPageUrl('CustomLogin')}
                className="text-[#F22998] hover:underline block"
              >
                Já tem conta? Faça login
              </Link>
              
              <Link 
                to={createPageUrl('PassengerHome')}
                className="text-[#F2F2F2]/60 hover:text-[#F22998] text-sm block"
              >
                Voltar para o início
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}