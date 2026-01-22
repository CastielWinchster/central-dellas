import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { codigosAtivos } from './gerarCodigoVerificacao.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ sucesso: false, erro: 'Não autorizado' }, { status: 401 });
    }

    const { telefone, codigo } = await req.json();

    if (!telefone || !codigo) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Telefone e código obrigatórios' 
      }, { status: 400 });
    }

    // Normalizar
    let numero = telefone.replace(/\D/g, '');
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }

    const dados = codigosAtivos.get(numero);

    // Validações
    if (!dados) {
      return Response.json({ sucesso: false, erro: 'Código não encontrado' });
    }

    if (Date.now() > dados.expira) {
      codigosAtivos.delete(numero);
      return Response.json({ sucesso: false, erro: 'Código expirou (10 minutos)' });
    }

    if (dados.tentativas >= 3) {
      codigosAtivos.delete(numero);
      return Response.json({ sucesso: false, erro: 'Máximo de tentativas excedido' });
    }

    if (dados.codigo !== codigo.trim()) {
      dados.tentativas++;
      const restantes = 3 - dados.tentativas;
      return Response.json({ 
        sucesso: false, 
        erro: `Código incorreto. ${restantes} tentativa(s) restante(s)` 
      });
    }

    // ✅ SUCESSO
    codigosAtivos.delete(numero);

    return Response.json({ 
      sucesso: true,
      mensagem: '✅ Telefone verificado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return Response.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
});