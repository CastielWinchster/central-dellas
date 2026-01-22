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

    // Normalizar telefone
    let numero = telefone.replace(/\D/g, '');
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }

    if (numero.length !== 13) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Telefone inválido (11 dígitos)' 
      });
    }

    // Gerar código
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = Date.now() + 10 * 60 * 1000;

    // CHAVE: Usar globalThis para armazenamento compartilhado
    if (!globalThis.codigosAtivos) {
      globalThis.codigosAtivos = new Map();
    }

    // Salvar código no Map GLOBAL
    globalThis.codigosAtivos.set(numero, {
      codigo: codigo,
      expira: expira,
      tentativas: 0,
      telefone: numero
    });

    console.log(`✅ Código gerado para ${numero}: ${codigo}`);

    return Response.json({ 
      sucesso: true,
      codigo: codigo,
      mensagem: `✅ Código gerado: ${codigo}. Válido por 10 minutos.`
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
});