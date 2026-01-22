import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });
    }

    const { telefone } = await req.json();

    if (!telefone) {
      return Response.json({ sucesso: false, erro: 'Telefone não fornecido' }, { status: 400 });
    }

    // Normalizar
    let numero = telefone.replace(/\D/g, '');
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }

    // Validações
    if (numero.length !== 13) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Telefone deve ter 11 dígitos (com DDD)' 
      });
    }

    // Validar DDD brasileiro (11-99)
    const ddd = parseInt(numero.substring(2, 4));
    if (ddd < 11 || ddd > 99) {
      return Response.json({ 
        sucesso: false, 
        erro: 'DDD inválido. Use um DDD brasileiro válido.' 
      });
    }

    // Validar primeiro dígito (deve ser 9 para celular)
    const primeiroDigito = numero.substring(4, 5);
    if (primeiroDigito !== '9') {
      return Response.json({ 
        sucesso: false, 
        erro: 'Use um número de celular (9xxxx-xxxx)' 
      });
    }

    // ✅ Telefone válido
    return Response.json({ 
      sucesso: true,
      mensagem: '✅ Telefone válido!',
      telefone: numero
    });

  } catch (error) {
    console.error('Erro ao validar telefone:', error);
    return Response.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
});