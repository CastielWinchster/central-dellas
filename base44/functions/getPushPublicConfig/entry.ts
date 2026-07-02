import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/** Retorna chaves PÚBLICAS de push — seguro expor (privadas ficam só no backend). */
Deno.serve(async (_req) => {
  try {
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const firebaseVapid = Deno.env.get('VITE_FIREBASE_VAPID_KEY')
      ?? Deno.env.get('FIREBASE_VAPID_KEY')
      ?? vapidPublic;

    return Response.json({
      success: true,
      vapidPublicKey: vapidPublic || null,
      firebaseVapidKey: firebaseVapid || null,
      configured: !!(vapidPublic),
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
