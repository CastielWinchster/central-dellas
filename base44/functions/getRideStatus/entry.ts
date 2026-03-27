import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    console.log(`[getRideStatus] Buscando corrida: ${rideId} para usuário: ${user.id}`);

    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });

    if (rides.length === 0) {
      console.warn(`[getRideStatus] Corrida não encontrada: ${rideId}`);
      return Response.json({ found: false });
    }

    const ride = rides[0];

    // Segurança: só o passenger pode consultar sua própria corrida
    if (ride.passenger_id !== user.id) {
      console.warn(`[getRideStatus] Acesso negado: corrida é de ${ride.passenger_id}, usuário é ${user.id}`);
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    console.log(`[getRideStatus] status: ${ride.status} | assigned_driver_id: ${ride.assigned_driver_id}`);

    return Response.json({
      found: true,
      status: ride.status,
      assigned_driver_id: ride.assigned_driver_id || null,
    });

  } catch (error) {
    console.error('[getRideStatus] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});