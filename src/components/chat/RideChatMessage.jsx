import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RideChatMessage({ message, isOwn }) {
  const formattedTime = message.createdAt
    ? format(message.createdAt, 'HH:mm', { locale: ptBR })
    : '';

  return (
    <div className={cn('flex mb-3', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] px-4 py-2 rounded-2xl shadow-sm',
          isOwn
            ? 'bg-gradient-to-br from-[#BF3B79] to-[#F22998] text-white rounded-br-md'
            : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <span
          className={cn(
            'text-xs mt-1 block',
            isOwn ? 'text-white/70' : 'text-gray-500'
          )}
        >
          {formattedTime}
        </span>
      </div>
    </div>
  );
}