import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import CNHCard from '../components/driver/docs/CNHCard';
import RGCard from '../components/driver/docs/RGCard';
import CRLVCard from '../components/driver/docs/CRLVCard';
import SeguroCard from '../components/driver/docs/SeguroCard';

export default function DriverDocuments() {
  const [declared, setDeclared] = useState(false);

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
          className="mb-6 p-4 rounded-2xl bg-[#F22998]/10 border border-[#F22998]/30 flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-[#F22998] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#F2F2F2]/80 leading-relaxed">
            Seus documentos serão analisados pela nossa equipe para validar o seu cadastro como motorista.
            Após a aprovação, você poderá começar a receber corridas pela Central Dellas.
          </p>
        </motion.div>

        {/* Document Cards */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <CNHCard status="pending" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <RGCard status="pending" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CRLVCard status="pending" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <SeguroCard status="pending" />
          </motion.div>
        </div>

        {/* Declaração */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6 p-5 rounded-2xl bg-[#1A1A1A] border border-[#BF3B79]/30 space-y-4"
        >
          <h3 className="font-semibold text-[#F2F2F2]">Declaração</h3>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setDeclared(d => !d)}
              className={`mt-0.5 w-5 h-5 min-w-[20px] rounded border-2 flex items-center justify-center transition-colors ${
                declared
                  ? 'bg-[#F22998] border-[#F22998]'
                  : 'border-[#F22998]/40 group-hover:border-[#F22998]/70'
              }`}
            >
              {declared && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-[#F2F2F2]/70 leading-relaxed" onClick={() => setDeclared(d => !d)}>
              Declaro que os documentos enviados são verdadeiros, estão atualizados e correspondem ao veículo
              e à condutora cadastrada, me responsabilizando pelas informações prestadas.
            </span>
          </label>

          <Button
            disabled={!declared}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all"
            style={{
              background: declared
                ? 'linear-gradient(135deg, #BF3B79 0%, #F22998 100%)'
                : undefined
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar para análise
          </Button>
        </motion.div>

      </div>
    </div>
  );
}