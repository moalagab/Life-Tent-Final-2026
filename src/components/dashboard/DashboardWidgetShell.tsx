import { ArrowUpRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface DashboardWidgetShellProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  /** @deprecated kept for backward compat — colors are unified now. */
  iconColor?: string;
  /** @deprecated kept for backward compat — colors are unified now. */
  iconBg?: string;
  /** @deprecated kept for backward compat — accent blob removed. */
  accentColor?: string;
  linkTo?: string;
  linkText?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Unified widget shell.
 * — Single neutral surface (no per-widget tint).
 * — Single icon treatment (muted; primary on hover only).
 * — Standardized typography (title text-sm, subtitle text-xs).
 * — RTL-safe (uses logical start/end).
 */
export function DashboardWidgetShell({
  title,
  subtitle,
  icon: Icon,
  linkTo,
  linkText,
  headerAction,
  children,
  className,
  compact = false,
}: DashboardWidgetShellProps) {
  return (
    <div
      className={cn(
        'group/widget relative rounded-2xl bg-card/50 border border-border/40',
        'hover:border-border/70 transition-colors duration-200',
        compact ? 'p-4' : 'p-4 lg:p-5',
        'flex flex-col h-full',
        className
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 dir="auto" className="text-sm font-semibold text-foreground leading-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p dir="auto" className="text-[11px] text-muted-foreground mt-0.5 truncate tabular-nums">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {linkTo && linkText ? (
          <Link
            to={linkTo}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="hidden sm:inline">{linkText}</span>
            <ArrowUpRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
          </Link>
        ) : (
          headerAction && <div className="shrink-0">{headerAction}</div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: ReactNode;
}

export function DashboardEmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-2">
      <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-muted-foreground/70" strokeWidth={2} />
      </div>
      <p className="text-sm text-muted-foreground mb-2">{message}</p>
      {action}
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export function DashboardStatItem({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
}: StatItemProps) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
      {Icon && (
        <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate tabular-nums">{value}</p>
      </div>
      {trend && trendValue && (
        <span
          className={cn(
            'text-[11px] font-medium px-2 py-0.5 rounded-md tabular-nums',
            trend === 'up' ? 'text-success' : 'text-destructive'
          )}
        >
          {trend === 'up' ? '+' : ''}
          {trendValue}
        </span>
      )}
    </div>
  );
}
