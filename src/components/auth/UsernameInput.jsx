import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { User, Check, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function UsernameInput({ value, onChange }) {
  const [validation, setValidation] = useState({ valid: false, message: '', checking: false });
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      validateUsername(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  const validateUsername = async (username) => {
    if (!username) {
      setValidation({ valid: false, message: '', checking: false });
      setSuggestions([]);
      return;
    }

    // Verifica comprimento
    if (username.length < 3) {
      setValidation({ 
        valid: false, 
        message: `Username muito curto (${username.length}/20 - mínimo 3 caracteres)`, 
        checking: false 
      });
      setSuggestions([]);
      return;
    }

    if (username.length > 20) {
      setValidation({ 
        valid: false, 
        message: 'Username muito longo (máximo 20 caracteres)', 
        checking: false 
      });
      setSuggestions([]);
      return;
    }

    // Verifica se começa com número
    if (/^[0-9]/.test(username)) {
      setValidation({ 
        valid: false, 
        message: 'Username não pode começar com números', 
        checking: false 
      });
      setSuggestions([]);
      return;
    }

    // Valida caracteres permitidos
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
    if (!usernameRegex.test(username)) {
      setValidation({ 
        valid: false, 
        message: 'Caracteres inválidos: espaços e acentos não permitidos. Use apenas letras, números, _ e -', 
        checking: false 
      });
      setSuggestions([]);
      return;
    }

    // Verifica disponibilidade
    setValidation({ valid: false, message: '', checking: true });
    try {
      const response = await base44.functions.invoke('checkUsernameAvailability', { username });
      if (response.data.available) {
        setValidation({ valid: true, message: `Username disponível (${username.length}/20)`, checking: false });
        setSuggestions([]);
      } else {
        setValidation({ 
          valid: false, 
          message: 'Este username já está em uso. Tente outro.', 
          checking: false 
        });
        // Gerar sugestões
        setSuggestions([
          `${username}_1`,
          `${username}_2`,
          `${username}.dellas`,
          `dellas_${username}`
        ]);
      }
    } catch (error) {
      setValidation({ valid: true, message: `Username válido (${username.length}/20)`, checking: false });
      setSuggestions([]);
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
    return <User className="w-5 h-5 text-[#F22998]" />;
  };

  return (
    <div>
      <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Nome de Usuário</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {getIcon()}
        </div>
        <Input
          type="text"
          placeholder="usuario_nome"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className={`pl-10 bg-[#0D0D0D] ${getBorderColor()} text-[#F2F2F2] focus:border-[#F22998]`}
          required
          maxLength={20}
        />
      </div>
      {validation.message && (
        <p className={`text-xs mt-1 ${validation.valid ? 'text-green-500' : 'text-red-500'}`}>
          {validation.message}
        </p>
      )}
      {suggestions.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-[#F2F2F2]/60">Sugestões disponíveis:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChange(suggestion)}
                className="text-xs border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}