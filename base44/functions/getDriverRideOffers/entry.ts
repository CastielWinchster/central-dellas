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
    const offers = await base44.asServiceRole.entities.RideOffer.filter({ driver_id: driver.id });

    const pending = offers.filter(
      (o) => ['sent', 'seen'].includes(String(o.status)) && String(o.expires_at) >= now,
    );

    const enriched = (
      await Promise.all(
        pending.map(async (offer) => {
          const rides = await base44.asServiceRole.entities.Ride.filter({ id: offer.ride_id });
          const ride = rides[0];
          if (!ride || !['requested', 'assigned'].includes(String(ride.status))) {
            if (offer.id) {
              await base44.asServiceRole.entities.RideOffer.update(String(offer.id), { status: 'expired' });
            }
            return null;
          }

          const passengers = await base44.asServiceRole.entities.User.filter({ id: ride.passenger_id });
          return {
            offer,
            ride,
            passenger: passengers[0] || null,
          };
        }),
      )
    ).filter(Boolean);

    enriched.sort(
      (a, b) => new Date(String(a!.offer.sent_at)).getTime() - new Date(String(b!.offer.sent_at)).getTime(),
    );

    const presences = await base44.asServiceRole.entities.DriverPresence.filter({ driver_id: driver.id });
    const presence = presences[0] || null;

    console.log(
      `[getDriverRideOffers] ${driver.email} | online=${presence?.is_online} | ofertas=${enriched.length}`,
    );

    return Response.json({
      success: true,
      isOnlineDb: !!presence?.is_online,
      presence: presence || null,
      presenceId: presence?.id || null,
      offers: enriched,
    });
  } catch (error) {
    console.error('[getDriverRideOffers]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
