import React, { useRef } from 'react';
import { Upload, CheckCircle2, Loader2, X } from 'lucide-react';

export default function DocUploadField({ label, value, onChange, uploading }) {
  const inputRef = useRef(null);

  return (
    <div>
      <label className="block text-xs text-[#F2F2F2]/50 mb-1.5">{label}</label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
          ${value ? 'border-[#F472B6]/60 bg-[#F472B6]/5' : 'border-[#F472B6]/20 hover:border-[#F472B6]/50 hover:bg-[#F472B6]/5'}
          ${uploading ? 'opacity-60 cursor-wait' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={e => e.target.files?.[0] && onChange(e.target.files[0])}
        />

        {uploading ? (
          <Loader2 className="w-6 h-6 text-[#F472B6] animate-spin" />
        ) : value ? (
          <>
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <p className="text-xs text-green-400 text-center truncate max-w-full px-2">
              {typeof value === 'string' ? 'Arquivo enviado ✓' : value.name}
            </p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-[#F472B6]/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#F472B6]/70" />
            </div>
            <p className="text-xs text-[#F2F2F2]/40 text-center">Toque para selecionar</p>
          </>
        )}
      </div>
    </div>
  );
}