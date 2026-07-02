import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { maybeRedispatchRide } from './rideDispatch.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { rideId } = await req.json();
    if (!rideId) {
      return Response.json({ error: 'rideId obrigatório' }, { status: 400 });
    }

    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    if (rides.length === 0) {
      return Response.json({ found: false });
    }

    const ride = rides[0];

    if (ride.passenger_id !== user.id) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    if (['accepted', 'cancelled', 'expired', 'completed'].includes(String(ride.status))) {
      return Response.json({
        found: true,
        status: ride.status,
        assigned_driver_id: ride.assigned_driver_id || null,
        offers_count: 0,
        redispatched: false,
        expired: ride.status === 'expired',
        offer_expires_at: ride.offer_expires_at || null,
      });
    }

    let updatedRide = ride;
    let redispatched = false;
    let offers_count = 0;
    let expired = false;

    try {
      const result = await maybeRedispatchRide(base44, ride);
      updatedRide = result.ride;
      redispatched = result.redispatched ?? false;
      offers_count = result.offers_count ?? 0;
      expired = result.expired ?? false;
    } catch (redispatchErr) {
      console.error('[getRideStatus] maybeRedispatchRide falhou:', (redispatchErr as Error).message);
    }

    return Response.json({
      found: true,
      status: updatedRide.status,
      assigned_driver_id: updatedRide.assigned_driver_id || null,
      offers_count,
      redispatched,
      expired,
      offer_expires_at: updatedRide.offer_expires_at || null,
    });
  } catch (error) {
    console.error('[getRideStatus] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
