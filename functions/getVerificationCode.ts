import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { telefone } = await req.json();

    if (!telefone) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Telefone não fornecido' 
      }, { status: 400 });
    }

    // Normalizar telefone
    let numero = telefone.replace(/\D/g, '');
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }

    // Buscar código via função interna
    const response = await base44.asServiceRole.functions.invoke('sendSMSCode', { 
      telefone: numero,
      action: 'get' 
    });

    if (!response.data.sucesso) {
      return Response.json(response.data);
    }

    return Response.json(response.data);

  } catch (error) {
    console.error('Erro ao buscar código:', error);
    return Response.json({ 
      sucesso: false, 
      erro: 'Erro ao buscar código: ' + error.message 
    }, { status: 500 });
  }
});