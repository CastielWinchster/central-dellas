/**
 * Estado online do motorista — chave por usuário (evita conflito entre contas).
 */
const ACTIVE_RIDE_KEY = 'active_ride';

export function driverOnlineKey(userId) {
  return userId ? `driver_is_online_${userId}` : null;
}

export function isDriverOnlineLocal(userId) {
  const key = driverOnlineKey(userId);
  return !!(key && localStorage.getItem(key) === 'true');
}

export function setDriverOnlineLocal(userId, online) {
  const key = driverOnlineKey(userId);
  if (!key) return;
  if (online) localStorage.setItem(key, 'true');
  else localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent('driver-online-changed', { detail: { userId, online } }));
}

export function getActiveRideLocal() {
  try {
    const raw = localStorage.getItem(ACTIVE_RIDE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActiveRideLocal(ride) {
  if (!ride?.id) return;
  localStorage.setItem(ACTIVE_RIDE_KEY, JSON.stringify(ride));
  window.dispatchEvent(new CustomEvent('active-ride-changed', { detail: { rideId: ride.id } }));
}

export function clearActiveRideLocal() {
  localStorage.removeItem(ACTIVE_RIDE_KEY);
  window.dispatchEvent(new CustomEvent('active-ride-changed', { detail: { rideId: null } }));
}

export function hasActiveRideLocal() {
  const ride = getActiveRideLocal();
  if (!ride?.id) return false;
  const open = ['accepted', 'arrived', 'in_progress', 'picked_up', 'in_transit'].includes(ride.status);
  return open || !ride.status;
}

export function clearDriverSessionLocal(userId) {
  if (userId) {
    localStorage.removeItem(driverOnlineKey(userId));
  }
  localStorage.removeItem('driver_is_online');
  clearActiveRideLocal();
}
