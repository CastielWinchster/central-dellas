import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Armazenamento temporário de códigos (em produção, usar Redis ou banco de dados)
const codigosAtivos = new Map();

// Limpar códigos expirados periodicamente
setInterval(() => {
  const agora = Date.now();
  for (const [telefone, dados] of codigosAtivos.entries()) {
    if (agora > dados.expira) {
      codigosAtivos.delete(telefone);
    }
  }
}, 60000); // Limpar a cada minuto

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { telefone } = await req.json();

    if (!telefone) {
      return Response.json({ error: 'Telefone não fornecido' }, { status: 400 });
    }

    // Normalizar telefone
    let numero = telefone.replace(/\D/g, '');
    
    // Adicionar código do país se não tiver
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }

    // Validar formato brasileiro (55 + DDD + número)
    if (numero.length !== 13) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Telefone inválido. Use formato: (11) 99999-9999' 
      }, { status: 400 });
    }

    // Gerar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Salvar código com expiração de 10 minutos
    const expira = Date.now() + 10 * 60 * 1000;
    codigosAtivos.set(numero, {
      codigo,
      expira,
      tentativas: 0
    });

    console.log(`Código gerado para ${numero}: ${codigo}`);

    return Response.json({ 
      sucesso: true, 
      mensagem: '✅ Código gerado! Converse com a Délia no chat para recebê-lo' 
    });

  } catch (error) {
    console.error('Erro ao enviar código SMS:', error);
    return Response.json({ 
      sucesso: false, 
      erro: 'Erro ao processar solicitação: ' + error.message 
    }, { status: 500 });
  }
});

// Exportar para uso em verifySMSCode
export { codigosAtivos };