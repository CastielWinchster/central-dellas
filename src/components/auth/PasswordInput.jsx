import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';

export default function PasswordInput({ 
  value, 
  onChange, 
  showRequirements = false,
  confirmPassword = '',
  onConfirmChange = null,
  showConfirm = false
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    noSpaces: true,
    noAccents: true
  });
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    validatePassword(value);
  }, [value]);

  const validatePassword = (password) => {
    const reqs = {
      length: password.length >= 8 && password.length <= 128,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
      noSpaces: !/\s/.test(password),
      noAccents: !/[àáâãäåèéêëìíîïòóôõöùúûüýÿçñ]/i.test(password)
    };

    setRequirements(reqs);

    // Calcular força
    const score = Object.values(reqs).filter(Boolean).length;
    setStrength(score);
  };

  const getStrengthColor = () => {
    if (strength <= 3) return 'bg-red-500';
    if (strength <= 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength <= 3) return 'Fraca';
    if (strength <= 5) return 'Média';
    return 'Forte';
  };

  const allRequirementsMet = Object.values(requirements).every(Boolean);
  const passwordsMatch = !showConfirm || (confirmPassword && confirmPassword === value);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F22998]" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`pl-10 pr-10 bg-[#0D0D0D] ${
              value && allRequirementsMet ? 'border-green-500' : 'border-[#F22998]/30'
            } text-[#F2F2F2] focus:border-[#F22998]`}
            required
            maxLength={128}
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

      {showRequirements && value && (
        <>
          {/* Força da senha */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#F2F2F2]/60">Força da senha</span>
              <span className={`text-xs font-medium ${
                strength <= 3 ? 'text-red-500' : strength <= 5 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {getStrengthLabel()}
              </span>
            </div>
            <div className="h-2 bg-[#F2F2F2]/10 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getStrengthColor()} transition-all`}
                style={{ width: `${(strength / 7) * 100}%` }}
              />
            </div>
          </div>

          {/* Checklist de requisitos */}
          <div className="bg-[#F2F2F2]/5 rounded-lg p-3 space-y-1">
            <p className="text-xs text-[#F2F2F2]/60 mb-2">Requisitos da senha:</p>
            <RequirementItem met={requirements.length} text="Mínimo 8 caracteres (máx 128)" />
            <RequirementItem met={requirements.uppercase} text="1 letra maiúscula (A-Z)" />
            <RequirementItem met={requirements.lowercase} text="1 letra minúscula (a-z)" />
            <RequirementItem met={requirements.number} text="1 número (0-9)" />
            <RequirementItem met={requirements.special} text="1 caractere especial (!@#$%^&*)" />
            <RequirementItem met={requirements.noSpaces} text="Sem espaços em branco" />
            <RequirementItem met={requirements.noAccents} text="Sem acentos (ç, ã, é, etc.)" />
          </div>
        </>
      )}

      {showConfirm && (
        <div>
          <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Confirme sua senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F22998]" />
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => onConfirmChange(e.target.value)}
              className={`pl-10 pr-10 bg-[#0D0D0D] ${
                confirmPassword && passwordsMatch ? 'border-green-500' : 
                confirmPassword && !passwordsMatch ? 'border-red-500' : 'border-[#F22998]/30'
              } text-[#F2F2F2] focus:border-[#F22998]`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F22998]"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword && (
            <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
              {passwordsMatch ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> Senhas correspondem
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <X className="w-3 h-3" /> As senhas não correspondem
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RequirementItem({ met, text }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-red-500" />
      )}
      <span className={`text-xs ${met ? 'text-green-500' : 'text-[#F2F2F2]/60'}`}>
        {text}
      </span>
    </div>
  );
}