import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isAdminPanelUnlocked, unlockAdminPanel } from '@/lib/adminGate';

export default function AdminPasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => isAdminPanelUnlocked());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  if (unlocked) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    setChecking(true);
    setError('');

    const ok = unlockAdminPanel(password);
    if (ok) {
      setUnlocked(true);
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#1a1a1a] rounded-3xl border border-[#F472B6]/20 p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#F472B6] flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#F2F2F2]">Área Administrativa</h1>
            <p className="text-[#F2F2F2]/50 text-sm mt-2">
              Digite a senha do painel para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F472B6]/60" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha do painel"
                autoComplete="current-password"
                className="pl-10 pr-10 bg-[#0D0D0D] border-[#F472B6]/30 text-[#F2F2F2] placeholder:text-[#F2F2F2]/30 focus:border-[#F472B6]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F2F2F2]/40 hover:text-[#F472B6]"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={!password.trim() || checking}
              className="w-full py-6 rounded-2xl btn-gradient text-base font-semibold"
            >
              {checking ? 'Verificando...' : 'Entrar no painel'}
            </Button>
          </form>

          <p className="text-[#F2F2F2]/30 text-xs text-center mt-6">
            Acesso restrito à equipe Central Dellas
          </p>
        </div>
      </motion.div>
    </div>
  );
}
