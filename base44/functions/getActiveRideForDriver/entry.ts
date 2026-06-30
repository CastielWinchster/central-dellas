import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const driver = await base44.auth.me();
    if (!driver) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { rideId } = await req.json();
    if (!rideId) return Response.json({ error: 'rideId obrigatório' }, { status: 400 });

    let ride = null;
    try {
      ride = await base44.asServiceRole.entities.Ride.get(rideId);
    } catch (_) {
      ride = null;
    }
    if (!ride) return Response.json({ found: false });

    // Acesso baseado na atribuição da corrida (não em user_type) — alinhado ao
    // resto do app, que trata motoristas online via DriverPresence.
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