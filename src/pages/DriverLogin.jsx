import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Car, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function DriverLogin() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
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
            Dirija com a<br />
            <span className="bg-gradient-to-r from-[#BF3B79] to-[#F22998] bg-clip-text text-transparent">
              Central Dellas
            </span>
          </h1>
          <p className="text-[#F2F2F2]/70 text-lg mb-6">
            Ganhe dinheiro dirigindo em uma plataforma segura e exclusiva para mulheres
          </p>
          <div className="flex items-center gap-4 justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Flexibilidade total</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-[#F22998]" />
              <span className="text-[#F2F2F2]/60">Ganhos justos</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="p-8 bg-[#F2F2F2]/5 border-[#F22998]/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#F2F2F2]">Login de Motorista</h2>
                <p className="text-[#F2F2F2]/60 text-sm">Acesse sua conta</p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              base44.auth.redirectToLogin(window.location.origin + createPageUrl('DriverDashboard'));
            }} className="space-y-4">
              <div>
                <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F22998]" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
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
                    className="pl-10 pr-10 bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
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

              <Button type="submit" className="w-full btn-gradient py-6 text-lg">
                Entrar como Motorista
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to={createPageUrl('PassengerLogin')} className="text-[#F22998] hover:underline">
                É passageira? Clique aqui
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[#F2F2F2]/60 text-sm">
                Ainda não é motorista?{' '}
                <Link to={createPageUrl('DriverRegistration')} className="text-[#F22998] hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}