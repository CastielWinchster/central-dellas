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

    // Obter configurações do WAHA
    const wahaUrl = Deno.env.get('WAHA_URL');
    const wahaSession = Deno.env.get('WAHA_SESSION') || 'default';

    if (!wahaUrl) {
      console.error('WAHA_URL não configurado');
      return Response.json({ 
        sucesso: false, 
        erro: 'Serviço de WhatsApp não configurado. Entre em contato com o suporte.' 
      }, { status: 500 });
    }

    // Enviar mensagem via WAHA
    const wahaResponse = await fetch(`${wahaUrl}/api/sendText`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session: wahaSession,
        chatId: `${numero}@c.us`,
        text: `🚗 *Central Dellas*\n\nSeu código de verificação é:\n\n✅ *${codigo}*\n\n⏰ Válido por 10 minutos\n🔒 Não compartilhe este código!`
      })
    });

    if (!wahaResponse.ok) {
      const errorText = await wahaResponse.text();
      console.error('Erro WAHA:', errorText);
      return Response.json({ 
        sucesso: false, 
        erro: 'Erro ao enviar WhatsApp. Verifique se o número está correto.' 
      }, { status: 500 });
    }

    console.log(`Código enviado para ${numero}: ${codigo}`);

    return Response.json({ 
      sucesso: true, 
      mensagem: '📨 Código enviado! Verifique seu WhatsApp' 
    });

  } catch (error) {
    console.error('Erro ao enviar código WhatsApp:', error);
    return Response.json({ 
      sucesso: false, 
      erro: 'Erro ao processar solicitação: ' + error.message 
    }, { status: 500 });
  }
});

// Exportar para uso em outras funções
export { codigosAtivos };