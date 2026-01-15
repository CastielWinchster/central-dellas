import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { scheduledRideId, message } = await req.json();
    const base44 = createClientFromRequest(req);

    // Buscar corrida agendada
    const ride = await base44.entities.ScheduledRide.get(scheduledRideId);
    
    if (!ride) {
      return Response.json({ error: 'Corrida não encontrada' }, { status: 404 });
    }

    // Buscar usuário
    const user = await base44.entities.User.get(ride.passenger_id);
    
    if (!user) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Enviar notificação
    await base44.asServiceRole.entities.Notification.create({
      user_id: ride.passenger_id,
      title: '🚗 Lembrete de Corrida Agendada',
      message: message || `Sua corrida está agendada para ${new Date(ride.scheduled_time).toLocaleString('pt-BR')}. Local: ${ride.pickup_address}`,
      type: 'ride_status',
      related_id: scheduledRideId,
      icon: '🔔'
    });

    // Se tiver telefone, enviar SMS (simulado)
    if (user.phone) {
      console.log(`SMS enviado para ${user.phone}: ${message}`);
    }

    return Response.json({ 
      success: true,
      message: 'Lembrete enviado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao enviar lembrete:', error);
    return Response.json({ 
      error: 'Falha ao enviar lembrete',
      details: error.message 
    }, { status: 500 });
  }
});