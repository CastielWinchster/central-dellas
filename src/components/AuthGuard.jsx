import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useAuthUser() {
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
      setUser(null);
      setError(err);
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

  return { user, isLoading, error, refreshUser };
}