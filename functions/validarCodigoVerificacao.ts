import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Normalizar telefone
    let numero = telefone.replace(/\D/g, '');
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }

    // Buscar código no banco de dados
    const codigos = await base44.asServiceRole.entities.VerificationCode.filter({ 
      telefone: numero,
      validado: false
    });

    if (codigos.length === 0) {
      return Response.json({ 
        sucesso: false, 
        erro: '❌ Código não encontrado. Solicite um novo código.' 
      });
    }

    const dados = codigos[0];

    // Validação 2: Código expirou?
    if (new Date(dados.expira_em) < new Date()) {
      await base44.asServiceRole.entities.VerificationCode.delete(dados.id);
      return Response.json({ 
        sucesso: false, 
        erro: '⏰ Código expirou (10 minutos). Solicite um novo código.' 
      });
    }

    // Validação 3: Máximo de tentativas?
    if (dados.tentativas >= 3) {
      await base44.asServiceRole.entities.VerificationCode.delete(dados.id);
      return Response.json({ 
        sucesso: false, 
        erro: '🔒 Máximo de tentativas excedido. Solicite um novo código.' 
      });
    }

    // Validação 4: Código correto?
    if (dados.codigo !== codigo.trim()) {
      await base44.asServiceRole.entities.VerificationCode.update(dados.id, {
        tentativas: dados.tentativas + 1
      });
      
      const restantes = 3 - (dados.tentativas + 1);
      return Response.json({ 
        sucesso: false, 
        erro: `❌ Código incorreto. ${restantes} tentativa(s) restante(s).` 
      });
    }

    // SUCESSO: Código correto!
    await base44.asServiceRole.entities.VerificationCode.update(dados.id, {
      validado: true
    });

    console.log(`✅ Código verificado com sucesso para ${numero}`);

    return Response.json({ 
      sucesso: true,
      mensagem: '✅ Telefone verificado com sucesso!',
      telefoneVerificado: true
    });

  } catch (error) {
    console.error('❌ Erro ao validar:', error);
    return Response.json({ 
      sucesso: false, 
      erro: 'Erro ao validar código. Tente novamente.' 
    }, { status: 500 });
  }
});