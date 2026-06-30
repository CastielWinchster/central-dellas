/** Lógica compartilhada de dispatch / re-dispatch de corridas */

export const OFFER_TTL_MS = 45_000;
export const NO_DRIVER_RETRY_MS = 30_000;
export const SEARCH_TIMEOUT_MS = 5 * 60 * 1000;
export const REDISPATCH_GRACE_MS = 5_000;

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type Base44Client = {
  asServiceRole: {
    entities: {
      DriverPresence: { filter: (q: Record<string, unknown>) => Promise<Array<Record<string, unknown>>> };
      RideOffer: {
        filter: (q: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>;
        create: (data: Record<string, unknown>) => Promise<unknown>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      Ride: { update: (id: string, data: Record<string, unknown>) => Promise<unknown> };
      Notification: { create: (data: Record<string, unknown>) => Promise<unknown> };
    };
    functions: { invoke: (name: string, payload: Record<string, unknown>) => Promise<unknown> };
  };
};

type RideRecord = Record<string, unknown> & {
  id: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_text?: string;
  dropoff_text?: string;
  ride_type?: string;
  created_date?: string;
  offer_expires_at?: string;
};

export async function findOnlineDriversWithCoords(base44: Base44Client) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  let onlineDrivers = await base44.asServiceRole.entities.DriverPresence.filter({
    is_available: true,
    is_online: true,
    last_seen_at: { $gte: fiveMinutesAgo },
  });

  if (onlineDrivers.length === 0) {
    onlineDrivers = await base44.asServiceRole.entities.DriverPresence.filter({
      is_available: true,
      is_online: true,
    });
  }

  return onlineDrivers
    .map((d) => ({
      ...d,
      lat: (d.lat ?? d.current_lat) as number | null,
      lng: (d.lng ?? d.current_lng) as number | null,
      driver_id: d.driver_id as string,
    }))
    .filter((d) => d.lat != null && d.lng != null && d.driver_id);
}

export function filterNearbyDrivers(
  drivers: Array<{ driver_id: string; lat: number; lng: number; distance?: number }>,
  pickupLat: number,
  pickupLng: number,
) {
  let nearby = drivers
    .map((d) => ({ ...d, distance: calculateDistance(pickupLat, pickupLng, d.lat, d.lng) }))
    .filter((d) => d.distance <= 5);

  if (nearby.length === 0) {
    nearby = drivers
      .map((d) => ({ ...d, distance: calculateDistance(pickupLat, pickupLng, d.lat, d.lng) }))
      .filter((d) => d.distance <= 8);
  }

  if (nearby.length === 0) {
    nearby = drivers
      .map((d) => ({ ...d, distance: calculateDistance(pickupLat, pickupLng, d.lat, d.lng) }))
      .filter((d) => d.distance <= 12);
  }

  nearby.sort((a, b) => a.distance - b.distance);
  return nearby;
}

export async function expireStaleOffers(base44: Base44Client, rideId: string) {
  const now = new Date().toISOString();
  const stale = await base44.asServiceRole.entities.RideOffer.filter({ ride_id: rideId });
  const toExpire = stale.filter(
    (o) => ['sent', 'seen'].includes(String(o.status)) && String(o.expires_at) < now,
  );
  await Promise.allSettled(
    toExpire.map((o) =>
      base44.asServiceRole.entities.RideOffer.update(String(o.id), { status: 'expired' }),
    ),
  );
}

export async function getActiveOffers(base44: Base44Client, rideId: string) {
  const now = new Date().toISOString();
  const offers = await base44.asServiceRole.entities.RideOffer.filter({ ride_id: rideId });
  return offers.filter(
    (o) => ['sent', 'seen'].includes(String(o.status)) && String(o.expires_at) >= now,
  );
}

async function notifyDrivers(
  base44: Base44Client,
  ride: RideRecord,
  driverIds: string[],
) {
  if (driverIds.length === 0) return;

  const rideType = String(ride.ride_type || 'standard');
  const notifyTitle = rideType === 'delivery' ? '📦 Nova entrega disponível!' : '🚗 Nova corrida disponível!';
  const notifyBody = `${ride.pickup_text || 'Origem'} → ${ride.dropoff_text || 'destino'}`;

  // Push apenas — in-app duplicava e encheva a lista a cada re-dispatch
  base44.asServiceRole.functions
    .invoke('notifyDriversOfRide', {
      rideId: ride.id,
      driverIds,
      title: notifyTitle,
      body: notifyBody,
    })
    .catch(() => {});
}

/** Cria ofertas para motoristas próximas ou agenda nova tentativa se ninguém estiver online */
export async function assignDriversToRide(base44: Base44Client, ride: RideRecord) {
  await expireStaleOffers(base44, ride.id);

  const rejectedOffers = await base44.asServiceRole.entities.RideOffer.filter({
    ride_id: ride.id,
    status: 'rejected',
  });
  const rejectedIds = new Set(rejectedOffers.map((o) => String(o.driver_id)));

  const onlineDrivers = await findOnlineDriversWithCoords(base44);
  let nearbyDrivers = filterNearbyDrivers(
    onlineDrivers as Array<{ driver_id: string; lat: number; lng: number }>,
    ride.pickup_lat,
    ride.pickup_lng,
  ).filter((d) => !rejectedIds.has(d.driver_id));

  const now = new Date();
  const expiresAt = new Date(now.getTime() + OFFER_TTL_MS);

  if (nearbyDrivers.length === 0) {
    const retryAt = new Date(now.getTime() + NO_DRIVER_RETRY_MS);
    await base44.asServiceRole.entities.Ride.update(ride.id, {
      status: 'requested',
      offer_expires_at: retryAt.toISOString(),
      search_radius_km: 12,
    });
    return { offers_count: 0, status: 'requested', expires_at: retryAt.toISOString() };
  }

  const searchRadius = nearbyDrivers.some((d) => d.distance <= 5)
    ? 5
    : nearbyDrivers.some((d) => d.distance <= 8)
    ? 8
    : 12;

  await Promise.all(
    nearbyDrivers.map((driver) =>
      base44.asServiceRole.entities.RideOffer.create({
        ride_id: ride.id,
        driver_id: driver.driver_id,
        status: 'sent',
        sent_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        distance_km: parseFloat(driver.distance!.toFixed(2)),
      }),
    ),
  );

  await base44.asServiceRole.entities.Ride.update(ride.id, {
    status: 'assigned',
    offer_expires_at: expiresAt.toISOString(),
    search_radius_km: searchRadius,
  });

  await notifyDrivers(base44, ride, nearbyDrivers.map((d) => d.driver_id));

  return {
    offers_count: nearbyDrivers.length,
    status: 'assigned',
    expires_at: expiresAt.toISOString(),
  };
}

/** Re-dispatch automático enquanto a passageira aguarda */
export async function maybeRedispatchRide(base44: Base44Client, ride: RideRecord) {
  if (!['requested', 'assigned'].includes(String(ride.status)) || ride.assigned_driver_id) {
    return { ride, redispatched: false, offers_count: 0 };
  }

  const createdAt = ride.created_date ? new Date(String(ride.created_date)).getTime() : Date.now();
  if (Date.now() - createdAt > SEARCH_TIMEOUT_MS) {
    await expireStaleOffers(base44, ride.id);
    await base44.asServiceRole.entities.Ride.update(ride.id, { status: 'expired' });
    return { ride: { ...ride, status: 'expired' }, redispatched: false, offers_count: 0, expired: true };
  }

  const activeOffers = await getActiveOffers(base44, ride.id);
  if (activeOffers.length > 0) {
    return { ride, redispatched: false, offers_count: activeOffers.length };
  }

  const retryAt = ride.offer_expires_at ? new Date(String(ride.offer_expires_at)).getTime() : 0;
  if (retryAt > Date.now()) {
    return { ride, redispatched: false, offers_count: 0, waiting_retry: true };
  }

  if (retryAt > 0 && Date.now() - retryAt < REDISPATCH_GRACE_MS) {
    return { ride, redispatched: false, offers_count: 0 };
  }

  const result = await assignDriversToRide(base44, ride);
  return {
    ride: { ...ride, status: result.status, offer_expires_at: result.expires_at },
    redispatched: true,
    offers_count: result.offers_count,
  };
}

/** Cancela busca: expira ofertas e cancela push nas motoristas */
export async function cancelRideSearch(base44: Base44Client, ride: RideRecord) {
  const offers = await base44.asServiceRole.entities.RideOffer.filter({ ride_id: ride.id });
  const openOffers = offers.filter((o) => ['sent', 'seen'].includes(String(o.status)));

  await Promise.allSettled(
    openOffers.map((o) =>
      base44.asServiceRole.entities.RideOffer.update(String(o.id), { status: 'expired' }),
    ),
  );

  const driverIds = [...new Set(openOffers.map((o) => String(o.driver_id)).filter(Boolean))];
  await Promise.allSettled(
    driverIds.map((userId) =>
      base44.asServiceRole.functions.invoke('sendPushToUser', {
        userId,
        type: 'ride_offer_cancelled',
        rideId: ride.id,
        title: 'Busca cancelada',
        body: 'A passageira cancelou a busca por motorista.',
      }),
    ),
  );

  await base44.asServiceRole.entities.Ride.update(ride.id, { status: 'cancelled' });
}
