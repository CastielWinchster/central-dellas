import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ACTIVE_DRIVER_STATUSES = new Set([
  'accepted',
  'arrived',
  'in_progress',
  'picked_up',
  'in_transit',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { rideId } = await req.json();
    if (!rideId) return Response.json({ error: 'rideId é obrigatório' }, { status: 400 });

    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    const ride = rides[0];
    if (!ride) return Response.json({ success: false, found: false });

    const isDriver = String(ride.assigned_driver_id) === String(user.id) || user.role === 'admin';
    const isPassenger = String(ride.passenger_id) === String(user.id);

    if (!isDriver && !isPassenger) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const passengers = await base44.asServiceRole.entities.User.filter({ id: ride.passenger_id });
    const drivers = ride.assigned_driver_id
      ? await base44.asServiceRole.entities.User.filter({ id: ride.assigned_driver_id })
      : [];

    return Response.json({
      success: true,
      found: true,
      ride,
      passenger: passengers[0] || null,
      driver: drivers[0] || null,
      isActive: ACTIVE_DRIVER_STATUSES.has(String(ride.status)),
    });
  } catch (error) {
    console.error('[getActiveRide]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
