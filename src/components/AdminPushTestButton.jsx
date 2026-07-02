import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { APP_BUILD_LABEL } from '@/config/swVersion';

export default function AdminPushTestButton({ isAdmin, className, onClick, showBuildLabel }) {
  if (!isAdmin) return null;

  return (
    <div className={cn('inline-flex items-center gap-1.5 shrink-0', showBuildLabel && 'flex-col gap-0.5')}>
      <Link
        to={createPageUrl('PushTestPage')}
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
          'border border-[#F472B6]/50 text-[#F472B6] text-xs font-semibold',
          'hover:bg-[#F472B6]/10 transition-colors',
          className,
        )}
      >
        <Bell className="w-4 h-4" />
        Teste Push
      </Link>
      {showBuildLabel && (
        <span className="text-[10px] text-[#F472B6]/70 font-mono leading-none">{APP_BUILD_LABEL}</span>
      )}
    </div>
  );
}
