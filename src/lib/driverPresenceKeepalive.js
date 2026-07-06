import { base44 } from '@/api/base44Client';
import { isDriverOnlineLocal, getDriverLastLocation, hasActiveRideLocal } from '@/lib/driverSession';

const PING_INTERVAL_MS = 45000;

/**
 * Mantém motorista online no servidor fora do DriverDashboard
 * (intervalo + eventos de segundo plano, estilo Uber).
 */
export function startDriverPresenceKeepalive(userId) {
  if (!userId || !isDriverOnlineLocal(userId)) return () => {};

  const ping = () => {
    if (!isDriverOnlineLocal(userId)) return;
    const loc = getDriverLastLocation(userId);
    const busy = hasActiveRideLocal();
    const payload = { isOnline: true, isAvailable: !busy };
    if (loc?.lat != null && loc?.lng != null) {
      payload.lat = loc.lat;
      payload.lng = loc.lng;
      payload.accuracy = loc.accuracy ?? 0;
      payload.heading = loc.heading ?? 0;
      payload.speed = loc.speed ?? 0;
    }
    base44.functions.invoke('setDriverPresence', payload).catch(() => {});
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
