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

export function getActiveRideLocal() {
  try {
    const raw = localStorage.getItem('active_ride');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveRideLocal(ride) {
  if (ride?.id) {
    localStorage.setItem('active_ride', JSON.stringify(ride));
  } else {
    localStorage.removeItem('active_ride');
  }
}

const LAST_LOC_KEY = 'driver_last_location';

/** Última posição GPS conhecida — reutilizada no keepalive para não perder lat/lng. */
export function getDriverLastLocation(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${LAST_LOC_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setDriverLastLocation(userId, { lat, lng, accuracy, heading, speed } = {}) {
  if (!userId || lat == null || lng == null) return;
  localStorage.setItem(
    `${LAST_LOC_KEY}_${userId}`,
    JSON.stringify({ lat, lng, accuracy: accuracy ?? 0, heading: heading ?? 0, speed: speed ?? 0, at: Date.now() }),
  );
}

export function hasActiveRideLocal() {
  return !!getActiveRideLocal()?.id;
}

export function clearDriverSessionLocal(userId) {
  if (userId) {
    localStorage.removeItem(driverOnlineKey(userId));
    localStorage.removeItem(`${LAST_LOC_KEY}_${userId}`);
  }
  localStorage.removeItem('driver_is_online');
  localStorage.removeItem('active_ride');
}

/** Marca motorista offline no servidor (logout, fechar app). */
export async function setDriverOfflineOnServer(base44) {
  try {
    await base44.functions.invoke('setDriverPresence', { isOnline: false });
  } catch (e) {
    console.warn('[setDriverOfflineOnServer]', e);
  }
}

export async function logoutDriverSession(base44, userId) {
  await setDriverOfflineOnServer(base44);
  clearDriverSessionLocal(userId);
}

/** Marca motorista em corrida ativa — online mas indisponível para novas ofertas */
export async function setDriverBusyOnRide(base44) {
  try {
    await base44.functions.invoke('setDriverPresence', {
      isOnline: true,
      isAvailable: false,
    });
  } catch (e) {
    console.warn('[setDriverBusyOnRide]', e);
  }
}

/** Restaura disponibilidade se ainda estiver online localmente */
export async function setDriverAvailableIfOnline(base44, userId) {
  if (!isDriverOnlineLocal(userId)) return;
  try {
    await base44.functions.invoke('setDriverPresence', {
      isOnline: true,
      isAvailable: true,
    });
  } catch (e) {
    console.warn('[setDriverAvailableIfOnline]', e);
  }
}
