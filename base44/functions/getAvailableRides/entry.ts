import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SEARCH_TIMEOUT_MS = 5 * 60 * 1000;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function expireAbandonedOpenRides(base44: ReturnType<typeof createClientFromRequest>) {
  const cutoff = Date.now() - SEARCH_TIMEOUT_MS;
  const [requested, assigned] = await Promise.all([
    base44.asServiceRole.entities.Ride.filter({ status: 'requested' }),
    base44.asServiceRole.entities.Ride.filter({ status: 'assigned' }),
  ]);
  const stale = [...requested, ...assigned].filter((r) => {
    if (r.assigned_driver_id) return false;
    const created = r.created_date ? new Date(String(r.created_date)).getTime() : 0;
    return created > 0 && created < cutoff;
  });
  await Promise.allSettled(
    stale.map(async (r) => {
      const rideId = String(r.id);
      const offers = await base44.asServiceRole.entities.RideOffer.filter({ ride_id: rideId });
      const open = offers.filter((o) => ['sent', 'seen'].includes(String(o.status)));
      await Promise.allSettled(
        open.map((o) => base44.asServiceRole.entities.RideOffer.update(String(o.id), { status: 'expired' })),
      );
      await base44.asServiceRole.entities.Ride.update(rideId, { status: 'expired' });
    }),
  );
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

    const { driverLat, driverLng, radiusKm = 15 } = await req.json();

    expireAbandonedOpenRides(base44).catch((e) =>
      console.warn('[getAvailableRides] cleanup:', (e as Error).message),
    );

    const [allRidesRequested, allRidesAssigned] = await Promise.all([
      base44.asServiceRole.entities.Ride.filter({ status: 'requested' }),
      base44.asServiceRole.entities.Ride.filter({ status: 'assigned' }),
    ]);

    const searchCutoff = Date.now() - SEARCH_TIMEOUT_MS;

    const openRides = [...allRidesRequested, ...allRidesAssigned].filter((r) => {
      if (r.assigned_driver_id) return false;
      const created = r.created_date ? new Date(String(r.created_date)).getTime() : 0;
      if (!created || created < searchCutoff) return false;
      if (String(r.passenger_id) === String(driver.id)) return false;
      return true;
    });

    const byPassenger = new Map<string, Record<string, unknown>>();
    for (const ride of openRides) {
      const pid = String(ride.passenger_id);
      const existing = byPassenger.get(pid);
      if (!existing) {
        byPassenger.set(pid, ride);
        continue;
      }
      const existingTs = new Date(String(existing.created_date)).getTime();
      const rideTs = new Date(String(ride.created_date)).getTime();
      if (rideTs > existingTs) byPassenger.set(pid, ride);
    }
    const uniqueRides = Array.from(byPassenger.values());

    let filtered = uniqueRides;
    if (driverLat != null && driverLng != null) {
      filtered = uniqueRides
        .map((r) => ({
          ...r,
          distance: haversine(driverLat, driverLng, r.pickup_lat as number, r.pickup_lng as number),
        }))
        .filter((r) => r.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
    } else {
      filtered = uniqueRides.map((r) => ({ ...r, distance: null }));
    }

    const enriched = await Promise.all(filtered.map(async (ride) => {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: ride.passenger_id });
        const passenger = users[0];
        return {
          ...ride,
          passengerName: passenger?.full_name || 'Passageira',
          passengerPhoto: passenger?.photo_url || null,
        };
      } catch {
        return { ...ride, passengerName: 'Passageira', passengerPhoto: null };
      }
    }));

    return Response.json({ success: true, rides: enriched });
  } catch (error) {
    console.error('[getAvailableRides] Erro:', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
