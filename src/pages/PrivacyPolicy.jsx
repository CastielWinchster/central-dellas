import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F2F2F2] pb-16">
      {/* Header */}
      <div className="bg-[#0D0D0D] border-b border-[#F472B6]/20 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ea008a15739746d55f4e/50cfce50f_central2.png"
            alt="CentralDellas"
            className="h-10 w-auto"
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[#F472B6] mb-2">Política de Privacidade</h1>
        <p className="text-[#F2F2F2]/50 text-sm mb-8">Última atualização: Maio de 2026</p>

        <div className="space-y-8 text-[#F2F2F2]/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">1. Quem somos</h2>
            <p>
              O <strong className="text-[#F472B6]">CentralDellas</strong> é um aplicativo de transporte por aplicativo que conecta passageiros e motoristas de forma segura. Nossa sede está localizada em Orlândia, SP, Brasil. Este documento descreve como coletamos, usamos e protegemos seus dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">2. Dados que coletamos</h2>
            <p className="mb-3">Ao usar o CentralDellas, podemos coletar os seguintes dados:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong>Nome completo</strong> — para identificação no app e exibição para motoristas/passageiros.</li>
              <li><strong>Endereço de e-mail</strong> — para login, comunicação e recuperação de conta.</li>
              <li><strong>Número de telefone</strong> — para contato durante corridas e verificação de identidade.</li>
              <li><strong>Localização GPS em tempo real</strong> — para localizar o ponto de partida, exibir motoristas próximos e rastrear corridas ativas.</li>
              <li><strong>Histórico de corridas</strong> — origem, destino, horário, valor e avaliações de cada corrida.</li>
              <li><strong>Foto de perfil</strong> — enviada voluntariamente pelo usuário.</li>
              <li><strong>Dados de pagamento</strong> — método de pagamento escolhido (não armazenamos dados de cartão diretamente).</li>
              <li><strong>Documentos de motorista</strong> — CNH, CRLV, RG e selfie para verificação de identidade (apenas para motoristas).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">3. Por que coletamos seus dados</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Conectar passageiros e motoristas de forma eficiente e segura.</li>
              <li>Calcular rotas, distâncias e tarifas das corridas.</li>
              <li>Processar e registrar pagamentos.</li>
              <li>Verificar a identidade de motoristas para garantir a segurança de todos.</li>
              <li>Enviar notificações sobre o status da corrida.</li>
              <li>Melhorar continuamente nossos serviços com base no uso.</li>
              <li>Cumprir obrigações legais aplicáveis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">4. Uso da localização GPS</h2>
            <p>
              A localização GPS é coletada <strong>apenas durante corridas ativas</strong> ou enquanto o motorista está disponível no app. Utilizamos a localização para:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 mt-3">
              <li>Exibir motoristas próximos ao passageiro.</li>
              <li>Calcular o trajeto e tempo estimado de chegada.</li>
              <li>Compartilhar a posição em tempo real durante a corrida (recurso de segurança).</li>
            </ul>
            <p className="mt-3">
              Quando o app está fechado ou em segundo plano sem corrida ativa, a localização <strong>não é coletada</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">5. Compartilhamento de dados</h2>
            <p className="mb-3">
              <strong>Não vendemos seus dados pessoais a terceiros.</strong> Compartilhamos informações apenas nas seguintes situações:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong>Entre passageiro e motorista</strong> — nome, foto e avaliação são exibidos mutuamente durante a corrida.</li>
              <li><strong>Processadores de pagamento</strong> — para processar transações financeiras com segurança.</li>
              <li><strong>Autoridades legais</strong> — apenas quando exigido por lei ou ordem judicial.</li>
              <li><strong>Provedores de infraestrutura</strong> — serviços de hospedagem e banco de dados que operam sob contratos de confidencialidade.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">6. Segurança dos dados</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito (HTTPS), controle de acesso e armazenamento seguro. Nenhum sistema é 100% infalível, mas nos comprometemos a notificá-lo em caso de incidente de segurança que afete seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">7. Retenção de dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta, os dados são anonimizados ou excluídos em até 30 dias, exceto quando a retenção for obrigatória por lei (ex: registros fiscais).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">8. Seus direitos (LGPD)</h2>
            <p className="mb-3">Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018), você tem direito a:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong>Acesso</strong> — solicitar uma cópia dos dados que temos sobre você.</li>
              <li><strong>Correção</strong> — corrigir dados incorretos ou desatualizados.</li>
              <li><strong>Exclusão</strong> — solicitar a exclusão dos seus dados pessoais.</li>
              <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado.</li>
              <li><strong>Revogação do consentimento</strong> — retirar o consentimento a qualquer momento.</li>
            </ul>
            <p className="mt-3">Para exercer esses direitos, entre em contato pelo e-mail abaixo.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">9. Cookies e tecnologias similares</h2>
            <p>
              Utilizamos tecnologias de armazenamento local (localStorage) para manter sua sessão ativa e preferências do app. Não utilizamos cookies de rastreamento de terceiros para fins publicitários.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">10. Contato</h2>
            <p>Para dúvidas, solicitações ou exercício dos seus direitos de privacidade, entre em contato:</p>
            <div className="mt-3 p-4 rounded-xl bg-[#F472B6]/10 border border-[#F472B6]/20">
              <p><strong>CentralDellas</strong></p>
              <p>E-mail: <a href="mailto:privacidade@centraldellas.com.br" className="text-[#F472B6] hover:underline">privacidade@centraldellas.com.br</a></p>
              <p>Orlândia, SP — Brasil</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}