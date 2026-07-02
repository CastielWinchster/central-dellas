import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INTERVAL_MS = 8000;
const MAX_DURATION_MS = 52000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildOfferUrl(rideId: string, offerId?: string) {
  const params = new URLSearchParams({ from: 'push', rideId });
  if (offerId) params.set('offerId', offerId);
  return `/DriverDashboard?${params.toString()}`;
}

async function sendPush(
  base44: ReturnType<typeof createClientFromRequest>,
  userId: string,
  payload: Record<string, unknown>,
) {
  try {
    const res = await base44.asServiceRole.functions.invoke('sendPushToUser', payload);
    const data = (res as { data?: Record<string, unknown> })?.data ?? res;
    if (!data?.success) {
      console.warn(`[notifyDriversOfRide] push falhou para ${userId}:`, data);
    }
    return data;
  } catch (e) {
    console.warn(`[notifyDriversOfRide] push erro para ${userId}:`, (e as Error).message);
    return null;
  }
}

async function cancelPush(
  base44: ReturnType<typeof createClientFromRequest>,
  userId: string,
  rideId: string,
) {
  await sendPush(base44, userId, {
    userId,
    type: 'ride_offer_cancelled',
    rideId,
    title: 'Corrida indisponível',
    body: 'Esta corrida já foi aceita por outra motorista.',
  });
}

async function pushOfferToDrivers(
  base44: ReturnType<typeof createClientFromRequest>,
  rideId: string,
  driverIds: string[],
  pushTitle: string,
  pushBody: string,
) {
  const allOffers = await base44.asServiceRole.entities.RideOffer.filter({ ride_id: rideId });
  const now = new Date().toISOString();

  await Promise.all(
    driverIds.map(async (userId) => {
      const offer = allOffers.find(
        (o) =>
          String(o.driver_id) === userId &&
          ['sent', 'seen'].includes(String(o.status)) &&
          String(o.expires_at) >= now,
      );
      const offerId = offer?.id ? String(offer.id) : undefined;

      await sendPush(base44, userId, {
        userId,
        title: pushTitle,
        body: pushBody,
        type: 'ride_offer',
        rideId,
        offerId,
        url: buildOfferUrl(rideId, offerId),
        persistent: true,
        skipInApp: false,
      });
    }),
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { rideId, driverIds, title, body } = await req.json();

    if (!rideId || !Array.isArray(driverIds) || driverIds.length === 0) {
      return Response.json({ error: 'rideId e driverIds são obrigatórios' }, { status: 400 });
    }

    const uniqueDrivers = [...new Set(driverIds.filter(Boolean))];
    const pushTitle = title || '🚗 Nova corrida disponível!';
    const pushBody = body || 'Toque para ver os detalhes e aceitar.';
    const started = Date.now();
    let rounds = 0;

    console.log(`[notifyDriversOfRide] Iniciando alertas para corrida ${rideId} → ${uniqueDrivers.length} motoristas`);

    await pushOfferToDrivers(base44, rideId, uniqueDrivers, pushTitle, pushBody);
    rounds = 1;

    while (Date.now() - started < MAX_DURATION_MS) {
      const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
      const ride = rides[0];

      if (!ride || !['requested', 'assigned'].includes(String(ride.status))) {
        console.log(`[notifyDriversOfRide] Corrida ${rideId} não disponível (${ride?.status}) — cancelando alertas`);
        await Promise.all(uniqueDrivers.map((userId) => cancelPush(base44, userId, rideId)));
        return Response.json({ success: true, stopped: true, reason: 'ride_unavailable', rounds });
      }

      await sleep(INTERVAL_MS);
      await pushOfferToDrivers(base44, rideId, uniqueDrivers, pushTitle, pushBody);
      rounds += 1;
    }

    console.log(`[notifyDriversOfRide] Tempo esgotado para corrida ${rideId} após ${rounds} rodadas`);
    await Promise.all(uniqueDrivers.map((userId) => cancelPush(base44, userId, rideId)));
    return Response.json({ success: true, stopped: true, reason: 'timeout', rounds });
  } catch (error) {
    console.error('[notifyDriversOfRide]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
