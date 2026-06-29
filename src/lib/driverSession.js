/**
 * Estado online do motorista — chave por usuário (evita conflito entre contas).
 */
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

export function clearDriverSessionLocal(userId) {
  if (userId) {
    localStorage.removeItem(driverOnlineKey(userId));
  }
  localStorage.removeItem('driver_is_online');
  localStorage.removeItem('active_ride');
}
