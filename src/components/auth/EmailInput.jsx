import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Mail, Check, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EmailInput({ value, onChange, checkExistence = false }) {
  const [validation, setValidation] = useState({ valid: false, message: '', checking: false });

  useEffect(() => {
    validateEmail(value);
  }, [value]);

  const validateEmail = async (email) => {
    if (!email) {
      setValidation({ valid: false, message: '', checking: false });
      return;
    }

    // Verifica se começa com número
    if (/^[0-9]/.test(email)) {
      setValidation({ 
        valid: false, 
        message: 'Email não pode começar com números. Use apenas letras.', 
        checking: false 
      });
      return;
    }

    // Valida formato básico
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setValidation({ 
        valid: false, 
        message: 'Email inválido. Verifique o formato.', 
        checking: false 
      });
      return;
    }

    // Se deve verificar existência
    if (checkExistence) {
      setValidation({ valid: false, message: '', checking: true });
      try {
        const response = await base44.functions.invoke('checkEmailAvailability', { email });
        if (response.data.exists) {
          setValidation({ 
            valid: false, 
            message: 'Este email já está cadastrado. Faça login ou use outro email.', 
            checking: false 
          });
        } else {
          setValidation({ valid: true, message: 'Email disponível', checking: false });
        }
      } catch (error) {
        setValidation({ valid: true, message: '', checking: false });
      }
    } else {
      setValidation({ valid: true, message: 'Email válido', checking: false });
    }
  };

  const getBorderColor = () => {
    if (!value) return 'border-[#F22998]/30';
    if (validation.checking) return 'border-blue-500';
    if (validation.valid) return 'border-green-500';
    return 'border-red-500';
  };

  const getIcon = () => {
    if (validation.checking) return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    if (validation.valid && value) return <Check className="w-5 h-5 text-green-500" />;
    if (!validation.valid && value && !validation.checking) return <X className="w-5 h-5 text-red-500" />;
    return <Mail className="w-5 h-5 text-[#F22998]" />;
  };

  return (
    <div>
      <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Email</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {getIcon()}
        </div>
        <Input
          type="email"
          placeholder="seu@email.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pl-10 bg-[#0D0D0D] ${getBorderColor()} text-[#F2F2F2] focus:border-[#F22998]`}
          required
        />
      </div>
      {validation.message && (
        <p className={`text-xs mt-1 ${validation.valid ? 'text-green-500' : 'text-red-500'}`}>
          {validation.message}
        </p>
      )}
    </div>
  );
}