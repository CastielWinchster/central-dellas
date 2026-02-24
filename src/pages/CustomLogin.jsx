import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function CustomLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    setLoading(true);
    
    try {
      // Bypass para emails .dev - criar conta automaticamente se não existir
      if (formData.email.endsWith('.dev')) {
        try {
          await base44.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
        } catch (loginError) {
          // Se falhar login, tentar criar a conta automaticamente
          console.log('Conta .dev não existe, criando automaticamente...');
          await base44.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                full_name: formData.email.split('@')[0],
                role: 'passenger'
              },
              emailRedirectTo: undefined // Skip email verification
            }
          });
          
          // Login após criar
          await base44.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
        }
      } else {
        // Login normal
        await base44.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
      }
      
      toast.success('Login realizado com sucesso!');
      window.location.href = createPageUrl('PassengerHome');
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Email ou senha incorretos');
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
            Bem-vinda de volta!
          </h1>
          <p className="text-[#F2F2F2]/70 text-lg mb-6">
            Acesse sua conta e continue sua jornada com segurança
          </p>
          <div className="flex flex-col gap-3 justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Mobilidade segura</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Só mulheres ao volante</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Suporte 24/7</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="p-8 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 backdrop-blur-xl border-[#F22998]/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center shadow-lg shadow-[#F22998]/50">
                <LogIn className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#F2F2F2]">Entrar</h2>
                <p className="text-[#F2F2F2]/60 text-sm">Acesse sua conta</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
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
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <Link
                to={createPageUrl('CustomSignup')}
                className="text-[#F22998] hover:underline block"
              >
                Ainda não tem conta? Cadastre-se
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