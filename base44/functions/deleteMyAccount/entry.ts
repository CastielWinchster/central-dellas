import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Entidades vinculadas ao usuário que devem ser removidas
    const userEntities = [
      'UserProfile',
      'UserPreferences',
      'NotificationSettings',
      'Notification',
      'FavoritePlace',
      'RecentPlace',
      'SavedAddress',
      'FavoriteDriver',
      'EmergencyContact',
      'PaymentMethod',
      'Wallet',
      'WalletTransaction',
      'BlockedUser',
      'DriverRegistration',
      'DriverDocument',
      'DriverPresence',
      'PendingDocumentReview',
      'Subscription',
    ];

    const summary = {};

    for (const entityName of userEntities) {
      try {
        const entity = base44.asServiceRole.entities[entityName];
        if (!entity) continue;
        // Busca registros pelo campo user_id (ou driver_id para presença)
        let records = [];
        try {
          records = await entity.filter({ user_id: userId });
        } catch (_) {
          records = [];
        }
        if ((!records || records.length === 0) && entityName === 'DriverPresence') {
          records = await entity.filter({ driver_id: userId });
        }
        for (const rec of records) {
          await entity.delete(rec.id);
        }
        summary[entityName] = records.length;
      } catch (e) {
        console.error(`Erro ao deletar ${entityName}:`, e.message);
      }
    }

    // A conta de autenticação (entidade User) é gerenciada pela plataforma e não
    // pode ser removida via API. Em vez disso, anonimizamos os dados pessoais e
    // marcamos a conta como excluída para que o login deixe de ser utilizável.
    try {
      await base44.asServiceRole.entities.User.update(userId, {
        full_name: 'Conta excluída',
        photo_url: null,
        phone: null,
        account_deleted: true,
        account_deleted_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Erro ao anonimizar User:', e.message);
      return Response.json({ error: 'Falha ao excluir a conta. Contate o suporte.' }, { status: 500 });
    }

    return Response.json({ success: true, summary });
  } catch (error) {
    console.error('deleteMyAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});