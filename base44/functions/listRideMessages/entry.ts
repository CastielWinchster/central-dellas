import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { rideId, limit = 50 } = await req.json();
    if (!rideId) return Response.json({ error: 'rideId é obrigatório' }, { status: 400 });

    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    if (rides.length === 0) return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });

    const ride = rides[0];
    if (ride.passenger_id !== user.id && ride.assigned_driver_id !== user.id) {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const messages = await base44.asServiceRole.entities.RideMessage.filter(
      { ride_id: rideId },
      'created_date',
      limit
    );

    return Response.json({ success: true, messages });
  } catch (error) {
    console.error('[listRideMessages]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});