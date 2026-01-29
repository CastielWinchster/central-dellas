import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // Verificar se é motorista
    if (user.user_type !== 'driver' && user.user_type !== 'both') {
      return Response.json({ error: 'Apenas motoristas podem aceitar corridas' }, { status: 403 });
    }
    
    const { rideId, offerId } = await req.json();
    
    if (!rideId || !offerId) {
      return Response.json({ error: 'rideId e offerId são obrigatórios' }, { status: 400 });
    }
    
    // Buscar a corrida usando service role para poder atualizar
    const rides = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    
    if (rides.length === 0) {
      return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });
    }
    
    const ride = rides[0];
    
    // Verificar se corrida ainda está disponível
    if (ride.status !== 'requested' && ride.status !== 'assigned') {
      return Response.json({ 
        error: 'Corrida não disponível', 
        reason: 'Já foi aceita por outra motorista ou cancelada' 
      }, { status: 409 });
    }
    
    if (ride.assigned_driver_id && ride.assigned_driver_id !== user.id) {
      return Response.json({ 
        error: 'Corrida já aceita por outra motorista' 
      }, { status: 409 });
    }
    
    // Verificar se a oferta ainda é válida
    const offers = await base44.asServiceRole.entities.RideOffer.filter({ id: offerId });
    
    if (offers.length === 0) {
      return Response.json({ error: 'Oferta não encontrada' }, { status: 404 });
    }
    
    const offer = offers[0];
    
    if (offer.driver_id !== user.id) {
      return Response.json({ error: 'Esta oferta não é sua' }, { status: 403 });
    }
    
    if (offer.status !== 'sent' && offer.status !== 'seen') {
      return Response.json({ error: 'Oferta não está mais disponível' }, { status: 409 });
    }
    
    // Verificar expiração
    const now = new Date();
    const expiresAt = new Date(offer.expires_at);
    
    if (now > expiresAt) {
      // Expirar oferta
      await base44.asServiceRole.entities.RideOffer.update(offer.id, {
        status: 'expired'
      });
      
      return Response.json({ 
        error: 'Oferta expirada', 
        expired: true 
      }, { status: 410 });
    }
    
    // ACEITAR A CORRIDA (operação atômica simulada)
    try {
      // Atualizar corrida
      await base44.asServiceRole.entities.Ride.update(ride.id, {
        status: 'accepted',
        assigned_driver_id: user.id
      });
      
      // Atualizar oferta da motorista
      await base44.asServiceRole.entities.RideOffer.update(offer.id, {
        status: 'accepted',
        responded_at: now.toISOString()
      });
      
      // Expirar todas as outras ofertas desta corrida
      const allOffers = await base44.asServiceRole.entities.RideOffer.filter({ 
        ride_id: rideId 
      });
      
      const expirePromises = allOffers
        .filter(o => o.id !== offer.id && (o.status === 'sent' || o.status === 'seen'))
        .map(o => 
          base44.asServiceRole.entities.RideOffer.update(o.id, { 
            status: 'expired' 
          })
        );
      
      await Promise.all(expirePromises);
      
      // Criar notificação para passageira
      await base44.asServiceRole.entities.Notification.create({
        user_id: ride.passenger_id,
        title: 'Motorista encontrada!',
        message: `${user.full_name} aceitou sua corrida`,
        type: 'ride_status',
        related_id: ride.id,
        icon: '🚗'
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
      console.error('Erro ao aceitar corrida:', error);
      return Response.json({ 
        error: 'Erro ao processar aceitação', 
        details: error.message 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Erro no acceptRideOffer:', error);
    return Response.json({ 
      error: 'Erro no servidor', 
      details: error.message 
    }, { status: 500 });
  }
});