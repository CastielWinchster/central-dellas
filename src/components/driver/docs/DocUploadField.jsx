import React from 'react';
import { Upload, Image } from 'lucide-react';

export default function DocUploadField({ label }) {
  return (
    <div>
      <label className="block text-xs text-[#F2F2F2]/50 mb-1.5">{label}</label>
      <div className="border-2 border-dashed border-[#F22998]/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#F22998]/50 hover:bg-[#F22998]/5 transition-all">
        <div className="w-10 h-10 rounded-full bg-[#F22998]/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-[#F22998]/70" />
        </div>
        <p className="text-xs text-[#F2F2F2]/40 text-center">Toque para selecionar imagem</p>
      </div>
    </div>
  );
}