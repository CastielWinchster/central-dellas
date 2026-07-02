import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type CleanupCtx = {
  base44: ReturnType<typeof createClientFromRequest>;
  rideId: string;
  offerId?: string;
  driver: Record<string, unknown>;
  ride: Record<string, unknown>;
  driverConfirmedPrice?: number | null;
  driverPrice?: number | null;
  now: Date;
};

/** Expira ofertas concorrentes e envia push — não bloqueia a resposta ao motorista */
function finishAcceptInBackground(ctx: CleanupCtx) {
  const { base44, rideId, offerId, driver, ride, driverConfirmedPrice, driverPrice, now } = ctx;

  (async () => {
    try {
      if (offerId) {
        await base44.asServiceRole.entities.RideOffer.update(String(offerId), {
          status: 'accepted',
          responded_at: now.toISOString(),
        });

        const allOffers = await base44.asServiceRole.entities.RideOffer.filter({ ride_id: rideId });
        const otherOpen = allOffers.filter(
          (o) => o.id !== offerId && ['sent', 'seen'].includes(String(o.status)),
        );

        await Promise.allSettled(
          otherOpen.map((o) =>
            base44.asServiceRole.entities.RideOffer.update(String(o.id), { status: 'expired' }),
          ),
        );

        const otherDriverIds = [...new Set(
          otherOpen.map((o) => String(o.driver_id)).filter((id) => id && id !== driver.id),
        )];

        await Promise.allSettled(
          otherDriverIds.map((userId) =>
            base44.asServiceRole.functions.invoke('sendPushToUser', {
              userId,
              type: 'ride_offer_cancelled',
              rideId,
              title: 'Corrida indisponível',
              body: 'Esta corrida já foi aceita por outra motorista.',
            }),
          ),
        );
      }

      await base44.asServiceRole.functions.invoke('sendPushToUser', {
        userId: ride.passenger_id,
        title: 'Motorista encontrada! 🚗',
        body: `${driver.full_name} aceitou sua corrida e está a caminho.`,
        type: 'ride',
        rideId: ride.id,
        url: `/ActiveRidePassenger?id=${ride.id}`,
        persistent: true,
      }).catch(async () => {
        await base44.asServiceRole.entities.Notification.create({
          user_id: ride.passenger_id,
          title: 'Motorista encontrada! 🚗',
          message: `${driver.full_name} aceitou sua corrida`,
          type: 'ride',
          is_read: false,
          is_persistent: true,
        }).catch(() => {});
      });
    } catch (e) {
      console.warn('[acceptRideOffer] cleanup background:', (e as Error).message);
    }
  })();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let driver;
    try {
      driver = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!driver) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { rideId, offerId, driverConfirmedPrice, driverPrice } = await req.json();

    if (!rideId) {
      return Response.json({ error: 'rideId é obrigatório' }, { status: 400 });
    }

    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    if (rides.length === 0) {
      return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });
    }

    const ride = rides[0];

    if (ride.status !== 'requested' && ride.status !== 'assigned') {
      return Response.json({
        error: 'Corrida não disponível',
        reason: `Status atual: ${ride.status}`,
      }, { status: 409 });
    }

    if (ride.assigned_driver_id && ride.assigned_driver_id !== driver.id) {
      return Response.json({ error: 'Corrida já aceita por outra motorista' }, { status: 409 });
    }

    const now = new Date();

    if (offerId) {
      const offers = await base44.asServiceRole.entities.RideOffer.filter({ id: offerId });
      const offer = offers[0];
      if (offer && new Date(String(offer.expires_at)) < now) {
        await base44.asServiceRole.entities.RideOffer.update(String(offerId), { status: 'expired' });
        return Response.json({ error: 'Oferta expirada', expired: true }, { status: 410 });
      }
    }

    // Caminho crítico: aceitar corrida primeiro, responder imediatamente
    await base44.asServiceRole.entities.Ride.update(String(ride.id), {
      status: 'accepted',
      assigned_driver_id: driver.id,
      driver_price: driverPrice || null,
      ...(driverConfirmedPrice != null ? {
        driver_confirmed_price: driverConfirmedPrice,
        price_validated_at: now.toISOString(),
      } : {}),
    });

    const verify = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    const updated = verify[0];
    if (updated?.assigned_driver_id && updated.assigned_driver_id !== driver.id) {
      return Response.json({ error: 'Corrida já aceita por outra motorista' }, { status: 409 });
    }

    finishAcceptInBackground({
      base44,
      rideId,
      offerId,
      driver,
      ride,
      driverConfirmedPrice,
      driverPrice,
      now,
    });

    return Response.json({
      success: true,
      ride: {
        id: ride.id,
        status: 'accepted',
        assigned_driver_id: driver.id,
        pickup_text: ride.pickup_text,
        dropoff_text: ride.dropoff_text,
        pickup_lat: ride.pickup_lat,
        pickup_lng: ride.pickup_lng,
        dropoff_lat: ride.dropoff_lat,
        dropoff_lng: ride.dropoff_lng,
        passenger_id: ride.passenger_id,
      },
    });
  } catch (error) {
    console.error('[acceptRideOffer] Erro geral:', (error as Error).message);
    return Response.json({
      error: 'Erro no servidor',
      details: (error as Error).message,
    }, { status: 500 });
  }
});
