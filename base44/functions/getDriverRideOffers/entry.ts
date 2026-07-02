import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function isDriver(user: Record<string, unknown>) {
  const type = String(user.user_type || '');
  return type === 'driver' || type === 'both' || user.role === 'admin';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const driver = await base44.auth.me();
    if (!driver) return Response.json({ error: 'Não autenticado' }, { status: 401 });
    if (!isDriver(driver)) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const now = new Date().toISOString();
    const driverId = String(driver.id);

    const [offersSent, offersSeen, presences] = await Promise.all([
      base44.asServiceRole.entities.RideOffer.filter({ driver_id: driverId, status: 'sent' }),
      base44.asServiceRole.entities.RideOffer.filter({ driver_id: driverId, status: 'seen' }),
      base44.asServiceRole.entities.DriverPresence.filter({ driver_id: driverId }),
    ]);

    const presence = presences[0] || null;
    const isAvailable = !!presence?.is_online && presence?.is_available !== false;

    const pending = [...offersSent, ...offersSeen].filter(
      (o) => String(o.expires_at) >= now,
    );

    if (pending.length === 0) {
      return Response.json({
        success: true,
        isOnlineDb: !!presence?.is_online,
        isAvailableDb: isAvailable,
        presence: presence || null,
        presenceId: presence?.id || null,
        offers: [],
      });
    }

    const rideIds = [...new Set(pending.map((o) => String(o.ride_id)).filter(Boolean))];

    const rideLists = await Promise.all(
      rideIds.map((id) => base44.asServiceRole.entities.Ride.filter({ id })),
    );
    const rideById = new Map<string, Record<string, unknown>>();
    for (const list of rideLists) {
      const ride = list[0];
      if (ride?.id && ['requested', 'assigned'].includes(String(ride.status))) {
        rideById.set(String(ride.id), ride);
      }
    }

    const expiredOfferIds = pending
      .filter((o) => !rideById.has(String(o.ride_id)))
      .map((o) => String(o.id));

    if (expiredOfferIds.length > 0) {
      Promise.allSettled(
        expiredOfferIds.map((id) =>
          base44.asServiceRole.entities.RideOffer.update(id, { status: 'expired' }),
        ),
      ).catch(() => {});
    }

    const validPending = pending.filter((o) => rideById.has(String(o.ride_id)));
    const passengerIds = [...new Set(
      [...rideById.values()].map((r) => String(r.passenger_id)).filter(Boolean),
    )];

    const passengerLists = await Promise.all(
      passengerIds.map((id) => base44.asServiceRole.entities.User.filter({ id })),
    );
    const passengerById = new Map<string, Record<string, unknown>>();
    for (const list of passengerLists) {
      if (list[0]?.id) passengerById.set(String(list[0].id), list[0]);
    }

    const enriched = validPending
      .map((offer) => {
        const ride = rideById.get(String(offer.ride_id));
        if (!ride) return null;
        const passenger = passengerById.get(String(ride.passenger_id)) || null;
        return { offer, ride, passenger };
      })
      .filter(Boolean);

    enriched.sort(
      (a, b) =>
        new Date(String(a!.offer.sent_at)).getTime() - new Date(String(b!.offer.sent_at)).getTime(),
    );

    return Response.json({
      success: true,
      isOnlineDb: !!presence?.is_online,
      isAvailableDb: isAvailable,
      presence: presence || null,
      presenceId: presence?.id || null,
      offers: enriched,
    });
  } catch (error) {
    console.error('[getDriverRideOffers]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
