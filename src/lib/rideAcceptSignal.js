const KEY_PREFIX = 'ride_accepted_';

/** Motorista aceitou — avisa outras abas / tela da passageira na hora (sem esperar push/polling). */
export function signalRideAccepted(rideId) {
  if (!rideId) return;
  const key = `${KEY_PREFIX}${rideId}`;
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch (_) {}
  window.dispatchEvent(new CustomEvent('passenger-ride-accepted', { detail: { rideId } }));
}

export function clearRideAcceptedSignal(rideId) {
  if (!rideId) return;
  try {
    localStorage.removeItem(`${KEY_PREFIX}${rideId}`);
  } catch (_) {}
}

export function readRideAcceptedAt(rideId) {
  if (!rideId) return null;
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${rideId}`);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function subscribeRideAccepted(onAccepted) {
  const handler = (event) => {
    const rideId = event?.detail?.rideId;
    if (rideId) onAccepted(rideId);
  };

  const onStorage = (event) => {
    if (!event.key?.startsWith(KEY_PREFIX) || !event.newValue) return;
    const rideId = event.key.slice(KEY_PREFIX.length);
    if (rideId) onAccepted(rideId);
  };

  window.addEventListener('passenger-ride-accepted', handler);
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('passenger-ride-accepted', handler);
    window.removeEventListener('storage', onStorage);
  };
}
