/**
 * Parâmetros de deep link vindos de notificações push (SW / FCM / Capacitor).
 * Estilo Uber: toque na notificação abre o app na oferta correta.
 */
export function readPushDeepLinkParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    rideId: params.get('rideId') || params.get('ride_id') || null,
    offerId: params.get('offerId') || params.get('offer_id') || null,
    autoReject: params.get('autoReject') === '1' || params.get('action') === 'reject',
    fromPush: params.get('from') === 'push' || params.has('rideId') || params.has('offerId'),
  };
}

export function clearPushDeepLinkParams() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const keys = ['rideId', 'ride_id', 'offerId', 'offer_id', 'autoReject', 'action', 'from', 'rejectOffer'];
  let changed = false;
  keys.forEach((k) => {
    if (params.has(k)) {
      params.delete(k);
      changed = true;
    }
  });
  if (!changed) return;
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash || ''}`;
  window.history.replaceState({}, document.title, next);
}

export function buildDriverOfferUrl({ rideId, offerId } = {}) {
  const qs = new URLSearchParams({ from: 'push' });
  if (rideId) qs.set('rideId', rideId);
  if (offerId) qs.set('offerId', offerId);
  return `/DriverDashboard?${qs.toString()}`;
}
