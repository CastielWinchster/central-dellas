import { SW_BUILD_ID, SW_VERSION } from '@/config/swVersion';

/**
 * Registra o service worker com ?build= na URL para contornar CDN que cacheia /sw.js para sempre.
 * O JS do app usa hash no nome (index-XXX.js); sw.js não — por isso produção ficava presa na v5.
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  const swUrl = `/sw.js?build=${SW_BUILD_ID}`;

  try {
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('[SW] Registrado:', swUrl, SW_VERSION);

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;

      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          installing.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const checkUpdate = () => registration.update().catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkUpdate();
    });
    checkUpdate();

    return registration;
  } catch (err) {
    console.warn('[SW] Falha no registro:', err);
    return null;
  }
}
