import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F2F2F2] pb-16">
      {/* Header */}
      <div className="bg-[#0D0D0D] border-b border-[#F22998]/20 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ea008a15739746d55f4e/50cfce50f_central2.png"
            alt="CentralDellas"
            className="h-10 w-auto"
          />
          <Link to="/" className="text-sm text-[#F22998] hover:underline">Voltar ao app</Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[#F22998] mb-2">Termos de Serviço</h1>
        <p className="text-[#F2F2F2]/50 text-sm mb-8">Última atualização: maio de 2025</p>

        <div className="space-y-8 text-[#F2F2F2]/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">1. O que é o CentralDellas</h2>
            <p>
              O <strong className="text-[#F22998]">CentralDellas</strong> é uma plataforma de transporte por aplicativo que conecta passageiros a motoristas parceiros. O app facilita a solicitação e gestão de corridas urbanas, intermunicipais e entregas na região de Orlândia, SP e cidades vizinhas.
            </p>
            <p className="mt-3">
              O CentralDellas <strong>não é uma empresa de transporte</strong> — atuamos como intermediário tecnológico entre passageiros e motoristas independentes. A relação contratual de transporte se estabelece diretamente entre passageiro e motorista.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">2. Aceitação dos termos</h2>
            <p>
              Ao criar uma conta ou utilizar o CentralDellas, você declara que leu, entendeu e concorda com estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não utilize o aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">3. Responsabilidades do passageiro</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Fornecer informações precisas de localização (origem e destino).</li>
              <li>Estar disponível no local de embarque no horário combinado.</li>
              <li>Tratar o motorista com respeito e cordialidade.</li>
              <li>Não solicitar paradas não combinadas sem aviso prévio.</li>
              <li>Efetuar o pagamento pelo método escolhido no app.</li>
              <li>Não fumar, consumir bebidas alcoólicas ou substâncias ilícitas durante a corrida.</li>
              <li>Informar corretamente se estará acompanhado de pets ao solicitar a corrida.</li>
              <li>Reportar qualquer problema ou comportamento inadequado à equipe CentralDellas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">4. Responsabilidades do motorista</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Possuir CNH válida e veículo regularizado (CRLV em dia).</li>
              <li>Manter o veículo em condições adequadas de segurança e higiene.</li>
              <li>Cumprir o trajeto combinado ou comunicar desvios ao passageiro.</li>
              <li>Tratar passageiros com respeito e profissionalismo.</li>
              <li>Não dirigir sob efeito de álcool ou substâncias que afetem a capacidade de direção.</li>
              <li>Manter seus dados cadastrais atualizados no app.</li>
              <li>Repassar a comissão devida ao CentralDellas conforme acordo vigente.</li>
              <li>Reportar incidentes à equipe CentralDellas imediatamente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">5. Política de cancelamento</h2>
            <p className="mb-3">As seguintes regras se aplicam ao cancelamento de corridas:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong>Cancelamento pelo passageiro antes da aceitação:</strong> Sem custo.</li>
              <li><strong>Cancelamento pelo passageiro após a aceitação:</strong> Pode incorrer em taxa de cancelamento a critério do CentralDellas.</li>
              <li><strong>Cancelamento pelo motorista:</strong> O passageiro será notificado e uma nova busca será iniciada automaticamente.</li>
              <li><strong>Não comparecimento do passageiro:</strong> Após 5 minutos de espera no local combinado, o motorista pode cancelar sem penalidade.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">6. Pagamentos e tarifas</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>As tarifas são calculadas com base na distância, tipo de corrida e condições de demanda.</li>
              <li>O valor estimado exibido antes da confirmação pode variar em situações excepcionais (trânsito, desvios de rota).</li>
              <li>Os métodos de pagamento aceitos são: Pix, dinheiro e cartão de crédito/débito.</li>
              <li>Corridas acima de 35 km podem exigir negociação prévia de valor entre passageiro e central.</li>
              <li>Cupons de desconto são válidos conforme as condições específicas de cada promoção.</li>
              <li>O CentralDellas retém uma comissão sobre cada corrida realizada pelos motoristas parceiros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">7. Conduta esperada e comportamento proibido</h2>
            <p className="mb-3">É <strong>estritamente proibido</strong> no uso do CentralDellas:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Qualquer forma de assédio, discriminação ou violência verbal ou física.</li>
              <li>Uso do app para fins ilegais.</li>
              <li>Fornecimento de informações falsas no cadastro.</li>
              <li>Criação de múltiplas contas para burlar promoções ou políticas.</li>
              <li>Ameaças ou comportamento intimidador a outros usuários.</li>
              <li>Compartilhar dados de outros usuários sem consentimento.</li>
            </ul>
            <p className="mt-3">
              Violações podem resultar em suspensão ou exclusão permanente da conta, sem reembolso de saldo ou créditos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">8. Limitação de responsabilidade</h2>
            <p className="mb-3">O CentralDellas <strong>não se responsabiliza</strong> por:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Acidentes, danos ou perdas ocorridos durante a corrida (responsabilidade do motorista parceiro).</li>
              <li>Atrasos causados por condições de trânsito, clima ou fatores externos.</li>
              <li>Objetos esquecidos no veículo.</li>
              <li>Falhas temporárias no aplicativo por manutenção ou problemas técnicos.</li>
              <li>Ações ou omissões de motoristas parceiros que sejam prestadores autônomos.</li>
            </ul>
            <p className="mt-3">
              Recomendamos que motoristas parceiros mantenham seguro veicular adequado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">9. Alterações nos termos</h2>
            <p>
              O CentralDellas pode atualizar estes Termos de Serviço a qualquer momento. Alterações significativas serão notificadas pelo app ou por e-mail com antecedência mínima de 7 dias. O uso continuado do app após as mudanças constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">10. Lei aplicável</h2>
            <p>
              Estes termos são regidos pela legislação brasileira. Eventuais disputas serão submetidas ao foro da comarca de Orlândia, SP, salvo disposição legal em contrário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#F2F2F2] mb-3">11. Contato</h2>
            <p>Para dúvidas, sugestões ou reclamações sobre estes termos:</p>
            <div className="mt-3 p-4 rounded-xl bg-[#F22998]/10 border border-[#F22998]/20">
              <p><strong>CentralDellas</strong></p>
              <p>E-mail: <a href="mailto:contato@centraldellas.com.br" className="text-[#F22998] hover:underline">contato@centraldellas.com.br</a></p>
              <p>Orlândia, SP — Brasil</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}