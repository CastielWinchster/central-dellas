import { base44 } from '@/api/base44Client';
import { isDriverOnlineLocal } from '@/lib/driverSession';

/**
 * Mantém motorista "online" no servidor quando o app vai para segundo plano
 * (estilo Uber — não desliga só porque fechou/minimizou).
 */
export function startDriverPresenceKeepalive(userId) {
  if (!userId || !isDriverOnlineLocal(userId)) return () => {};

  const ping = () => {
    base44.functions.invoke('setDriverPresence', { isOnline: true }).catch(() => {});
  };

  const onHide = () => {
    if (document.visibilityState === 'hidden') ping();
  };

  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', ping);

  return () => {
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', ping);
  };
}
