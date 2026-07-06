import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/** Motoristas visíveis no mapa — service role (passageiras não leem DriverPresence via RLS). */
const MAP_GRACE_MS = 3 * 60 * 1000;

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

function startOfTodayBrazil() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return new Date(`${y}-${m}-${d}T03:00:00.000Z`);
}

function rideEarningsAmount(ride: Record<string, unknown>) {
  return Number(ride.driver_confirmed_price ?? ride.agreed_price ?? ride.estimated_price ?? 0);
}

function isDriverUser(user: Record<string, unknown>) {
  const type = String(user.user_type || '');
  return type === 'driver' || type === 'both' || user.role === 'admin';
}

async function listCompletedRidesForDriver(
  base44: ReturnType<typeof createClientFromRequest>,
  driverId: string,
) {
  let rides: Array<Record<string, unknown>> = [];
  try {
    rides = await base44.asServiceRole.entities.Ride.filter({
      assigned_driver_id: driverId,
      status: 'completed',
    });
  } catch (e) {
    console.error('[getDriverInfo] completed rides filter failed:', (e as Error).message);
    return [];
  }
  rides.sort(
    (a, b) =>
      new Date(String(b.created_date)).getTime() - new Date(String(a.created_date)).getTime(),
  );
  return rides;
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

    if (mode === 'completed_rides') {
      if (!isDriverUser(user)) {
        return Response.json({ error: 'Acesso negado' }, { status: 403 });
      }
      const rides = await listCompletedRidesForDriver(base44, String(user.id));
      const today = startOfTodayBrazil();
      const todayRides = rides.filter((r) => new Date(String(r.created_date)) >= today);
      const todayEarnings = todayRides.reduce((sum, r) => sum + rideEarningsAmount(r), 0);
      return Response.json({
        success: true,
        rides,
        today: { rides: todayRides.length, earnings: todayEarnings },
      });
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
