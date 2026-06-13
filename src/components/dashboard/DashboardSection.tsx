import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  title: string;
  icon: LucideIcon;
  from: string;
  to: string;
  open: boolean;
  onToggle: () => void;
  summary?: string;
  children: React.ReactNode;
}

/**
 * DashboardSection — accordion card for dashboard sections.
 *
 * Collapsed: full glass-card with gradient icon + title + summary peek.
 * Open:      slim branded header + fade-in content below.
 */
export function DashboardSection({
  title,
  icon: Icon,
  from,
  to,
  open,
  onToggle,
  summary,
  children,
}: DashboardSectionProps) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="glass-card w-full flex items-center gap-3 px-4 py-3 text-start group active:scale-[0.99]"
      >
        <div
          className={cn(
            'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0',
            from,
            to,
          )}
        >
          <Icon className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
          {summary && (
            <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 leading-snug">
              {summary}
            </p>
          )}
        </div>

        <ChevronDown
          className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/70 -rotate-90 shrink-0 transition-colors"
          strokeWidth={2}
        />
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="group flex items-center gap-2.5 mb-3 ps-0.5 w-full"
      >
        <div
          className={cn(
            'w-7 h-7 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0',
            from,
            to,
          )}
        >
          <Icon className="w-3.5 h-3.5 text-white" strokeWidth={1.8} />
        </div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </h3>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" strokeWidth={2} />
      </button>

      <div className="animate-fade-in">{children}</div>
    </>
  );
}
