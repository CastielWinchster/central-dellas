import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Shield, Check, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PassengerSecurity() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const calculateStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthLabel = (strength) => {
    if (strength <= 2) return { label: 'Fraca', color: 'text-red-400' };
    if (strength <= 3) return { label: 'Média', color: 'text-yellow-400' };
    return { label: 'Forte', color: 'text-green-400' };
  };

  const strength = calculateStrength(newPassword);
  const strengthInfo = getStrengthLabel(strength);

  const requirements = [
    { label: 'Mínimo 8 caracteres', met: newPassword.length >= 8 },
    { label: 'Uma letra maiúscula', met: /[A-Z]/.test(newPassword) },
    { label: 'Uma letra minúscula', met: /[a-z]/.test(newPassword) },
    { label: 'Um número', met: /[0-9]/.test(newPassword) },
    { label: 'Um caractere especial', met: /[^a-zA-Z0-9]/.test(newPassword) }
  ];

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Digite sua senha atual');
      return;
    }
    
    if (strength < 4) {
      toast.error('Sua nova senha não atende todos os requisitos');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    setLoading(true);
    try {
      // Base44 password change via auth
      await base44.auth.updatePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao alterar senha. Verifique sua senha atual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('PassengerOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Alterar Senha</h1>
        </div>

        <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-[#F22998]" />
            <div>
              <h3 className="font-semibold text-[#F2F2F2]">Segurança da Conta</h3>
              <p className="text-sm text-[#F2F2F2]/60">Proteja sua conta com uma senha forte</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Senha Atual</label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] pr-10"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F2F2F2]/40 hover:text-[#F2F2F2]"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Nova Senha</label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] pr-10"
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F2F2F2]/40 hover:text-[#F2F2F2]"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#F2F2F2]/60">Força da senha:</span>
                    <span className={`text-xs font-medium ${strengthInfo.color}`}>
                      {strengthInfo.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength 
                            ? strength <= 2 ? 'bg-red-400' : strength <= 3 ? 'bg-yellow-400' : 'bg-green-400'
                            : 'bg-[#F2F2F2]/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Confirmar Nova Senha</label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] pr-10"
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F2F2F2]/40 hover:text-[#F2F2F2]"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {newPassword && (
            <Card className="mt-4 p-4 bg-[#0D0D0D] border-[#F22998]/10 rounded-xl">
              <p className="text-xs text-[#F2F2F2]/60 mb-2 font-medium">Requisitos da senha:</p>
              <div className="space-y-1">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {req.met ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-[#F2F2F2]/30" />
                    )}
                    <span className={`text-xs ${req.met ? 'text-green-400' : 'text-[#F2F2F2]/60'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full btn-gradient py-6 rounded-2xl mt-6"
          >
            {loading ? 'Alterando...' : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Alterar Senha
              </>
            )}
          </Button>
        </Card>

        {/* Tips */}
        <Card className="p-4 bg-blue-500/10 border-blue-500/30 rounded-2xl">
          <h4 className="text-sm font-semibold text-blue-200 mb-2">💡 Dicas de Segurança</h4>
          <ul className="text-xs text-blue-200/70 space-y-1">
            <li>• Use uma combinação única de letras, números e símbolos</li>
            <li>• Não reutilize senhas de outras contas</li>
            <li>• Evite informações pessoais óbvias</li>
            <li>• Troque sua senha regularmente</li>
          </ul>
        </Card>

        {/* Forgot Password Link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => toast.info('Funcionalidade em breve')}
            className="text-sm text-[#F22998] hover:text-[#BF3B79] transition-colors"
          >
            Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  );
}