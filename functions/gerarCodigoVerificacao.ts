import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Armazenamento simples (Map em memória)
const codigosAtivos = new Map();

// Limpar códigos expirados a cada minuto
setInterval(() => {
  const agora = Date.now();
  for (const [numero, dados] of codigosAtivos.entries()) {
    if (agora > dados.expira) {
      codigosAtivos.delete(numero);
    }
  }
}, 60000);

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
      }, { status: 400 });
    }

    // Gerar código
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = Date.now() + 10 * 60 * 1000; // 10 minutos

    // Armazenar
    codigosAtivos.set(numero, {
      codigo,
      expira,
      tentativas: 0
    });

    console.log(`✅ Código gerado para ${numero}: ${codigo}`);

    return Response.json({ 
      sucesso: true,
      codigo: codigo,
      mensagem: `✅ Código gerado: ${codigo}`
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
});

// Exportar para usar na outra função
export { codigosAtivos };