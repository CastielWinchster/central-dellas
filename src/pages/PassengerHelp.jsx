import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, ChevronLeft, ChevronDown, MessageCircle, 
  Phone, Mail, Shield, CreditCard, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PassengerHelp() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      category: '🚗 Corridas',
      questions: [
        {
          q: 'Como solicitar uma corrida?',
          a: 'Vá em "Chamar Agora", insira origem e destino, escolha o tipo de corrida e confirme.'
        },
        {
          q: 'Posso agendar corridas?',
          a: 'Sim! No momento estamos trabalhando para implementar o agendamento direto no aplicativo, até lá, agendamentos serão feitos por whatsapp.'
        },
        {
          q: 'Como cancelar uma corrida?',
          a: 'Antes da motorista aceitar, cancele direto na tela. Após aceitar, pode haver taxa de cancelamento.'
        }
      ]
    },
    {
      category: '💳 Pagamento',
      questions: [
        {
          q: 'Quais formas de pagamento são aceitas?',
          a: 'Aceitamos Pix, cartão de crédito e débito, e dinheiro físico.'
        },
        {
          q: 'Quando sou cobrada?',
          a: 'O pagamento é processado automaticamente ao final da corrida.'
        }
      ]
    },
    {
      category: '🛡️ Segurança',
      questions: [
        {
          q: 'Como funciona o botão de emergência?',
          a: 'Durante uma corrida, vá para (Configurações -> Emergência) e use o botão vermelho para contatar a CentralDellas imediatamente.'
        },
        {
          q: 'As motoristas são verificadas?',
          a: 'Sim! Todas passam por verificação de CNH, antecedentes e documentos do veículo, sem exceção!'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('PassengerOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Central de Ajuda</h1>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <a href="https://wa.me/5516994465137" target="_blank" rel="noopener noreferrer">
            <Card className="p-4 bg-[#1A1A1A] border-[#F22998]/20 rounded-xl hover:bg-[#F22998]/10 transition-all cursor-pointer">
              <MessageCircle className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-sm font-medium text-[#F2F2F2]">WhatsApp</p>
              <p className="text-xs text-[#F2F2F2]/50">Chat ao vivo</p>
            </Card>
          </a>
          
          <a href="tel:+5516994465137">
            <Card className="p-4 bg-[#1A1A1A] border-[#F22998]/20 rounded-xl hover:bg-[#F22998]/10 transition-all cursor-pointer">
              <Phone className="w-8 h-8 text-[#F22998] mb-2" />
              <p className="text-sm font-medium text-[#F2F2F2]">Telefone</p>
              <p className="text-xs text-[#F2F2F2]/50">24h</p>
            </Card>
          </a>
          
          <a href="mailto:contato@centraldellas.com.br">
            <Card className="p-4 bg-[#1A1A1A] border-[#F22998]/20 rounded-xl hover:bg-[#F22998]/10 transition-all cursor-pointer">
              <Mail className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-sm font-medium text-[#F2F2F2]">E-mail</p>
              <p className="text-xs text-[#F2F2F2]/50">Suporte</p>
            </Card>
          </a>
        </div>

        {/* FAQs */}
        <div className="space-y-6">
          {faqs.map((category, catIndex) => (
            <div key={catIndex}>
              <h3 className="text-xs font-bold text-[#BF3B79] mb-3 uppercase tracking-wider px-2">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.questions.map((faq, index) => {
                  const faqId = `${catIndex}-${index}`;
                  const isExpanded = expandedFaq === faqId;
                  
                  return (
                    <Card key={faqId} className="bg-[#1A1A1A] border-[#F22998]/20 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : faqId)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F22998]/5 transition-colors"
                      >
                        <p className="font-medium text-[#F2F2F2] pr-4">{faq.q}</p>
                        <ChevronDown className={`w-5 h-5 text-[#F22998] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4"
                        >
                          <p className="text-sm text-[#F2F2F2]/70 leading-relaxed">{faq.a}</p>
                        </motion.div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <Card className="p-6 bg-gradient-to-br from-[#BF3B79]/10 to-[#F22998]/10 border-[#F22998]/20 rounded-2xl mt-8">
          <h3 className="font-semibold text-[#F2F2F2] mb-4">Ainda precisa de ajuda?</h3>
          <div className="space-y-2 text-sm text-[#F2F2F2]/70">
            <p>📱 WhatsApp: (16) 99446-5137</p>
            <p>📧 E-mail: contato@centraldellas.com.br</p>
            <p>🕐 Horário: 24h por dia, 7 dias por semana</p>
          </div>
        </Card>
      </div>
    </div>
  );
}