import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import RideOfferModal from './RideOfferModal';
import { useRideAlert, cancelRideAlert } from '@/hooks/useRideAlert';

/**
 * Modal rosa + alarme contínuo — global para motoristas online em qualquer página.
 */
export default function DriverRideOfferLayer({ userId, enabled }) {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(
    () => localStorage.getItem('driver_is_online') === 'true',
  );
  const [rideOffer, setRideOffer] = useState(null);
  const [offerRide, setOfferRide] = useState(null);
  const [offerPassenger, setOfferPassenger] = useState(null);

  const shownOfferIdsRef = useRef(new Set());
  const processingOfferRef = useRef(null);
  const pollRef = useRef(null);
  const checkOffersRef = useRef(null);

  useRideAlert(!!rideOffer && enabled && isOnline);

  useEffect(() => {
    const syncOnline = () => {
      setIsOnline(localStorage.getItem('driver_is_online') === 'true');
    };
    window.addEventListener('storage', syncOnline);
    window.addEventListener('driver-online-changed', syncOnline);
    return () => {
      window.removeEventListener('storage', syncOnline);
      window.removeEventListener('driver-online-changed', syncOnline);
    };
  }, []);

  const clearOffer = useCallback(() => {
    setRideOffer(null);
    setOfferRide(null);
    setOfferPassenger(null);
    processingOfferRef.current = null;
  }, []);

  const checkOffers = useCallback(async () => {
    if (!enabled || !userId || !isOnline) return;
    if (processingOfferRef.current) return;

    try {
      const now = new Date().toISOString();
      const offers = await base44.entities.RideOffer.filter({
        driver_id: userId,
        expires_at: { $gte: now },
      });

      const pending = offers.filter(
        (o) =>
          (o.status === 'sent' || o.status === 'seen') &&
          !shownOfferIdsRef.current.has(o.id) &&
          processingOfferRef.current !== o.id,
      );

      if (pending.length === 0) return;

      pending.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
      const offer = pending[0];
      processingOfferRef.current = offer.id;

      const rides = await base44.entities.Ride.filter({ id: offer.ride_id });
      if (rides.length === 0) {
        processingOfferRef.current = null;
        return;
      }
      const ride = rides[0];

      if (!['requested', 'assigned'].includes(ride.status)) {
        await base44.entities.RideOffer.update(offer.id, { status: 'expired' });
        processingOfferRef.current = null;
        return;
      }

      const passengers = await base44.entities.User.filter({ id: ride.passenger_id });

      setRideOffer(offer);
      setOfferRide(ride);
      setOfferPassenger(passengers[0] || null);
      shownOfferIdsRef.current.add(offer.id);

      if (offer.status === 'sent') {
        await base44.entities.RideOffer.update(offer.id, { status: 'seen' });
      }

      processingOfferRef.current = null;
    } catch (error) {
      console.error('[DriverRideOfferLayer] Erro ao verificar ofertas:', error);
      processingOfferRef.current = null;
    }
  }, [enabled, userId, isOnline]);

  checkOffersRef.current = checkOffers;

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

    let unsubOffer = () => {};
    try {
      unsubOffer = base44.entities.RideOffer.subscribe((event) => {
        if (event.type === 'create' && event.data?.driver_id === userId) {
          onAlert();
        }
      });
    } catch (_) {
      // subscribe indisponível — polling cobre
    }

    return () => {
      window.removeEventListener('driver-ride-offer-alert', onAlert);
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
      unsubOffer();
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
        localStorage.setItem('active_ride', JSON.stringify(acceptedRideData));
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
      await base44.entities.RideOffer.update(offer.id, {
        status: 'rejected',
        responded_at: new Date().toISOString(),
      });
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
