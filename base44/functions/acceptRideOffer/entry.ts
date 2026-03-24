import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    const { rideId, offerId } = await req.json();
    
    if (!rideId) {
      return Response.json({ error: 'rideId é obrigatório' }, { status: 400 });
    }
    
    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    if (rides.length === 0) {
      return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });
    }
    
    const ride = rides[0];
    
    if (ride.status !== 'requested' && ride.status !== 'assigned') {
      return Response.json({ 
        error: 'Corrida não disponível', 
        reason: 'Já foi aceita ou cancelada' 
      }, { status: 409 });
    }
    
    if (ride.assigned_driver_id && ride.assigned_driver_id !== user.id) {
      return Response.json({ error: 'Corrida já aceita por outra motorista' }, { status: 409 });
    }

    const now = new Date();

    // Se foi passado offerId, verificar e expirar a oferta
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
        // Expirar outras ofertas
        const allOffers = await base44.asServiceRole.entities.RideOffer.filter({ ride_id: rideId });
        await Promise.all(
          allOffers
            .filter(o => o.id !== offerId && (o.status === 'sent' || o.status === 'seen'))
            .map(o => base44.asServiceRole.entities.RideOffer.update(o.id, { status: 'expired' }))
        );
      }
    }

    // Aceitar corrida
    await base44.asServiceRole.entities.Ride.update(ride.id, {
      status: 'accepted',
      assigned_driver_id: user.id
    });

    // Notificar passageira
    await base44.asServiceRole.entities.Notification.create({
      user_id: ride.passenger_id,
      title: 'Motorista encontrada!',
      message: `${user.full_name} aceitou sua corrida`,
      type: 'ride',
      is_read: false,
      is_persistent: true
    });

    return Response.json({ 
      success: true, 
      ride: {
        id: ride.id,
        status: 'accepted',
        pickup_text: ride.pickup_text,
        dropoff_text: ride.dropoff_text,
        passenger_id: ride.passenger_id
      }
    });
    
  } catch (error) {
    console.error('Erro no acceptRideOffer:', error);
    return Response.json({ 
      error: 'Erro no servidor', 
      details: error.message 
    }, { status: 500 });
  }
});