import { useState, useEffect } from 'react';
import { saveState, restoreState } from '@/utils/stateManager';

/**
 * Hook que persiste estado automaticamente no localStorage.
 * Restaura ao montar e salva automaticamente a cada mudança.
 */
export function usePersistedState(key, initialValue, maxAge = 60 * 60 * 1000) {
  const [state, setState] = useState(() => {
    const restored = restoreState(key, maxAge);
    return restored !== null ? restored : initialValue;
  });

  useEffect(() => {
    saveState(key, state);
  }, [state, key]);

  return [state, setState];
}