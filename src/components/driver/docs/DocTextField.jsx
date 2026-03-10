import React from 'react';

export default function DocTextField({ label, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-[#F2F2F2]/50 mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full bg-[#0D0D0D] border border-[#F22998]/20 rounded-xl px-4 py-2.5 text-sm text-[#F2F2F2] placeholder-[#F2F2F2]/20 focus:outline-none focus:border-[#F22998]/60 transition-colors"
      />
    </div>
  );
}