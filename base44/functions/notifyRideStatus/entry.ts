import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // This function is triggered by Ride entity automation
    const { event, data } = payload;
    
    if (event.type !== 'update') {
      return Response.json({ success: true, message: 'Not an update event' });
    }

    const ride = data;
    if (!ride) {
      return Response.json({ error: 'No ride data' }, { status: 400 });
    }

    let title = '';
    let message = '';
    let notifyDriver = false;
    let notifyPassenger = false;

    switch (ride.status) {
      case 'accepted':
        title = '🚗 Corrida Aceita!';
        message = 'Uma motorista aceitou sua corrida e está a caminho!';
        notifyPassenger = true;
        break;
      case 'arriving':
        title = '📍 Motorista Chegando';
        message = 'Sua motorista está chegando ao local de embarque.';
        notifyPassenger = true;
        break;
      case 'in_progress':
        title = '🎯 Corrida em Andamento';
        message = 'Sua corrida começou! Boa viagem!';
        notifyPassenger = true;
        break;
      case 'completed':
        title = '✅ Corrida Concluída';
        message = 'Você chegou ao seu destino! Obrigada por usar Central Dellas.';
        notifyPassenger = true;
        notifyDriver = true;
        break;
      case 'cancelled':
        title = '❌ Corrida Cancelada';
        message = 'A corrida foi cancelada.';
        notifyPassenger = true;
        notifyDriver = true;
        break;
    }

    if (title && message) {
      // Notify passenger
      if (notifyPassenger && ride.passenger_id) {
        await base44.asServiceRole.functions.invoke('sendNotification', {
          user_id: ride.passenger_id,
          title,
          message,
          type: 'ride',
          related_id: ride.id,
          icon: '🚗',
          action_url: `/ride/${ride.id}`,
          send_email: true,
          send_sms: true
        });
      }

      // Notify driver
      if (notifyDriver && ride.driver_id) {
        await base44.asServiceRole.functions.invoke('sendNotification', {
          user_id: ride.driver_id,
          title,
          message: ride.status === 'completed' ? 'Corrida finalizada com sucesso!' : message,
          type: 'ride',
          related_id: ride.id,
          icon: '🚗',
          action_url: `/ride/${ride.id}`,
          send_email: true
        });
      }
    }

    return Response.json({ success: true, notified: { passenger: notifyPassenger, driver: notifyDriver } });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});