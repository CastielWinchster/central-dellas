import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import RideOfferModal from './RideOfferModal';
import { useRideAlert, cancelRideAlert } from '@/hooks/useRideAlert';
import {
  isDriverOnlineLocal,
  setActiveRideLocal,
  setDriverBusyOnRide,
} from '@/lib/driverSession';
import { signalRideAccepted } from '@/lib/rideAcceptSignal';
import { readPushDeepLinkParams, clearPushDeepLinkParams } from '@/lib/pushDeepLink';
import { unwrapInvoke } from '@/utils/invokeResponse';

const POLL_MS = 4000;
const PRESENCE_RESYNC_MS = 30000;

/**
 * Modal rosa + alarme contínuo — global para motoristas online em qualquer página.
 */
export default function DriverRideOfferLayer({ userId, enabled }) {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(() => isDriverOnlineLocal(userId));
  const [rideOffer, setRideOffer] = useState(null);
  const [offerRide, setOfferRide] = useState(null);
  const [offerPassenger, setOfferPassenger] = useState(null);

  const shownOfferIdsRef = useRef(new Set());
  const pollRef = useRef(null);
  const checkOffersRef = useRef(null);
  const hasOfferRef = useRef(false);
  const lastPresenceResyncRef = useRef(0);

  useRideAlert(!!rideOffer && enabled && isOnline);

  useEffect(() => {
    hasOfferRef.current = !!rideOffer;
  }, [rideOffer]);

  useEffect(() => {
    shownOfferIdsRef.current = new Set();
    setRideOffer(null);
    setOfferRide(null);
    setOfferPassenger(null);
    setIsOnline(isDriverOnlineLocal(userId));
  }, [userId]);

  useEffect(() => {
    const syncOnline = () => setIsOnline(isDriverOnlineLocal(userId));
    window.addEventListener('storage', syncOnline);
    window.addEventListener('driver-online-changed', syncOnline);
    return () => {
      window.removeEventListener('storage', syncOnline);
      window.removeEventListener('driver-online-changed', syncOnline);
    };
  }, [userId]);

  const clearOffer = useCallback(() => {
    setRideOffer(null);
    setOfferRide(null);
    setOfferPassenger(null);
  }, []);

  const dismissOffer = useCallback((offer, reject = true) => {
    cancelRideAlert(offer?.ride_id);
    if (reject && offer?.id) {
      shownOfferIdsRef.current.delete(offer.id);
      base44.functions.invoke('respondRideOffer', { offerId: offer.id, status: 'rejected' }).catch(() => {});
    }
    clearOffer();
  }, [clearOffer]);

  const showOffer = useCallback((offer, ride, passenger) => {
    if (!offer?.id || shownOfferIdsRef.current.has(offer.id)) return;
    shownOfferIdsRef.current.add(offer.id);
    setRideOffer(offer);
    setOfferRide(ride);
    setOfferPassenger(passenger || null);

    if (offer.status === 'sent') {
      base44.functions.invoke('respondRideOffer', { offerId: offer.id, status: 'seen' }).catch(() => {});
    }
  }, []);

  const maybeResyncPresence = useCallback((localOnline, dbOnline) => {
    if (!localOnline || dbOnline) return;
    const now = Date.now();
    if (now - lastPresenceResyncRef.current < PRESENCE_RESYNC_MS) return;
    lastPresenceResyncRef.current = now;
    base44.functions.invoke('setDriverPresence', { isOnline: true, isAvailable: true }).catch(() => {});
  }, []);

  const checkOffers = useCallback(async () => {
    if (!enabled || !userId || hasOfferRef.current) return;
    if (!isDriverOnlineLocal(userId)) return;

    try {
      const response = await base44.functions.invoke('getDriverRideOffers', {});
      const data = unwrapInvoke(response);

      if (!data?.success) return;

      const localOnline = isDriverOnlineLocal(userId);
      if (!localOnline) return;

      maybeResyncPresence(localOnline, data.isOnlineDb === true);

      const pending = (data.offers || []).filter(
        (item) => item?.offer?.id && !shownOfferIdsRef.current.has(item.offer.id),
      );

      if (pending.length === 0) return;

      const { offer, ride, passenger } = pending[0];
      showOffer(offer, ride, passenger);
    } catch (error) {
      console.error('[DriverRideOfferLayer] Erro ao verificar ofertas:', error);
    }
  }, [enabled, userId, showOffer, maybeResyncPresence]);

  checkOffersRef.current = checkOffers;

  useEffect(() => {
    if (!enabled || !userId) return;

    const { rideId, offerId, autoReject, fromPush } = readPushDeepLinkParams();
    if (!fromPush) return;

    if (autoReject && offerId) {
      base44.functions.invoke('respondRideOffer', { offerId, status: 'rejected' }).catch(() => {});
      cancelRideAlert(rideId);
      toast.info('Corrida recusada');
      clearPushDeepLinkParams();
      return;
    }

    const openFromPush = async () => {
      try {
        const response = await base44.functions.invoke('getDriverRideOffers', {});
        const data = unwrapInvoke(response);
        const match = (data.offers || []).find(
          (item) =>
            (offerId && item?.offer?.id === offerId) ||
            (rideId && item?.ride?.id === rideId),
        );
        if (match?.offer?.id) {
          showOffer(match.offer, match.ride, match.passenger);
        } else {
          checkOffersRef.current?.();
        }
      } catch {
        checkOffersRef.current?.();
      } finally {
        clearPushDeepLinkParams();
      }
    };

    if (rideId || offerId) openFromPush();
  }, [enabled, userId, showOffer]);

  useEffect(() => {
    if (!enabled || !userId || !isOnline) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    checkOffers();
    pollRef.current = setInterval(checkOffers, POLL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [enabled, userId, isOnline, checkOffers]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const onAlert = () => checkOffersRef.current?.();
    window.addEventListener('driver-ride-offer-alert', onAlert);

    const onSwMessage = (event) => {
      if (event.data?.type === 'ride_offer_push') onAlert();
    };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);

    return () => {
      window.removeEventListener('driver-ride-offer-alert', onAlert);
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
    };
  }, [enabled, userId]);

  const handleAcceptOffer = async (offer, ride, driverConfirmedPrice) => {
    cancelRideAlert(ride.id);
    clearOffer();

    try {
      const response = await base44.functions.invoke('acceptRideOffer', {
        rideId: ride.id,
        offerId: offer.id,
        driverConfirmedPrice: driverConfirmedPrice ?? null,
      });

      const responseData = unwrapInvoke(response);
      if (responseData?.success) {
        const acceptedRide = { ...ride, ...(responseData.ride || {}), status: 'accepted' };
        setActiveRideLocal(acceptedRide);
        await setDriverBusyOnRide(base44);
        signalRideAccepted(ride.id);
        toast.success('🎉 Corrida aceita!');
        navigate(`/ActiveRideDriver?id=${ride.id}`);
      } else if (responseData?.expired) {
        toast.warning('Oferta expirada');
      } else {
        toast.error(responseData?.error || 'Não foi possível aceitar');
      }
    } catch (error) {
      console.error('[DriverRideOfferLayer] Erro ao aceitar:', error);
      toast.error('Erro ao aceitar corrida');
    }
  };

  const handleRejectOffer = async (offer) => {
    if (offer?.id) shownOfferIdsRef.current.delete(offer.id);
    dismissOffer(offer, true);
    toast.info('Corrida recusada');
  };

  if (!enabled || !rideOffer || !offerRide) return null;

  return (
    <RideOfferModal
      offer={rideOffer}
      ride={offerRide}
      passenger={offerPassenger}
      onAccept={handleAcceptOffer}
      onReject={handleRejectOffer}
      onClose={() => dismissOffer(rideOffer, true)}
    />
  );
}
