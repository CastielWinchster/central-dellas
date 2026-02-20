import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (err) {
      // Só define erro se for realmente falta de autenticação
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setUser(null);
        setError(err);
      } else {
        // Erros genéricos não limpam o usuário
        console.error('Erro ao carregar usuário:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = () => {
    return loadUser();
  };

  const value = {
    user,
    isLoading,
    error,
    refreshUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthUser() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthUser must be used within AuthProvider');
  }
  return context;
}