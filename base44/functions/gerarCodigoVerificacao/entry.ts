import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Rate-limit simples: validar que o payload é bem-formado antes de qualquer operação
    const body = await req.json();
    const { telefone } = body;

    if (!telefone) {
      return Response.json({ sucesso: false, erro: 'Telefone não fornecido' }, { status: 400 });
    }

    // Proteção contra abuso: verificar se já existe código recente (< 1 min) para este número
    let numeroTemp = telefone.replace(/\D/g, '');
    if (!numeroTemp.startsWith('55')) numeroTemp = '55' + numeroTemp;
    const recentes = await base44.asServiceRole.entities.VerificationCode.filter({ telefone: numeroTemp, validado: false });
    if (recentes.length > 0) {
      const ultimo = recentes[0];
      const criado = new Date(ultimo.created_date);
      if ((Date.now() - criado.getTime()) < 60 * 1000) {
        return Response.json({ sucesso: false, erro: 'Aguarde 1 minuto antes de solicitar novo código.' }, { status: 429 });
      }
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
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Deletar códigos antigos deste telefone
    const codigosAntigos = await base44.asServiceRole.entities.VerificationCode.filter({ telefone: numero });
    for (const old of codigosAntigos) {
      await base44.asServiceRole.entities.VerificationCode.delete(old.id);
    }

    // Salvar no banco de dados
    await base44.asServiceRole.entities.VerificationCode.create({
      telefone: numero,
      codigo: codigo,
      expira_em: expiraEm,
      tentativas: 0,
      validado: false
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