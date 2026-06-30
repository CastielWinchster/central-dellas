import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_STATUSES = ['accepted', 'arrived', 'in_progress', 'picked_up', 'in_transit', 'completed', 'cancelled'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user;
    try {
      user = await base44.auth.me();
    } catch (e) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { rideId, status } = await req.json();
    if (!rideId || !status) {
      return Response.json({ error: 'rideId e status obrigatórios' }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return Response.json({ error: 'Status inválido' }, { status: 400 });
    }

    let ride = null;
    try {
      ride = await base44.asServiceRole.entities.Ride.get(rideId);
    } catch (_) {
      ride = null;
    }
    if (!ride) {
      return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });
    }

    const isDriver = ride.assigned_driver_id && String(ride.assigned_driver_id) === String(user.id);
    const isPassenger = String(ride.passenger_id) === String(user.id);
    const isAdmin = user.role === 'admin';
    if (!isDriver && !isPassenger && !isAdmin) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const updated = await base44.asServiceRole.entities.Ride.update(rideId, { status });

    return Response.json({ success: true, ride: updated });
  } catch (error) {
    console.error('[updateRideStatus] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});