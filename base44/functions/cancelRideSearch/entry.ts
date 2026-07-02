import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { cancelRideSearch } from './rideDispatch.ts';

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
      return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });
    }

    const ride = rides[0];

    if (ride.passenger_id !== user.id) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    if (['accepted', 'arrived', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'completed'].includes(ride.status)) {
      return Response.json({ error: 'Corrida já em andamento' }, { status: 409 });
    }

    if (ride.status === 'cancelled' || ride.status === 'expired') {
      return Response.json({ success: true, already_cancelled: true });
    }

    await cancelRideSearch(base44, ride);

    return Response.json({ success: true });
  } catch (error) {
    console.error('[cancelRideSearch] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
