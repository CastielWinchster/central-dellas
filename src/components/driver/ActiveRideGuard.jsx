import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getActiveRideLocal } from '@/lib/driverSession';

/**
 * Redireciona motorista de volta à corrida ativa se ela existir no localStorage.
 */
export default function ActiveRideGuard({ userId, enabled }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!enabled || !userId) return;

    const active = getActiveRideLocal();
    if (!active?.id) return;

    const onActiveRidePage = location.pathname.startsWith('/ActiveRideDriver');
    if (!onActiveRidePage) {
      navigate(`/ActiveRideDriver?id=${active.id}`, { replace: true });
    }
  }, [enabled, userId, location.pathname, navigate]);

  return null;
}
