import React from 'react';
import { Trash2, Mail, ShieldCheck, Clock, Database } from 'lucide-react';

const SUPPORT_EMAIL = 'suporte@centraldellas.com.br';
const WHATSAPP_NUMBER = '5516994465137'; // ajustar se necessário

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F2F2F2] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Exclusão de Conta</h1>
        </div>
        <p className="text-[#F2F2F2]/60 mb-8">
          Central Dellas — Mobilidade entre mulheres
        </p>

        {/* Intro */}
        <div className="bg-[#1a1a1a] border border-[#F22998]/20 rounded-2xl p-6 mb-6">
          <p className="text-[#F2F2F2]/80 leading-relaxed">
            Esta página explica como você pode solicitar a exclusão da sua conta do
            aplicativo <strong>Central Dellas</strong> e de todos os dados associados a ela.
            A solicitação pode ser feita diretamente dentro do app ou por e-mail, conforme
            descrito abaixo.
          </p>
        </div>

        {/* Como solicitar */}
        <div className="bg-[#1a1a1a] border border-[#F22998]/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-[#F22998]" />
            <h2 className="text-xl font-semibold">Como solicitar a exclusão</h2>
          </div>

          <h3 className="font-medium text-[#F22998] mb-2">Opção 1 — Pelo aplicativo</h3>
          <ol className="list-decimal list-inside space-y-2 text-[#F2F2F2]/80 mb-6">
            <li>Abra o aplicativo Central Dellas e faça login na sua conta.</li>
            <li>Acesse <strong>Opções → Configurações</strong>.</li>
            <li>Toque em <strong>"Excluir minha conta"</strong>.</li>
            <li>Confirme a solicitação. Sua conta e seus dados serão removidos.</li>
          </ol>

          <h3 className="font-medium text-[#F22998] mb-2">Opção 2 — Por e-mail</h3>
          <p className="text-[#F2F2F2]/80 mb-3">
            Caso não consiga acessar o app, envie um e-mail solicitando a exclusão.
            Inclua o e-mail ou telefone cadastrado na conta para que possamos localizá-la.
          </p>
          <div className="space-y-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Solicitação de exclusão de conta - Central Dellas`}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#BF3B79] to-[#F22998] text-white font-medium hover:opacity-90 transition"
            >
              <Mail className="w-4 h-4" />
              {SUPPORT_EMAIL}
            </a>
            <p className="text-sm text-[#F2F2F2]/50">
              Também é possível solicitar pelo WhatsApp de suporte da Central Dellas.
            </p>
          </div>
        </div>

        {/* Dados excluídos */}
        <div className="bg-[#1a1a1a] border border-[#F22998]/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-[#F22998]" />
            <h2 className="text-xl font-semibold">Quais dados são excluídos</h2>
          </div>
          <p className="text-[#F2F2F2]/80 mb-3">
            Ao concluir a exclusão, removemos permanentemente os seguintes dados associados
            à sua conta:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#F2F2F2]/80">
            <li>Dados de perfil (nome, e-mail, telefone e foto).</li>
            <li>Endereços e locais favoritos salvos.</li>
            <li>Métodos de pagamento e dados da carteira.</li>
            <li>Histórico de mensagens e conversas.</li>
            <li>Contatos de emergência e preferências.</li>
            <li>Documentos enviados (no caso de motoristas).</li>
          </ul>
        </div>

        {/* Dados mantidos */}
        <div className="bg-[#1a1a1a] border border-[#F22998]/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#F22998]" />
            <h2 className="text-xl font-semibold">Dados mantidos e prazos</h2>
          </div>
          <p className="text-[#F2F2F2]/80 mb-3">
            Alguns registros podem ser mantidos por período adicional para cumprir
            obrigações legais, fiscais e de segurança:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#F2F2F2]/80">
            <li>
              <strong>Registros de corridas/entregas e transações financeiras</strong> podem
              ser retidos por até 5 anos, conforme exigências fiscais e legais, de forma
              anonimizada sempre que possível.
            </li>
            <li>
              A solicitação de exclusão é processada em até <strong>30 dias</strong>.
            </li>
          </ul>
        </div>

        <p className="text-center text-sm text-[#F2F2F2]/40 mt-8">
          Central Dellas © {new Date().getFullYear()} — Em caso de dúvidas, entre em contato
          pelo e-mail {SUPPORT_EMAIL}.
        </p>
      </div>
    </div>
  );
}