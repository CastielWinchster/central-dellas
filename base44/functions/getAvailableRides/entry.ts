import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let driver;
    try {
      driver = await base44.auth.me();
    } catch (e) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!driver) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    console.log(`[getAvailableRides] Motorista: ${driver.id} (${driver.email})`);

    const { driverLat, driverLng, radiusKm = 15 } = await req.json();

    // Buscar todas corridas abertas via asServiceRole (contorna RLS para motoristas com role=user)
    // status 'requested': passageira solicitou, nenhum motorista foi acionado ainda
    // status 'assigned': dispatchRide encontrou motoristas e criou ofertas (mas corrida ainda não foi aceita)
    const allRidesRequested = await base44.asServiceRole.entities.Ride.filter({ status: 'requested' });
    const allRidesAssigned = await base44.asServiceRole.entities.Ride.filter({ status: 'assigned', assigned_driver_id: null });
    const allRides = [...allRidesRequested, ...allRidesAssigned];

    console.log(`[getAvailableRides] Total corridas abertas: ${allRides.length} (requested: ${allRidesRequested.length}, assigned: ${allRidesAssigned.length})`);

    // Filtro de tempo no código: apenas corridas dos últimos 30 minutos
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentRides = allRides.filter(r => new Date(r.created_date) >= thirtyMinutesAgo);

    console.log(`[getAvailableRides] Corridas recentes (últimos 30min): ${recentRides.length}`);

    // Excluir corridas que já têm motorista designada e excluir entregas (delivery)
    const openRides = recentRides.filter(r => !r.assigned_driver_id && r.ride_type !== 'delivery');

    console.log(`[getAvailableRides] Corridas sem motorista: ${openRides.length}`);

    // Filtrar por proximidade
    let filtered = openRides;
    if (driverLat != null && driverLng != null) {
      filtered = openRides
        .map(r => ({
          ...r,
          distance: haversine(driverLat, driverLng, r.pickup_lat, r.pickup_lng)
        }))
        .filter(r => r.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      console.log(`[getAvailableRides] Dentro de ${radiusKm}km: ${filtered.length}`);
    } else {
      // Sem localização: mostra todas as abertas (motorista ainda sem GPS)
      filtered = openRides.map(r => ({ ...r, distance: null }));
      console.log(`[getAvailableRides] Sem GPS da motorista, retornando todas: ${filtered.length}`);
    }

    // Enriquecer com dados das passageiras
    const enriched = await Promise.all(filtered.map(async (ride) => {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: ride.passenger_id });
        const passenger = users[0];
        return {
          ...ride,
          passengerName: passenger?.full_name || 'Passageira',
          passengerPhoto: passenger?.photo_url || null,
        };
      } catch {
        return { ...ride, passengerName: 'Passageira', passengerPhoto: null };
      }
    }));

    return Response.json({ success: true, rides: enriched });

  } catch (error) {
    console.error('[getAvailableRides] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});