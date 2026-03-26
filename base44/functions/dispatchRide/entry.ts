import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Calcular distância Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Autenticar usuário
    let user;
    try {
      user = await base44.auth.me();
    } catch (e) {
      console.error('[dispatchRide] Falha auth.me:', e.message);
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    console.log(`[dispatchRide] Usuário autenticado: ${user.id} (${user.email})`);

    const body = await req.json();
    const {
      pickupLat,
      pickupLng,
      pickupText,
      dropoffLat,
      dropoffLng,
      dropoffText,
      estimatedPrice,
      estimatedDuration,
      rideType,
      hasPet
    } = body;

    if (!pickupLat || !pickupLng || !pickupText || !dropoffLat || !dropoffLng || !dropoffText) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Criar corrida via asServiceRole (RLS create = null, sem restrição)
    console.log('[dispatchRide] Criando corrida para passenger_id:', user.id);
    let ride;
    try {
      ride = await base44.asServiceRole.entities.Ride.create({
        passenger_id: user.id,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        pickup_text: pickupText,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
        dropoff_text: dropoffText,
        status: 'requested',
        search_radius_km: 5,
        estimated_price: estimatedPrice,
        estimated_duration: estimatedDuration,
        ride_type: rideType || 'standard',
        has_pet: hasPet || false
      });
    } catch (e) {
      console.error('[dispatchRide] Erro ao criar Ride:', e.message);
      return Response.json({ error: 'Falha ao criar corrida: ' + e.message }, { status: 500 });
    }

    console.log(`[dispatchRide] Corrida criada: ${ride.id}`);

    // Buscar motoristas online nos últimos 60 segundos
    const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
    let onlineDrivers = [];
    try {
      // Tenta pelo campo is_online + last_seen_at
      const byOnline = await base44.asServiceRole.entities.DriverPresence.filter({
        is_online: true,
        last_seen_at: { $gte: sixtySecondsAgo }
      });
      onlineDrivers = byOnline;

      // Se não encontrou, tenta fallback com is_available (campo legado)
      if (onlineDrivers.length === 0) {
        const byAvailable = await base44.asServiceRole.entities.DriverPresence.filter({
          is_available: true
        });
        onlineDrivers = byAvailable;
        console.log(`[dispatchRide] Fallback is_available: ${onlineDrivers.length} motoristas`);
      }

      // Normalizar coordenadas: aceitar lat/lng ou current_lat/current_lng
      onlineDrivers = onlineDrivers.map(d => ({
        ...d,
        lat: d.lat ?? d.current_lat,
        lng: d.lng ?? d.current_lng,
      })).filter(d => d.lat != null && d.lng != null);

    } catch (e) {
      console.warn('[dispatchRide] Não foi possível buscar DriverPresence:', e.message);
    }

    console.log(`[dispatchRide] Motoristas online: ${onlineDrivers.length}`);

    if (onlineDrivers.length === 0) {
      // Sem motoristas: corrida fica como 'requested' para aparecer na lista
      return Response.json({
        success: true,
        message: 'No drivers found, ride is pending.',
        ride: { id: ride.id, status: 'requested', offers_count: 0 }
      });
    }

    // Filtrar por proximidade — raio expansivo: 5km → 8km → 12km
    let nearbyDrivers = onlineDrivers
      .map(d => ({ ...d, distance: calculateDistance(pickupLat, pickupLng, d.lat, d.lng) }))
      .filter(d => d.distance <= 5);

    if (nearbyDrivers.length === 0) {
      nearbyDrivers = onlineDrivers
        .map(d => ({ ...d, distance: calculateDistance(pickupLat, pickupLng, d.lat, d.lng) }))
        .filter(d => d.distance <= 8);
      if (nearbyDrivers.length > 0) {
        await base44.asServiceRole.entities.Ride.update(ride.id, { search_radius_km: 8 });
      }
    }

    if (nearbyDrivers.length === 0) {
      nearbyDrivers = onlineDrivers
        .map(d => ({ ...d, distance: calculateDistance(pickupLat, pickupLng, d.lat, d.lng) }))
        .filter(d => d.distance <= 12);
      if (nearbyDrivers.length > 0) {
        await base44.asServiceRole.entities.Ride.update(ride.id, { search_radius_km: 12 });
      }
    }

    if (nearbyDrivers.length === 0) {
      // Nenhum motorista no raio de 12km — corrida fica como 'requested' (não expira imediatamente)
      console.log(`[dispatchRide] Nenhum motorista em 12km. Corrida ${ride.id} permanece como 'requested'.`);
      return Response.json({
        success: true,
        message: 'No drivers found, ride is pending.',
        ride: { id: ride.id, status: 'requested', offers_count: 0 }
      });
    }

    nearbyDrivers.sort((a, b) => a.distance - b.distance);
    console.log(`[dispatchRide] Motoristas próximas: ${nearbyDrivers.length}`);

    // Criar ofertas
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30000); // 30 segundos

    const offerPromises = nearbyDrivers.map(driver =>
      base44.asServiceRole.entities.RideOffer.create({
        ride_id: ride.id,
        driver_id: driver.driver_id,
        status: 'sent',
        sent_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        distance_km: parseFloat(driver.distance.toFixed(2))
      })
    );

    await Promise.all(offerPromises);

    await base44.asServiceRole.entities.Ride.update(ride.id, {
      status: 'assigned',
      offer_expires_at: expiresAt.toISOString()
    });

    return Response.json({
      success: true,
      ride: {
        id: ride.id,
        status: 'assigned',
        offers_count: nearbyDrivers.length,
        expires_at: expiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('[dispatchRide] Erro geral:', error.message, '| status:', error.status);
    return Response.json({
      error: 'Erro ao processar corrida',
      details: error.message
    }, { status: 500 });
  }
});