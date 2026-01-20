import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Map compartilhado para armazenar códigos temporariamente
const codigosAtivos = new Map();

// Limpar códigos expirados periodicamente
setInterval(() => {
  const agora = Date.now();
  for (const [numero, dados] of codigosAtivos.entries()) {
    if (agora > dados.expira) {
      codigosAtivos.delete(numero);
    }
  }
}, 60000); // Verifica a cada minuto

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { telefone, codigo, action } = body;

    if (!telefone) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Telefone é obrigatório' 
      }, { status: 400 });
    }

    // Normalizar telefone
    let numero = telefone.replace(/\D/g, '');
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }

    // Se for para armazenar código (chamado por sendSMSCode)
    if (action === 'store') {
      codigosAtivos.set(numero, {
        codigo: body.codigoGerado,
        expira: Date.now() + 5 * 60 * 1000, // 5 minutos
        tentativas: 0
      });
      return Response.json({ sucesso: true });
    }

    // Se for para verificar código
    if (!codigo) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Código é obrigatório' 
      }, { status: 400 });
    }

    // Buscar código armazenado
    const dadosCodigo = codigosAtivos.get(numero);

    if (!dadosCodigo) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Código não encontrado. Solicite um novo código.' 
      });
    }

    // Verificar expiração
    if (Date.now() > dadosCodigo.expira) {
      codigosAtivos.delete(numero);
      return Response.json({ 
        sucesso: false, 
        erro: 'Código expirado. Solicite um novo código.' 
      });
    }

    // Verificar tentativas
    if (dadosCodigo.tentativas >= 3) {
      codigosAtivos.delete(numero);
      return Response.json({ 
        sucesso: false, 
        erro: 'Máximo de tentativas excedido. Solicite um novo código.' 
      });
    }

    // Verificar código
    if (dadosCodigo.codigo !== codigo.trim()) {
      dadosCodigo.tentativas++;
      const tentativasRestantes = 3 - dadosCodigo.tentativas;
      return Response.json({ 
        sucesso: false, 
        erro: `Código incorreto. ${tentativasRestantes} tentativa${tentativasRestantes !== 1 ? 's' : ''} restante${tentativasRestantes !== 1 ? 's' : ''}.` 
      });
    }

    // Código correto - remover da memória
    codigosAtivos.delete(numero);

    console.log(`Código verificado com sucesso para ${numero}`);

    return Response.json({ 
      sucesso: true, 
      mensagem: '✅ Telefone verificado com sucesso!' 
    });

  } catch (error) {
    console.error('Erro ao verificar código SMS:', error);
    return Response.json({ 
      sucesso: false, 
      erro: 'Erro ao verificar código: ' + error.message 
    }, { status: 500 });
  }
});