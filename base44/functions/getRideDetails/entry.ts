import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    const { rideId } = await req.json();
    if (!rideId) {
      return Response.json({ error: 'rideId obrigatório' }, { status: 400 });
    }

    // Buscar via service role para contornar qualquer atraso de replicação do RLS
    let ride = null;
    try {
      ride = await base44.asServiceRole.entities.Ride.get(rideId);
    } catch (_) {
      ride = null;
    }
    if (!ride) {
      return Response.json({ found: false });
    }

    // Garantir que apenas a passageira ou a motorista designada possam ver a corrida
    const isPassenger = String(ride.passenger_id) === String(user.id);
    const isDriver = ride.assigned_driver_id && String(ride.assigned_driver_id) === String(user.id);
    const isAdmin = user.role === 'admin';
    if (!isPassenger && !isDriver && !isAdmin) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return Response.json({ found: true, ride });
  } catch (error) {
    console.error('[getRideDetails] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});