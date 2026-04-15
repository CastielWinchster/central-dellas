import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Função administrativa — apenas admin pode acionar diretamente
        const user = await base44.auth.me();
        if (!user) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (user.role !== 'admin') {
          return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
        
        // Buscar todos os usuários com notificações ativadas
        const allSettings = await base44.asServiceRole.entities.NotificationSettings.list();
        
        // Buscar motoristas disponíveis
        const availableDrivers = await base44.asServiceRole.entities.DriverPresence.filter({
            is_available: true
        });
        
        const carDrivers = availableDrivers.filter(d => d.vehicle_type === 'car');
        const motorcycleDrivers = availableDrivers.filter(d => d.vehicle_type === 'motorcycle');
        
        const now = new Date();
        let notificationsSent = 0;
        
        for (const settings of allSettings) {
            // Notificação de Carro
            if (settings.notify_car_availability && carDrivers.length > 0) {
                const lastSent = settings.last_car_availability_notification_sent 
                    ? new Date(settings.last_car_availability_notification_sent)
                    : null;
                
                const hoursSinceLastNotification = lastSent 
                    ? (now - lastSent) / (1000 * 60 * 60)
                    : settings.availability_notification_frequency + 1;
                
                if (hoursSinceLastNotification >= settings.availability_notification_frequency) {
                    await base44.asServiceRole.entities.Notification.create({
                        user_id: settings.user_id,
                        title: "Peça seu carro agora! 🚗💖✨",
                        message: "Sua viagem com total segurança e entre mulheres.",
                        type: "system",
                        is_read: false,
                        is_persistent: true
                    });
                    
                    await base44.asServiceRole.entities.NotificationSettings.update(settings.id, {
                        last_car_availability_notification_sent: now.toISOString()
                    });
                    
                    notificationsSent++;
                }
            }
            
            // Notificação de Moto (Rotta Roza)
            if (settings.notify_motorcycle_availability && motorcycleDrivers.length > 0) {
                const lastSent = settings.last_motorcycle_availability_notification_sent 
                    ? new Date(settings.last_motorcycle_availability_notification_sent)
                    : null;
                
                const hoursSinceLastNotification = lastSent 
                    ? (now - lastSent) / (1000 * 60 * 60)
                    : settings.availability_notification_frequency + 1;
                
                if (hoursSinceLastNotification >= settings.availability_notification_frequency) {
                    await base44.asServiceRole.entities.Notification.create({
                        user_id: settings.user_id,
                        title: "ROTTA ROZA 🏍",
                        message: "De mulher para mulher sua segurança é nossa!",
                        type: "system",
                        is_read: false,
                        is_persistent: true
                    });
                    
                    await base44.asServiceRole.entities.NotificationSettings.update(settings.id, {
                        last_motorcycle_availability_notification_sent: now.toISOString()
                    });
                    
                    notificationsSent++;
                }
            }
        }
        
        // ── Notificar motoristas sobre corridas pendentes ──
        try {
            const pendingRides = await base44.asServiceRole.entities.Ride.filter({
                status: 'requested',
            });

            if (pendingRides.length > 0 && availableDrivers.length > 0) {
                const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

                for (const driver of availableDrivers) {
                    // Anti-spam: verificar se já foi notificada nos últimos 2 minutos
                    const recentNotifs = await base44.asServiceRole.entities.Notification.filter({
                        user_id: driver.driver_id ?? driver.user_id,
                        type: 'ride',
                    });
                    const lastNotif = recentNotifs[0]?.created_date;
                    if (lastNotif && new Date(lastNotif) > twoMinutesAgo) continue;

                    await base44.asServiceRole.entities.Notification.create({
                        user_id: driver.driver_id ?? driver.user_id,
                        title: '🚗 Nova corrida disponível!',
                        message: pendingRides.length === 1
                            ? 'Há uma corrida aguardando. Aceite agora!'
                            : `Há ${pendingRides.length} corridas aguardando. Aceite agora!`,
                        type: 'ride',
                        is_read: false,
                        is_persistent: false,
                    });
                    notificationsSent++;
                }
            }
        } catch (driverNotifyErr) {
            console.warn('[sendAvailabilityNotifications] Erro ao notificar motoristas:', driverNotifyErr.message);
        }

        return Response.json({ 
            success: true, 
            notificationsSent,
            carDriversAvailable: carDrivers.length,
            motorcycleDriversAvailable: motorcycleDrivers.length
        });
    } catch (error) {
        console.error('Erro ao enviar notificações:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});