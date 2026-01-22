import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { codigosAtivos } from './sendSMSCode.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { telefone } = await req.json();

    if (!telefone) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Telefone não fornecido' 
      }, { status: 400 });
    }

    // Normalizar telefone
    let numero = telefone.replace(/\D/g, '');
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }

    // Buscar código para o telefone
    const dadosCodigo = codigosAtivos.get(numero);

    if (!dadosCodigo) {
      return Response.json({ 
        sucesso: false, 
        erro: 'Nenhum código encontrado. Solicite um novo código primeiro.' 
      });
    }

    // Verificar se expirou
    if (Date.now() > dadosCodigo.expira) {
      codigosAtivos.delete(numero);
      return Response.json({ 
        sucesso: false, 
        erro: 'Código expirado. Solicite um novo código.' 
      });
    }

    // Retornar o código
    const minutosRestantes = Math.ceil((dadosCodigo.expira - Date.now()) / 60000);
    
    return Response.json({ 
      sucesso: true, 
      codigo: dadosCodigo.codigo,
      expiraEm: minutosRestantes
    });

  } catch (error) {
    console.error('Erro ao buscar código:', error);
    return Response.json({ 
      sucesso: false, 
      erro: 'Erro ao buscar código: ' + error.message 
    }, { status: 500 });
  }
});