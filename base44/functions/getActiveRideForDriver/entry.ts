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

    const { rideId } = await req.json();
    if (!rideId) return Response.json({ error: 'rideId obrigatório' }, { status: 400 });

    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    const ride = rides[0];
    if (!ride) return Response.json({ found: false });

    const isAssignee = String(ride.assigned_driver_id) === String(driver.id);
    const activeStatuses = ['accepted', 'arrived', 'in_progress', 'picked_up', 'in_transit'];
    if (!isAssignee && driver.role !== 'admin') {
      return Response.json({ error: 'Corrida não atribuída a esta motorista' }, { status: 403 });
    }
    if (!activeStatuses.includes(String(ride.status)) && driver.role !== 'admin') {
      return Response.json({
        found: true,
        ride,
        passenger: null,
        inactive: true,
        message: `Status atual: ${ride.status}`,
      });
    }

    const passengers = await base44.asServiceRole.entities.User.filter({ id: ride.passenger_id });

    return Response.json({
      found: true,
      ride,
      passenger: passengers[0] || null,
    });
  } catch (error) {
    console.error('[getActiveRideForDriver]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
