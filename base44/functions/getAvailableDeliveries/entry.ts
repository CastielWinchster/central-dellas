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

    const driver = await base44.auth.me();
    if (!driver) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { driverLat, driverLng, radiusKm = 15 } = await req.json();

    // Buscar entregas abertas via asServiceRole (contorna RLS)
    const allDeliveries = await base44.asServiceRole.entities.Ride.filter({
      status: 'requested',
      ride_type: 'delivery',
    }, '-created_date', 50);

    // Apenas últimos 30 minutos, sem motorista designado
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const open = allDeliveries.filter(r =>
      new Date(r.created_date) >= thirtyMinutesAgo && !r.assigned_driver_id
    );

    // Filtrar por proximidade e calcular distância
    const enriched = open
      .map(r => ({
        ...r,
        distance: (driverLat != null && driverLng != null)
          ? haversine(driverLat, driverLng, r.pickup_lat, r.pickup_lng)
          : null,
      }))
      .filter(r => r.distance === null || r.distance <= radiusKm)
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

    return Response.json({ success: true, deliveries: enriched });

  } catch (error) {
    console.error('[getAvailableDeliveries] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});