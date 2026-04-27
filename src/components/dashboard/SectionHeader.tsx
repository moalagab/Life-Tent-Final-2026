import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  count?: number;
  icon?: LucideIcon;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
  action?: React.ReactNode;
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
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <button
        type="button"
        onClick={collapsible ? onToggle : undefined}
        className={cn(
          'group flex items-center gap-2 text-start',
          collapsible && 'cursor-pointer'
        )}
        disabled={!collapsible}
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/70" strokeWidth={2} />}
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </h2>
        {typeof count === 'number' && count > 0 && (
          <span className="text-[11px] font-medium text-muted-foreground/70 tabular-nums">
            {count}
          </span>
        )}
        {collapsible && (
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200',
              open ? 'rotate-0' : '-rotate-90'
            )}
          />
        )}
      </button>
      {action && <div className="flex items-center">{action}</div>}
    </div>
  );
}
