import { base44 } from '@/api/base44Client';
import { isDriverOnlineLocal } from '@/lib/driverSession';

const PING_INTERVAL_MS = 12000;

/**
 * Mantém motorista online no servidor fora do DriverDashboard
 * (intervalo + eventos de segundo plano, estilo Uber).
 */
export function startDriverPresenceKeepalive(userId) {
  if (!userId || !isDriverOnlineLocal(userId)) return () => {};

  const ping = () => {
    if (!isDriverOnlineLocal(userId)) return;
    base44.functions.invoke('setDriverPresence', { isOnline: true }).catch(() => {});
  };

  ping();
  const intervalId = setInterval(ping, PING_INTERVAL_MS);

  const onHide = () => {
    if (document.visibilityState === 'hidden') ping();
  };

  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', ping);

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', ping);
  };
}
