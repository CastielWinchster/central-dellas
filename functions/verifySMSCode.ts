import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { codigosAtivos } from './sendSMSCode.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { telefone, codigo } = await req.json();

    if (!telefone || !codigo) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Telefone e código são obrigatórios' 
      }, { status: 400 });
    }

    // Normalizar telefone
    let numero = telefone.replace(/\D/g, '');
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
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