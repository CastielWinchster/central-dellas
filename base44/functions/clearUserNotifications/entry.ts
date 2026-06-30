import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const notifs = await base44.asServiceRole.entities.Notification.filter({ user_id: user.id });

    if (notifs.length > 0) {
      await Promise.allSettled(
        notifs.map((n) =>
          base44.asServiceRole.entities.Notification.delete(String(n.id))
        ),
      );
    }

    console.log(`[clearUserNotifications] ${user.email} → ${notifs.length} removidas`);

    return Response.json({ success: true, deleted: notifs.length });
  } catch (error) {
    console.error('[clearUserNotifications]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
