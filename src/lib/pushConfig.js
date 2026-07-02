import { base44 } from '@/api/base44Client';

let cachedKeys = null;
let cacheTs = 0;
const CACHE_MS = 5 * 60 * 1000;

/** Busca VAPID pública do backend quando não está no build (VITE_*). */
export async function resolvePushPublicKeys() {
  const fromBuild = {
    vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || '',
    firebaseVapidKey:
      import.meta.env.VITE_FIREBASE_VAPID_KEY ||
      import.meta.env.VITE_VAPID_PUBLIC_KEY ||
      '',
  };

  if (fromBuild.vapidPublicKey) {
    return { ...fromBuild, source: 'build' };
  }

  const now = Date.now();
  if (cachedKeys && now - cacheTs < CACHE_MS) {
    return cachedKeys;
  }

  try {
    const res = await base44.functions.invoke('getPushPublicConfig', {});
    const data = res?.data || res;
    if (data?.vapidPublicKey) {
      cachedKeys = {
        vapidPublicKey: data.vapidPublicKey,
        firebaseVapidKey: data.firebaseVapidKey || data.vapidPublicKey,
        source: 'server',
      };
      cacheTs = now;
      return cachedKeys;
    }
  } catch (e) {
    console.warn('[Push] Falha ao buscar chaves públicas:', e.message);
  }

  return { ...fromBuild, source: 'none' };
}

export function clearPushKeysCache() {
  cachedKeys = null;
  cacheTs = 0;
}
