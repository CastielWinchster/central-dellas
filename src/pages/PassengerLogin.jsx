import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Shield, Heart, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function PassengerLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    cpf: '',
    birth_date: '',
  });

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
    
    if (isRegister) {
      // Simulate registration
      if (!photoFile) {
        toast.error('Por favor, tire uma foto para identificação');
        return;
      }
      
      try {
        // Upload photo
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
        
        // In real app, would create user with photo
        toast.success('Cadastro realizado! Faça login para continuar.');
        setIsRegister(false);
      } catch (error) {
        toast.error('Erro ao realizar cadastro');
      }
    } else {
      // Login via Base44 OAuth
      base44.auth.redirectToLogin(window.location.origin + createPageUrl('PassengerHome'));
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
                  {isRegister ? 'Cadastro de Passageira' : 'Login de Passageira'}
                </h2>
                <p className="text-[#F2F2F2]/60 text-sm">
                  {isRegister ? 'Complete seu cadastro' : 'Acesse sua conta'}
                </p>
              </div>
            </div>

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
                </>
              )}

              <div>
                <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F22998]" />
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
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F22998]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2] focus:border-[#F22998]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F22998]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full btn-gradient py-6 text-lg shadow-lg shadow-[#F22998]/30">
                {isRegister ? 'Criar Conta' : 'Entrar'}
              </Button>
            </form>

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