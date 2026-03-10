import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, FileText, Car, Shield, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const documents = [
  {
    icon: CreditCard,
    title: 'CNH',
    description: 'Carteira Nacional de Habilitação',
    detail: 'Frente e verso, válida e legível',
    status: 'pending'
  },
  {
    icon: FileText,
    title: 'RG ou CPF',
    description: 'Documento de identidade',
    detail: 'Frente e verso, sem rasuras',
    status: 'pending'
  },
  {
    icon: Car,
    title: 'CRLV',
    description: 'Certificado de Registro e Licenciamento do Veículo',
    detail: 'Documento atualizado do veículo',
    status: 'pending'
  },
  {
    icon: Shield,
    title: 'Seguro do Veículo',
    description: 'Apólice de seguro vigente',
    detail: 'Com cobertura para passageiros',
    status: 'pending'
  }
];

export default function DriverDocuments() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('DriverOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2] hover:bg-[#F22998]/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#F2F2F2]">Documentos do Motorista</h1>
            <p className="text-[#F2F2F2]/50 text-sm">CNH, RG, CRLV e Seguro</p>
          </div>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl bg-[#F22998]/10 border border-[#F22998]/30 flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-[#F22998] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#F2F2F2]/80 leading-relaxed">
            Seus documentos serão analisados pela nossa equipe para validar o seu cadastro como motorista.
            Após a aprovação, você poderá começar a receber corridas pela Central Dellas.
          </p>
        </motion.div>

        {/* Document Cards */}
        <div className="space-y-4">
          {documents.map((doc, index) => (
            <motion.div
              key={doc.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#BF3B79]/30 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F22998]/15 flex items-center justify-center flex-shrink-0">
                <doc.icon className="w-6 h-6 text-[#F22998]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#F2F2F2]">{doc.title}</p>
                <p className="text-sm text-[#F2F2F2]/60">{doc.description}</p>
                <p className="text-xs text-[#F2F2F2]/40 mt-0.5">{doc.detail}</p>
              </div>
              <span className="text-xs text-[#F22998]/70 bg-[#F22998]/10 px-3 py-1 rounded-full border border-[#F22998]/20 whitespace-nowrap">
                Em breve
              </span>
            </motion.div>
          ))}
        </div>

        {/* Coming Soon Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-[#F2F2F2]/30 text-sm">
            O envio de documentos estará disponível em breve.
          </p>
        </motion.div>
      </div>
    </div>
  );
}