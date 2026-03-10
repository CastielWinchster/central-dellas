import React from 'react';
import { Clock, Search, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending:    { label: 'Pendente',    color: 'text-yellow-400',  bg: 'bg-yellow-400/10 border-yellow-400/30', Icon: Clock },
  reviewing:  { label: 'Em análise', color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/30',    Icon: Search },
  approved:   { label: 'Aprovado',   color: 'text-green-400',   bg: 'bg-green-400/10 border-green-400/30',  Icon: CheckCircle2 },
  rejected:   { label: 'Rejeitado',  color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/30',     Icon: XCircle },
};

export default function DocStatusBadge({ status = 'pending' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
      <cfg.Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}