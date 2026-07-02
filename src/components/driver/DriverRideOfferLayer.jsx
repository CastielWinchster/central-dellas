import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import RideOfferModal from './RideOfferModal';
import { useRideAlert, cancelRideAlert } from '@/hooks/useRideAlert';
import { isDriverOnlineLocal, setActiveRideLocal, setDriverBusyOnRide } from '@/lib/driverSession';
import { readPushDeepLinkParams, clearPushDeepLinkParams } from '@/lib/pushDeepLink';

/**
 * Modal rosa + alarme contínuo — global para motoristas online em qualquer página.
 * Usa getDriverRideOffers (service role) para contornar RLS das entidades.
 */
export default function DriverRideOfferLayer({ userId, enabled }) {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(() => isDriverOnlineLocal(userId));
  const [rideOffer, setRideOffer] = useState(null);
  const [offerRide, setOfferRide] = useState(null);
  const [offerPassenger, setOfferPassenger] = useState(null);

  const shownOfferIdsRef = useRef(new Set());
  const processingOfferRef = useRef(null);
  const pollRef = useRef(null);
  const checkOffersRef = useRef(null);

  useRideAlert(!!rideOffer && enabled && isOnline);

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
    processingOfferRef.current = null;
  }, []);

  const checkOffers = useCallback(async () => {
    if (!enabled || !userId || !isOnline) return;
    if (processingOfferRef.current || rideOffer) return;

    try {
      const response = await base44.functions.invoke('getDriverRideOffers', {});
      const data = response?.data || response;

      if (!data?.success) {
        console.warn('[DriverRideOfferLayer] Resposta inválida:', data);
        return;
      }

      if (data.isOnlineDb === false && isDriverOnlineLocal(userId)) {
        console.warn('[DriverRideOfferLayer] Local online mas DB offline — re-sincronizando presença');
        await base44.functions.invoke('setDriverPresence', { isOnline: true }).catch(() => {});
      }

      const pending = (data.offers || []).filter(
        (item) => item?.offer?.id && !shownOfferIdsRef.current.has(item.offer.id),
      );

      console.log(`[DriverRideOfferLayer] poll user=${userId} online=${isOnline} ofertas=${pending.length}`);

      if (pending.length === 0) return;

      const { offer, ride, passenger } = pending[0];
      processingOfferRef.current = offer.id;

      setRideOffer(offer);
      setOfferRide(ride);
      setOfferPassenger(passenger || null);
      shownOfferIdsRef.current.add(offer.id);

      if (offer.status === 'sent') {
        await base44.functions.invoke('respondRideOffer', { offerId: offer.id, status: 'seen' }).catch(() => {});
      }

      processingOfferRef.current = null;
    } catch (error) {
      console.error('[DriverRideOfferLayer] Erro ao verificar ofertas:', error);
      processingOfferRef.current = null;
    }
  }, [enabled, userId, isOnline, rideOffer]);

  checkOffersRef.current = checkOffers;

  // Deep link vindo de notificação push (app fechado → toque abre modal)
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
        const data = response?.data || response;
        const match = (data.offers || []).find(
          (item) =>
            (offerId && item?.offer?.id === offerId) ||
            (rideId && item?.ride?.id === rideId),
        );
        if (match?.offer?.id && !shownOfferIdsRef.current.has(match.offer.id)) {
          setRideOffer(match.offer);
          setOfferRide(match.ride);
          setOfferPassenger(match.passenger || null);
          shownOfferIdsRef.current.add(match.offer.id);
          if (match.offer.status === 'sent') {
            await base44.functions.invoke('respondRideOffer', {
              offerId: match.offer.id,
              status: 'seen',
            }).catch(() => {});
          }
        } else {
          checkOffersRef.current?.();
        }
      } catch {
        checkOffersRef.current?.();
      } finally {
        clearPushDeepLinkParams();
      }
    };

    if (rideId || offerId) {
      openFromPush();
    }
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !userId || !isOnline) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    checkOffers();
    pollRef.current = setInterval(checkOffers, 2000);

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
    try {
      const response = await base44.functions.invoke('acceptRideOffer', {
        rideId: ride.id,
        offerId: offer.id,
        driverConfirmedPrice: driverConfirmedPrice ?? null,
      });

      const responseData = response?.data || response;
      if (responseData.success) {
        toast.success('🎉 Corrida aceita!');
        cancelRideAlert(ride.id);
        const acceptedRideData = responseData?.ride || ride;
        setActiveRideLocal(acceptedRideData);
        await setDriverBusyOnRide(base44);
        clearOffer();
        navigate(`/ActiveRideDriver?id=${acceptedRideData.id}`);
      } else if (responseData.expired) {
        toast.warning('Oferta expirada');
        clearOffer();
      } else {
        toast.error(responseData.error || 'Não foi possível aceitar');
        clearOffer();
      }
    } catch (error) {
      console.error('[DriverRideOfferLayer] Erro ao aceitar:', error);
      toast.error('Erro ao aceitar corrida');
      clearOffer();
    }
  };

  const handleRejectOffer = async (offer) => {
    try {
      await base44.functions.invoke('respondRideOffer', { offerId: offer.id, status: 'rejected' });
      toast.info('Corrida recusada');
    } catch (error) {
      console.error('[DriverRideOfferLayer] Erro ao recusar:', error);
    } finally {
      cancelRideAlert(offer?.ride_id);
      clearOffer();
    }
  };

  if (!enabled || !isOnline || !rideOffer || !offerRide) return null;

  return (
    <RideOfferModal
      offer={rideOffer}
      ride={offerRide}
      passenger={offerPassenger}
      onAccept={handleAcceptOffer}
      onReject={handleRejectOffer}
      onClose={() => {
        cancelRideAlert(offerRide?.id);
        clearOffer();
      }}
    />
  );
}
