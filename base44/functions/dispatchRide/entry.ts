import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { assignDriversToRide, calculateDistance } from '../_shared/rideDispatch.ts';

const MAX_DISTANCE_KM = 150;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user;
    try {
      user = await base44.auth.me();
    } catch (e) {
      console.error('[dispatchRide] Falha auth.me:', e.message);
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      pickupLat,
      pickupLng,
      pickupText, pickup_text,
      dropoffLat,
      dropoffLng,
      dropoffText, dropoff_text,
      estimatedPrice,
      agreedPrice,
      isCustomPrice,
      estimatedDuration,
      rideType = 'standard',
      hasPet,
      packageSize,
      couponCode,
      paymentMethod,
    } = body;

    const resolvedPickupText = pickupText || pickup_text;
    const resolvedDropoffText = dropoffText || dropoff_text;

    if (!pickupLat || !pickupLng || !resolvedPickupText || !dropoffLat || !dropoffLng || !resolvedDropoffText) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const straightLineDistance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    if (straightLineDistance > MAX_DISTANCE_KM) {
      return Response.json({
        success: false,
        error: `Corrida não permitida: distância de ${straightLineDistance.toFixed(1)} km excede o limite de ${MAX_DISTANCE_KM} km.`,
        distance_km: parseFloat(straightLineDistance.toFixed(1)),
      }, { status: 400 });
    }

    let ride;
    try {
      ride = await base44.asServiceRole.entities.Ride.create({
        passenger_id: user.id,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        pickup_text: resolvedPickupText,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
        dropoff_text: resolvedDropoffText,
        status: 'requested',
        search_radius_km: 5,
        estimated_price: estimatedPrice,
        agreed_price: agreedPrice ?? null,
        is_custom_price: isCustomPrice ?? false,
        estimated_duration: estimatedDuration,
        ride_type: rideType,
        has_pet: hasPet || false,
        package_size: packageSize || null,
        payment_method: paymentMethod || null,
      });
    } catch (e) {
      console.error('[dispatchRide] Erro ao criar Ride:', e.message);
      return Response.json({ error: 'Falha ao criar corrida: ' + e.message }, { status: 500 });
    }

    console.log(`[dispatchRide] Corrida criada: ${ride.id}`);

    const dispatchResult = await assignDriversToRide(base44, ride);

    if (couponCode) {
      try {
        const normalizedCode = couponCode.trim().replace(/\s+/g, '').toLowerCase();
        const allPromos = await base44.asServiceRole.entities.PromoCode.filter({ is_active: true });
        const promo = allPromos.find(
          (p) => p.code.trim().replace(/\s+/g, '').toLowerCase() === normalizedCode,
        );
        if (promo) {
          await base44.asServiceRole.entities.PromoCode.update(promo.id, {
            current_uses: (promo.current_uses || 0) + 1,
          });
        }
      } catch (promoErr) {
        console.warn('[dispatchRide] Erro ao registrar cupom:', promoErr.message);
      }
    }

    return Response.json({
      success: true,
      ride: {
        id: ride.id,
        status: dispatchResult.status,
        offers_count: dispatchResult.offers_count,
        expires_at: dispatchResult.expires_at,
      },
    });
  } catch (error) {
    console.error('[dispatchRide] Erro geral:', error.message);
    return Response.json({ error: 'Erro ao processar corrida', details: error.message }, { status: 500 });
  }
});
