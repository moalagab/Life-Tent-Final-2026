import { ArrowUpRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface DashboardWidgetShellProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  accentColor?: string;
  linkTo?: string;
  linkText?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export function DashboardWidgetShell({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  accentColor = 'bg-primary/5',
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
        "relative overflow-hidden rounded-2xl",
        "bg-card/60 backdrop-blur-xl",
        "border border-border/40",
        "shadow-sm hover:shadow-md",
        "transition-all duration-300",
        "hover:border-primary/20",
        compact ? "p-4" : "p-5",
        className
      )}
    >
      {/* Decorative Accent */}
      <div className={cn(
        "absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-60 pointer-events-none",
        accentColor
      )} />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-105",
              iconBg
            )}>
              <Icon className={cn("w-4.5 h-4.5", iconColor)} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground leading-tight">{title}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          
          {linkTo && linkText ? (
            <Link 
              to={linkTo} 
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors group"
            >
              {linkText}
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : headerAction}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: ReactNode;
}

export function DashboardEmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-6">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-7 h-7 text-muted-foreground/70" />
      </div>
      <p className="text-sm text-muted-foreground mb-2">{message}</p>
      {action}
    </div>
  );
}

// Stat Item Component
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
  iconColor = 'text-primary',
  trend,
  trendValue 
}: StatItemProps) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-bold text-foreground truncate">{value}</p>
      </div>
      {trend && trendValue && (
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        )}>
          {trend === 'up' ? '+' : ''}{trendValue}
        </span>
      )}
    </div>
  );
}
