import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const notifications = await base44.asServiceRole.entities.Notification.filter({
      user_id: user.id,
    });

    if (notifications.length === 0) {
      return Response.json({ success: true, deleted: 0 });
    }

    await Promise.allSettled(
      notifications.map((n) =>
        base44.asServiceRole.entities.Notification.delete(String(n.id)),
      ),
    );

    console.log(`[clearAllNotifications] ${user.email} → ${notifications.length} removidas`);

    return Response.json({ success: true, deleted: notifications.length });
  } catch (error) {
    console.error('[clearAllNotifications]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
