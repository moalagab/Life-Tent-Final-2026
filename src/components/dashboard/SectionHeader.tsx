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
 * SectionHeader — consistent section labels.
 * Spacing/sizing-driven hierarchy (no color hierarchy).
 */
export function SectionHeader({ title, count, icon: Icon, collapsible, open, onToggle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3 px-1">
      <button
        type="button"
        onClick={collapsible ? onToggle : undefined}
        className={cn(
          'flex items-center gap-2 text-start',
          collapsible && 'hover:opacity-80 transition-opacity'
        )}
        disabled={!collapsible}
      >
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {typeof count === 'number' && (
          <span className="text-xs text-muted-foreground">· {count}</span>
        )}
        {collapsible && (
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              open ? 'rotate-0' : '-rotate-90'
            )}
          />
        )}
      </button>
      {action && <div>{action}</div>}
    </div>
  );
}
