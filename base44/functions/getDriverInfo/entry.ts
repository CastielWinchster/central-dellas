import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/** Motoristas visíveis no mapa — service role (passageiras não leem DriverPresence via RLS). */
const MAP_GRACE_MS = 5 * 60 * 1000;

async function listOnlineDriversForMap(base44: ReturnType<typeof createClientFromRequest>) {
  const graceCutoff = new Date(Date.now() - MAP_GRACE_MS).toISOString();
  let rows: Array<Record<string, unknown>> = [];

  try {
    rows = await base44.asServiceRole.entities.DriverPresence.filter({
      is_online: true,
      last_seen_at: { $gte: graceCutoff },
    });
  } catch (e) {
    console.warn('[getDriverInfo] map grace filter failed:', (e as Error).message);
    try {
      rows = await base44.asServiceRole.entities.DriverPresence.filter({ is_online: true });
    } catch (e2) {
      console.error('[getDriverInfo] map fallback failed:', (e2 as Error).message);
      return [];
    }
  }

  return rows
    .map((d) => {
      const lat = (d.lat ?? d.current_lat) as number | null;
      const lng = (d.lng ?? d.current_lng) as number | null;
      const seen = d.last_seen_at ? new Date(String(d.last_seen_at)).getTime() : 0;
      return {
        id: String(d.driver_id || ''),
        lat,
        lng,
        heading: Number(d.heading) || 0,
        tags: Array.isArray(d.tags) ? d.tags : [],
        is_available: d.is_available !== false,
        last_seen_at: d.last_seen_at,
        seen_ms_ago: seen ? Date.now() - seen : null,
      };
    })
    .filter((d) => d.id && d.lat != null && d.lng != null);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { driverId, mode } = body;

    if (mode === 'online_map') {
      const drivers = await listOnlineDriversForMap(base44);
      return Response.json({ success: true, drivers });
    }

    if (!driverId) {
      return Response.json({ error: 'driverId obrigatório' }, { status: 400 });
    }

    console.log(`[getDriverInfo] Buscando motorista: ${driverId}`);

    const [driverRows, vehicleRows] = await Promise.all([
      base44.asServiceRole.entities.User.filter({ id: driverId }),
      base44.asServiceRole.entities.Vehicle.filter({ driver_id: driverId }),
    ]);

    const driver = driverRows[0] || null;
    const vehicle = vehicleRows[0] || null;

    console.log(`[getDriverInfo] Encontrado: ${driver?.full_name} | Veículo: ${vehicle?.brand} ${vehicle?.model}`);

    return Response.json({
      name: driver?.full_name || null,
      photo: driver?.photo_url || null,
      phone: driver?.phone || null,
      rating: driver?.rating ?? null,
      totalRides: driver?.total_rides ?? null,
      vehicle: vehicle ? {
        brand: vehicle.brand || null,
        model: vehicle.model || null,
        color: vehicle.color || null,
        plate: vehicle.plate || null,
        year: vehicle.year || null,
        photo_url: vehicle.photo_url || null,
      } : null,
    });
  } catch (error) {
    console.error('[getDriverInfo] Erro:', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
