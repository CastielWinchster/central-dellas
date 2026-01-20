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

    // Obter credenciais Twilio
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioPhone) {
      console.error('Credenciais Twilio não configuradas');
      return Response.json({ 
        sucesso: false, 
        erro: 'Serviço de SMS não configurado. Entre em contato com o suporte.' 
      }, { status: 500 });
    }

    // Enviar SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const formData = new URLSearchParams();
    formData.append('From', twilioPhone);
    formData.append('To', `+${numero}`);
    formData.append('Body', `Central Dellas - Seu código de verificação: ${codigo}. Válido por 10 minutos.`);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Erro Twilio:', errorText);
      return Response.json({ 
        sucesso: false, 
        erro: 'Erro ao enviar SMS. Verifique se o número está correto.' 
      }, { status: 500 });
    }

    console.log(`Código enviado para ${numero}: ${codigo}`);

    return Response.json({ 
      sucesso: true, 
      mensagem: '📨 Código enviado! Verifique suas mensagens SMS' 
    });

  } catch (error) {
    console.error('Erro ao enviar código SMS:', error);
    return Response.json({ 
      sucesso: false, 
      erro: 'Erro ao processar solicitação: ' + error.message 
    }, { status: 500 });
  }
});

// Exportar para uso em outras funções
export { codigosAtivos };