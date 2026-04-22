import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validar autenticação da passageira
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { driverId } = await req.json();
    if (!driverId) {
      return Response.json({ error: 'driverId obrigatório' }, { status: 400 });
    }

    console.log(`[getDriverInfo] Buscando motorista: ${driverId}`);

    // Usar asServiceRole para contornar RLS (passageira não pode ler dados de outros usuários)
    const [driverRows, vehicleRows] = await Promise.all([
      base44.asServiceRole.entities.User.filter({ id: driverId }),
      base44.asServiceRole.entities.Vehicle.filter({ driver_id: driverId })
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
    console.error('[getDriverInfo] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});