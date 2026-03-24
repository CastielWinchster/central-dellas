import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verificar autenticação - evita harvesting de usernames
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await req.json();

    if (!username) {
      return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    // Validar formato do username
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
    if (!usernameRegex.test(username) || username.length < 3 || username.length > 20) {
      return Response.json({ 
        available: false, 
        valid: false,
        message: 'Username inválido' 
      });
    }

    // Verificar se username já existe (assumindo que User tem campo username)
    const users = await base44.asServiceRole.entities.User.filter({ username });
    
    return Response.json({ 
      available: users.length === 0,
      valid: true
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    return Response.json({ 
      error: error.message,
      available: true // Em caso de erro, assumir disponível
    }, { status: 500 });
  }
});