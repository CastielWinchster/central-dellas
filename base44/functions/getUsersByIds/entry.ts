import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { userIds } = await req.json();
    if (!Array.isArray(userIds)) {
      return Response.json({ error: 'userIds deve ser um array' }, { status: 400 });
    }

    const uniqueIds = [...new Set(userIds.filter(Boolean))].slice(0, 500);
    const users: Record<string, { name: string; email?: string | null }> = {};

    await Promise.all(
      uniqueIds.map(async (id: string) => {
        const rows = await base44.asServiceRole.entities.User.filter({ id });
        let u = rows[0];

        if (!u?.full_name) {
          const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: id });
          if (profiles[0]?.full_name && u) {
            u = { ...u, full_name: profiles[0].full_name };
          } else if (profiles[0]?.full_name) {
            u = { full_name: profiles[0].full_name, email: null };
          }
        }

        if (u) {
          users[id] = {
            name: u.full_name || u.email || 'Usuária',
            email: u.email ?? null,
          };
        }
      })
    );

    return Response.json({ users });
  } catch (error) {
    console.error('[getUsersByIds] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
