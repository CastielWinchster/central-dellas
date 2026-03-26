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

    // Autenticar motorista
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

    // Buscar corridas disponíveis (requested ou assigned sem driver) via asServiceRole
    // para contornar o RLS que bloqueia motoristas de ver corridas de passageiras
    const rides = await base44.asServiceRole.entities.Ride.filter({
      status: 'requested'
    });

    console.log(`[getAvailableRides] Total corridas requested: ${rides.length}`);

    // Filtrar por proximidade se localização disponível
    let filtered = rides;
    if (driverLat != null && driverLng != null) {
      filtered = rides
        .map(r => ({
          ...r,
          distance: haversine(driverLat, driverLng, r.pickup_lat, r.pickup_lng)
        }))
        .filter(r => r.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
    }

    console.log(`[getAvailableRides] Corridas dentro de ${radiusKm}km: ${filtered.length}`);

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