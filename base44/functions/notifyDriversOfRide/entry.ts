import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INTERVAL_MS = 8000;
const MAX_DURATION_MS = 52000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendPush(
  base44: ReturnType<typeof createClientFromRequest>,
  userId: string,
  payload: Record<string, unknown>
) {
  try {
    await base44.asServiceRole.functions.invoke('sendPushToUser', payload);
  } catch (e) {
    console.warn(`[notifyDriversOfRide] push falhou para ${userId}:`, e.message);
  }
}

async function cancelPush(
  base44: ReturnType<typeof createClientFromRequest>,
  userId: string,
  rideId: string
) {
  await sendPush(base44, userId, {
    userId,
    type: 'ride_offer_cancelled',
    rideId,
    title: 'Corrida indisponível',
    body: 'Esta corrida já foi aceita por outra motorista.',
  });
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
    const url = '/DriverDashboard';
    const started = Date.now();
    let rounds = 0;

    console.log(`[notifyDriversOfRide] Iniciando alertas para corrida ${rideId} → ${uniqueDrivers.length} motoristas`);

    while (Date.now() - started < MAX_DURATION_MS) {
      const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
      const ride = rides[0];

      if (!ride || !['requested', 'assigned'].includes(ride.status)) {
        console.log(`[notifyDriversOfRide] Corrida ${rideId} não disponível (${ride?.status}) — cancelando alertas`);
        await Promise.all(uniqueDrivers.map((userId) => cancelPush(base44, userId, rideId)));
        return Response.json({ success: true, stopped: true, reason: 'ride_unavailable', rounds });
      }

      await Promise.all(
        uniqueDrivers.map((userId) =>
          sendPush(base44, userId, {
            userId,
            title: pushTitle,
            body: pushBody,
            type: 'ride_offer',
            rideId,
            url,
            persistent: true,
          })
        )
      );

      rounds += 1;
      await sleep(INTERVAL_MS);
    }

    console.log(`[notifyDriversOfRide] Tempo esgotado para corrida ${rideId} após ${rounds} rodadas`);
    await Promise.all(uniqueDrivers.map((userId) => cancelPush(base44, userId, rideId)));
    return Response.json({ success: true, stopped: true, reason: 'timeout', rounds });
  } catch (error) {
    console.error('[notifyDriversOfRide]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
