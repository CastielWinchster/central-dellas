import { useEffect, useRef } from 'react';

export function cancelRideAlert(rideId) {
  if (!rideId || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: 'ride_offer_cancelled', rideId });
  }).catch(() => {});
}

/**
 * Alarme contínuo (som + vibração) enquanto houver oferta de corrida em primeiro plano.
 */
export function useRideAlert(isActive) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const playAlarm = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24);
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.36);
        gain.gain.setValueAtTime(0.9, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.55);
        osc.onended = () => ctx.close();
      } catch (_) {
        // AudioContext indisponível
      }

      if (navigator.vibrate) {
        navigator.vibrate([500, 150, 500, 150, 500, 150, 500]);
      }
    };

    playAlarm();
    intervalRef.current = setInterval(playAlarm, 2200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);
}
