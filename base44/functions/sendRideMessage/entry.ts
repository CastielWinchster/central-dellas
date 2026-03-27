import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { rideId, text } = await req.json();
    if (!rideId || !text?.trim()) {
      return Response.json({ error: 'rideId e text são obrigatórios' }, { status: 400 });
    }

    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    if (rides.length === 0) return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });

    const ride = rides[0];
    const isPassenger = ride.passenger_id === user.id;
    const isDriver = ride.assigned_driver_id === user.id;

    if (!isPassenger && !isDriver) {
      return Response.json({ error: 'Não autorizado para esta corrida' }, { status: 403 });
    }

    const receiver_id = isPassenger ? ride.assigned_driver_id : ride.passenger_id;
    if (!receiver_id) {
      return Response.json({ error: 'Destinatário não encontrado' }, { status: 400 });
    }

    const message = await base44.asServiceRole.entities.RideMessage.create({
      ride_id: rideId,
      sender_id: user.id,
      receiver_id,
      text: text.trim(),
      is_read: false,
    });

    return Response.json({ success: true, message });
  } catch (error) {
    console.error('[sendRideMessage]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});