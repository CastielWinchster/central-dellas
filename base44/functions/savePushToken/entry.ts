import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { subscription } = await req.json();
    if (!subscription) return Response.json({ error: 'subscription required' }, { status: 400 });

    const existing = await base44.entities.UserPreferences.filter({ user_id: user.id });
    const subStr = JSON.stringify(subscription);

    if (existing.length > 0) {
      await base44.entities.UserPreferences.update(existing[0].id, {
        push_subscription: subStr,
        push_enabled: true,
      });
    } else {
      await base44.entities.UserPreferences.create({
        user_id: user.id,
        push_subscription: subStr,
        push_enabled: true,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[savePushToken]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});