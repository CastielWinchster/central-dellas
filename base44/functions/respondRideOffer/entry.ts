import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED = new Set(['seen', 'rejected', 'expired']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const driver = await base44.auth.me();
    if (!driver) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { offerId, status } = await req.json();
    if (!offerId || !ALLOWED.has(status)) {
      return Response.json({ error: 'offerId e status válido são obrigatórios' }, { status: 400 });
    }

    const offers = await base44.asServiceRole.entities.RideOffer.filter({ id: offerId });
    const offer = offers[0];
    if (!offer) return Response.json({ error: 'Oferta não encontrada' }, { status: 404 });
    if (String(offer.driver_id) !== String(driver.id)) {
      return Response.json({ error: 'Oferta não pertence a esta motorista' }, { status: 403 });
    }

    if (!['sent', 'seen'].includes(String(offer.status))) {
      return Response.json({ error: 'Oferta não pode ser alterada', status: offer.status }, { status: 409 });
    }

    await base44.asServiceRole.entities.RideOffer.update(String(offer.id), {
      status,
      ...(status !== 'seen' ? { responded_at: new Date().toISOString() } : {}),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[respondRideOffer]', (error as Error).message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
