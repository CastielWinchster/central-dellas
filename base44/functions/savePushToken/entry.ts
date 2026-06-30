import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { subscription, fcmToken, platform } = body;

    if (!subscription && !fcmToken) {
      return Response.json({ error: 'subscription or fcmToken required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { push_enabled: true };
    if (subscription) {
      updates.push_subscription = typeof subscription === 'string'
        ? subscription
        : JSON.stringify(subscription);
    }
    if (fcmToken) updates.fcm_token = String(fcmToken);
    if (platform) updates.push_platform = String(platform);

    const existing = await base44.asServiceRole.entities.UserPreferences.filter({ user_id: user.id });

    if (existing.length > 0) {
      await base44.asServiceRole.entities.UserPreferences.update(existing[0].id, updates);
    } else {
      await base44.asServiceRole.entities.UserPreferences.create({
        user_id: user.id,
        ...updates,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[savePushToken]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
