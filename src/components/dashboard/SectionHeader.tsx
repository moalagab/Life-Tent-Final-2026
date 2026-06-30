import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface SectionHeaderProps {
  title: string;
  count?: number;
  icon?: LucideIcon;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
  action?: React.ReactNode;
  summary?: string; // peek line shown when collapsed
}

/**
 * SectionHeader — quiet, label-style header.
 * Uppercase tracking + thin divider, no loud icons or shadows.
 */
export function SectionHeader({
  title,
  count,
  icon: Icon,
  collapsible,
  open,
  onToggle,
  action,
  summary,
}: SectionHeaderProps) {
  const { isRTL } = useLanguage();
  return (
    <div className="flex items-center justify-between gap-3 mb-3 ps-0.5">
      <button
        type="button"
        onClick={collapsible ? onToggle : undefined}
        className={cn(
          'group flex items-center gap-2 text-start min-w-0',
          collapsible && 'cursor-pointer'
        )}
        disabled={!collapsible}
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" strokeWidth={2} />}
        <h3 dir="auto" className={cn(
          'text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors shrink-0',
          !isRTL && 'uppercase tracking-[0.08em]'
        )}>
          {title}
        </h3>
        {typeof count === 'number' && count > 0 && (
          <span className="text-[11px] font-medium text-muted-foreground/70 tabular-nums shrink-0">
            {count}
          </span>
        )}
        {collapsible && (
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200 shrink-0',
              open ? 'rotate-0' : '-rotate-90'
            )}
          />
        )}
        {collapsible && !open && summary && (
          <span className="hidden sm:block text-[10px] text-muted-foreground/45 truncate">
            {summary}
          </span>
        )}
      </button>
      {action && <div className="flex items-center">{action}</div>}
    </div>
  );
}
