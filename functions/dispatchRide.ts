import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Calcular distância Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
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
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
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
    } = await req.json();
    
    if (!pickupLat || !pickupLng || !pickupText || !dropoffLat || !dropoffLng || !dropoffText) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 });
    }
    
    // Criar corrida
    const ride = await base44.entities.Ride.create({
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
    
    // Buscar motoristas online
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    const onlineDrivers = await base44.asServiceRole.entities.DriverPresence.filter({
      is_online: true,
      last_seen_at: { $gte: thirtySecondsAgo }
    });
    
    if (onlineDrivers.length === 0) {
      // Sem motoristas online: mantém corrida como 'requested' para aparecer na lista
      return Response.json({ 
        success: true,
        ride: { id: ride.id, status: 'requested', offers_count: 0 }
      });
    }
    
    // Calcular distâncias e filtrar por raio
    let nearbyDrivers = onlineDrivers.map(driver => ({
      ...driver,
      distance: calculateDistance(pickupLat, pickupLng, driver.lat, driver.lng)
    }));
    
    // Filtrar dentro de 5km
    nearbyDrivers = nearbyDrivers.filter(d => d.distance <= 5);
    
    // Se não houver motoristas em 5km, expandir para 8km
    if (nearbyDrivers.length === 0) {
      nearbyDrivers = onlineDrivers
        .map(driver => ({
          ...driver,
          distance: calculateDistance(pickupLat, pickupLng, driver.lat, driver.lng)
        }))
        .filter(d => d.distance <= 8);
      
      if (nearbyDrivers.length > 0) {
        await base44.asServiceRole.entities.Ride.update(ride.id, {
          search_radius_km: 8
        });
      }
    }
    
    // Se ainda não houver, expandir para 12km
    if (nearbyDrivers.length === 0) {
      nearbyDrivers = onlineDrivers
        .map(driver => ({
          ...driver,
          distance: calculateDistance(pickupLat, pickupLng, driver.lat, driver.lng)
        }))
        .filter(d => d.distance <= 12);
      
      if (nearbyDrivers.length > 0) {
        await base44.asServiceRole.entities.Ride.update(ride.id, {
          search_radius_km: 12
        });
      }
    }
    
    if (nearbyDrivers.length === 0) {
      await base44.asServiceRole.entities.Ride.update(ride.id, {
        status: 'expired'
      });
      return Response.json({ 
        error: 'Nenhuma motorista disponível em um raio de 12km',
        noDrivers: true,
        rideId: ride.id
      }, { status: 404 });
    }
    
    // Ordenar por distância
    nearbyDrivers.sort((a, b) => a.distance - b.distance);
    
    // Criar ofertas
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 20000); // 20 segundos
    
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
    
    // Atualizar corrida
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
    console.error('Erro no dispatchRide:', error);
    return Response.json({ 
      error: 'Erro ao processar corrida', 
      details: error.message 
    }, { status: 500 });
  }
});