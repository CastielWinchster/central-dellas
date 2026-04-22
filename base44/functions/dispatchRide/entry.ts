import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
      pickupText,  pickup_text,
      dropoffLat,
      dropoffLng,
      dropoffText, dropoff_text,
      estimatedPrice,
      agreedPrice,
      isCustomPrice,
      estimatedDuration,
      rideType = 'standard',
      hasPet,
      packageSize,
      couponCode,
    } = body;

    // Aceitar tanto pickupText quanto pickup_text (compatibilidade)
    const resolvedPickupText = pickupText || pickup_text;
    const resolvedDropoffText = dropoffText || dropoff_text;

    if (!pickupLat || !pickupLng || !resolvedPickupText || !dropoffLat || !dropoffLng || !resolvedDropoffText) {
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
        pickup_text: resolvedPickupText,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
        dropoff_text: resolvedDropoffText,
        status: 'requested',
        search_radius_km: 5,
        estimated_price: estimatedPrice,
        agreed_price: agreedPrice ?? null,
        is_custom_price: isCustomPrice ?? false,
        estimated_duration: estimatedDuration,
        ride_type: rideType,
        has_pet: hasPet || false,
        package_size: packageSize || null,
      });
    } catch (e) {
      console.error('[dispatchRide] Erro ao criar Ride:', e.message);
      return Response.json({ error: 'Falha ao criar corrida: ' + e.message }, { status: 500 });
    }

    console.log(`[dispatchRide] Corrida criada: ${ride.id}`);

    // Buscar motoristas ONLINE E COM SWITCH LIGADO (is_available + is_online)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    let onlineDrivers = [];
    try {
      // CRÍTICO: exige is_available=true (switch ligado) E is_online=true
      const byOnline = await base44.asServiceRole.entities.DriverPresence.filter({
        is_available: true,
        is_online: true,
        last_seen_at: { $gte: fiveMinutesAgo }
      });
      onlineDrivers = byOnline;
      console.log(`[dispatchRide] is_available+is_online (últimos 5min): ${onlineDrivers.length}`);

      // Fallback: tolerar lag de rede mas MANTER is_available obrigatório
      if (onlineDrivers.length === 0) {
        const byAvailableNoTime = await base44.asServiceRole.entities.DriverPresence.filter({
          is_available: true,
          is_online: true,
        });
        onlineDrivers = byAvailableNoTime;
        console.log(`[dispatchRide] Fallback is_available+is_online sem tempo: ${onlineDrivers.length}`);
      }

      // Normalizar coordenadas
      onlineDrivers = onlineDrivers.map(d => ({
        ...d,
        lat: d.lat ?? d.current_lat,
        lng: d.lng ?? d.current_lng,
      })).filter(d => d.lat != null && d.lng != null);

      console.log(`[dispatchRide] Motoristas disponíveis com coordenadas: ${onlineDrivers.length}`);

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

    // Notificar motoristas próximas sobre nova corrida disponível
    try {
      const notifyPromises = nearbyDrivers.map(driver =>
        base44.asServiceRole.entities.Notification.create({
          user_id: driver.driver_id,
          title: rideType === 'delivery' ? '📦 Nova entrega disponível!' : '🚗 Nova corrida disponível!',
        message: `${resolvedPickupText || 'Origem'} → ${resolvedDropoffText || 'destino'}`,
          type: 'ride',
          is_read: false,
          is_persistent: false,
        })
      );
      await Promise.allSettled(notifyPromises);
      console.log(`[dispatchRide] ${nearbyDrivers.length} motoristas notificadas`);
    } catch (notifyErr) {
      console.warn('[dispatchRide] Falha ao notificar motoristas:', notifyErr.message);
    }

    // Registrar uso do cupom se foi aplicado
    if (couponCode) {
      try {
        const normalizedCode = couponCode.trim().replace(/\s+/g, '').toLowerCase();
        const allPromos = await base44.asServiceRole.entities.PromoCode.filter({ is_active: true });
        const promo = allPromos.find(p => p.code.trim().replace(/\s+/g, '').toLowerCase() === normalizedCode);
        if (promo) {
          await base44.asServiceRole.entities.PromoCode.update(promo.id, {
            current_uses: (promo.current_uses || 0) + 1
          });
          console.log('[dispatchRide] Cupom registrado:', promo.code, '| Usos:', (promo.current_uses || 0) + 1);
        }
      } catch (promoErr) {
        console.warn('[dispatchRide] Erro ao registrar cupom:', promoErr.message);
      }
    }

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