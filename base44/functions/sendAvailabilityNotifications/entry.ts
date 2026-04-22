import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Notificações de disponibilidade para passageiras (carro/moto)
    const allSettings = await base44.asServiceRole.entities.NotificationSettings.list();
    const availableDrivers = await base44.asServiceRole.entities.DriverPresence.filter({
      is_available: true,
      is_online: true,
    });
    const carDrivers = availableDrivers.filter(d => d.vehicle_type === 'car');
    const motorcycleDrivers = availableDrivers.filter(d => d.vehicle_type === 'motorcycle');

    const now = new Date();
    let notificationsSent = 0;

    for (const settings of allSettings) {
      if (settings.notify_car_availability && carDrivers.length > 0) {
        const lastSent = settings.last_car_availability_notification_sent
          ? new Date(settings.last_car_availability_notification_sent) : null;
        const hoursSince = lastSent
          ? (now - lastSent) / (1000 * 60 * 60)
          : settings.availability_notification_frequency + 1;
        if (hoursSince >= settings.availability_notification_frequency) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: settings.user_id,
            title: "Peça seu carro agora! 🚗💖✨",
            message: "Sua viagem com total segurança e entre mulheres.",
            type: "system", is_read: false, is_persistent: true
          });
          await base44.asServiceRole.entities.NotificationSettings.update(settings.id, {
            last_car_availability_notification_sent: now.toISOString()
          });
          notificationsSent++;
        }
      }
      if (settings.notify_motorcycle_availability && motorcycleDrivers.length > 0) {
        const lastSent = settings.last_motorcycle_availability_notification_sent
          ? new Date(settings.last_motorcycle_availability_notification_sent) : null;
        const hoursSince = lastSent
          ? (now - lastSent) / (1000 * 60 * 60)
          : settings.availability_notification_frequency + 1;
        if (hoursSince >= settings.availability_notification_frequency) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: settings.user_id,
            title: "ROTTA ROZA 🏍",
            message: "De mulher para mulher sua segurança é nossa!",
            type: "system", is_read: false, is_persistent: true
          });
          await base44.asServiceRole.entities.NotificationSettings.update(settings.id, {
            last_motorcycle_availability_notification_sent: now.toISOString()
          });
          notificationsSent++;
        }
      }
    }

    // Notificar motoristas sobre corridas pendentes
    // CRÍTICO: apenas motoristas ONLINE E DISPONÍVEIS (switch ligado)
    const pendingRides = await base44.asServiceRole.entities.Ride.filter({ status: 'requested' });

    if (pendingRides.length > 0 && availableDrivers.length > 0) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      for (const driver of availableDrivers) {
        const driverId = driver.driver_id ?? driver.user_id;
        if (!driverId) continue;

        // Anti-spam: verificar se já recebeu notificação de corrida nos últimos 5 minutos
        const recentNotifs = await base44.asServiceRole.entities.Notification.filter({
          user_id: driverId,
          type: 'ride',
        }, '-created_date', 1);

        if (recentNotifs.length > 0 && new Date(recentNotifs[0].created_date) > fiveMinutesAgo) {
          console.log(`[sendAvailabilityNotifications] ${driverId} já notificada recentemente, pulando`);
          continue;
        }

        await base44.asServiceRole.entities.Notification.create({
          user_id: driverId,
          title: '🚗 Nova corrida disponível!',
          message: pendingRides.length === 1
            ? 'Há uma corrida aguardando. Aceite agora!'
            : `Há ${pendingRides.length} corridas aguardando. Aceite agora!`,
          type: 'ride',
          is_read: false,
          is_persistent: false,
        });
        notificationsSent++;
        console.log(`[sendAvailabilityNotifications] Notificação enviada para ${driverId}`);
      }
    }

    console.log(`[sendAvailabilityNotifications] Motoristas online: ${availableDrivers.length}, notificações: ${notificationsSent}`);

    return Response.json({
      success: true,
      notificationsSent,
      driversOnlineAndAvailable: availableDrivers.length,
      pendingRides: pendingRides.length,
    });
  } catch (error) {
    console.error('[sendAvailabilityNotifications] Erro:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});