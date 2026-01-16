import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validar formato do email
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return Response.json({ 
        exists: false, 
        valid: false,
        message: 'Email inválido' 
      });
    }

    // Verificar se email já existe (buscar na entidade User)
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    return Response.json({ 
      exists: users.length > 0,
      valid: true
    });
  } catch (error) {
    console.error('Error checking email availability:', error);
    return Response.json({ 
      error: error.message,
      exists: false 
    }, { status: 500 });
  }
});