import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    console.log(`[acceptRideOffer] Motorista: ${driver.id} (${driver.email})`);

    const { rideId, offerId, driverConfirmedPrice } = await req.json();

    if (!rideId) {
      return Response.json({ error: 'rideId é obrigatório' }, { status: 400 });
    }

    // Buscar corrida via asServiceRole para contornar RLS
    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    if (rides.length === 0) {
      return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });
    }

    const ride = rides[0];
    console.log(`[acceptRideOffer] Corrida encontrada: ${ride.id} | status: ${ride.status}`);

    // Só aceitar se ainda estiver disponível
    if (ride.status !== 'requested' && ride.status !== 'assigned') {
      return Response.json({
        error: 'Corrida não disponível',
        reason: `Status atual: ${ride.status}`
      }, { status: 409 });
    }

    // Evitar aceitar corrida já aceita por outra motorista
    if (ride.assigned_driver_id && ride.assigned_driver_id !== driver.id) {
      return Response.json({ error: 'Corrida já aceita por outra motorista' }, { status: 409 });
    }

    const now = new Date();

    // Atualizar oferta se fornecida
    if (offerId) {
      const offers = await base44.asServiceRole.entities.RideOffer.filter({ id: offerId });
      if (offers.length > 0) {
        const offer = offers[0];
        if (new Date(offer.expires_at) < now) {
          await base44.asServiceRole.entities.RideOffer.update(offer.id, { status: 'expired' });
          return Response.json({ error: 'Oferta expirada', expired: true }, { status: 410 });
        }
        await base44.asServiceRole.entities.RideOffer.update(offer.id, {
          status: 'accepted',
          responded_at: now.toISOString()
        });
        // Expirar as demais ofertas desta corrida
        const allOffers = await base44.asServiceRole.entities.RideOffer.filter({ ride_id: rideId });
        await Promise.all(
          allOffers
            .filter(o => o.id !== offerId && (o.status === 'sent' || o.status === 'seen'))
            .map(o => base44.asServiceRole.entities.RideOffer.update(o.id, { status: 'expired' }))
        );
      }
    }

    // ✅ UPDATE PRINCIPAL: status = 'accepted' + assigned_driver_id + preço confirmado
    console.log(`[acceptRideOffer] Atualizando corrida ${ride.id} → accepted, driver: ${driver.id}, price: ${driverConfirmedPrice}`);
    await base44.asServiceRole.entities.Ride.update(ride.id, {
      status: 'accepted',
      assigned_driver_id: driver.id,
      ...(driverConfirmedPrice != null ? {
        driver_confirmed_price: driverConfirmedPrice,
        price_validated_at: now.toISOString(),
      } : {})
    });
    console.log(`[acceptRideOffer] Corrida atualizada com sucesso`);

    // Notificar passageira
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: ride.passenger_id,
        title: 'Motorista encontrada! 🚗',
        message: `${driver.full_name} aceitou sua corrida`,
        type: 'ride',
        is_read: false,
        is_persistent: true
      });
    } catch (notifErr) {
      console.warn('[acceptRideOffer] Falha ao criar notificação:', notifErr.message);
    }

    return Response.json({
      success: true,
      ride: {
        id: ride.id,
        status: 'accepted',
        assigned_driver_id: driver.id,
        pickup_text: ride.pickup_text,
        dropoff_text: ride.dropoff_text,
        pickup_lat: ride.pickup_lat,
        pickup_lng: ride.pickup_lng,
        dropoff_lat: ride.dropoff_lat,
        dropoff_lng: ride.dropoff_lng,
        passenger_id: ride.passenger_id
      }
    });

  } catch (error) {
    console.error('[acceptRideOffer] Erro geral:', error.message);
    return Response.json({
      error: 'Erro no servidor',
      details: error.message
    }, { status: 500 });
  }
});