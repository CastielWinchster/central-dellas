import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function isDriver(user: Record<string, unknown>) {
  const type = String(user.user_type || '');
  return type === 'driver' || type === 'both' || user.role === 'admin';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const driver = await base44.auth.me();
    if (!driver) return Response.json({ error: 'Não autenticado' }, { status: 401 });
    if (!isDriver(driver)) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const body = await req.json();
    const isOnline = body.isOnline !== false;
    const isAvailable = 'isAvailable' in body ? !!body.isAvailable : isOnline;

    const presences = await base44.asServiceRole.entities.DriverPresence.filter({ driver_id: driver.id });
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      driver_id: driver.id,
      is_online: isOnline,
      is_available: isOnline && isAvailable,
      last_seen_at: now,
    };

    if (body.lat != null && body.lng != null) {
      payload.lat = body.lat;
      payload.lng = body.lng;
      payload.accuracy = body.accuracy ?? 0;
      payload.heading = body.heading ?? 0;
      payload.speed = body.speed ?? 0;
    }

    let record = presences[0];
    if (record?.id) {
      await base44.asServiceRole.entities.DriverPresence.update(String(record.id), payload);
      const updated = await base44.asServiceRole.entities.DriverPresence.filter({ driver_id: driver.id });
      record = updated[0] || record;
    } else if (isOnline) {
      record = await base44.asServiceRole.entities.DriverPresence.create({
        ...payload,
        lat: payload.lat ?? -20.7195,
        lng: payload.lng ?? -47.8864,
      });
    }

    console.log(`[setDriverPresence] ${driver.email} → online=${isOnline} available=${payload.is_available}`);

    return Response.json({ success: true, presence: record || null });
  } catch (error) {
    console.error('[setDriverPresence]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
