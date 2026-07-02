import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const prefs = await base44.asServiceRole.entities.UserPreferences.filter({ user_id: user.id });
    const pref = prefs[0] || null;

    return Response.json({
      success: true,
      userId: user.id,
      push_enabled: !!pref?.push_enabled,
      has_subscription: !!pref?.push_subscription,
      has_fcm_token: !!pref?.fcm_token,
      push_platform: pref?.push_platform || null,
      subscription_endpoint: pref?.push_subscription
        ? (() => {
          try {
            const sub = typeof pref.push_subscription === 'string'
              ? JSON.parse(pref.push_subscription)
              : pref.push_subscription;
            return sub?.endpoint ? String(sub.endpoint).slice(0, 60) + '…' : null;
          } catch {
            return 'invalid';
          }
        })()
        : null,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
