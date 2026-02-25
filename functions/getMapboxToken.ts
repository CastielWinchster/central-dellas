import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    
    if (!token) {
      console.error('MAPBOX_ACCESS_TOKEN not configured');
      return Response.json({ error: 'Mapbox token not configured' }, { status: 500 });
    }

    return Response.json({ token });
  } catch (error) {
    console.error('Error getting Mapbox token:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});