import React from 'react';

export default function DocTextField({ label, placeholder, type = 'text', value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-[#F2F2F2]/50 mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        className="w-full bg-[#111] border border-[#A855F7]/20 rounded-xl px-4 py-2.5 text-sm text-[#F2F2F2] placeholder-[#F2F2F2]/25 focus:outline-none focus:border-[#A855F7]/60 transition-colors"
      />
    </div>
  );
}