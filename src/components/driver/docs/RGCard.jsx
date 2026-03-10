import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocStatusBadge from './DocStatusBadge';
import DocUploadField from './DocUploadField';
import DocTextField from './DocTextField';

export default function RGCard({ status = 'pending' }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-[#1A1A1A] border border-[#BF3B79]/30 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 hover:bg-[#F22998]/5 transition-colors"
      >
        <div className="w-12 h-12 rounded-xl bg-[#F22998]/15 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-[#F22998]" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-[#F2F2F2]">RG</p>
          <p className="text-xs text-[#F2F2F2]/50">Documento de identidade</p>
        </div>
        <div className="flex items-center gap-3">
          <DocStatusBadge status={status} />
          {open ? <ChevronUp className="w-4 h-4 text-[#F2F2F2]/40" /> : <ChevronDown className="w-4 h-4 text-[#F2F2F2]/40" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-[#F22998]/10 pt-4 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <DocUploadField label="Frente do RG" />
                <DocUploadField label="Verso do RG" />
              </div>
              <DocTextField label="Número do RG" placeholder="Ex: 12.345.678-9" />
              <DocTextField label="Órgão emissor" placeholder="Ex: SSP/SP" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}