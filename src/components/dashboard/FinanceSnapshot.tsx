import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, Loader2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useMonthlyStats } from '@/hooks/useFinance';
import { DashboardWidgetShell, DashboardEmptyState } from './DashboardWidgetShell';

interface StatRowProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
  iconBg: string;
}

function StatRow({ label, value, change, trend, icon, iconBg }: StatRowProps) {
  return (
    <div className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-all duration-200">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105",
        iconBg
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
      {change && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
          trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        )}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      )}
    </div>
  );
}

export function FinanceSnapshot() {
  const { t, currentLanguage } = useLanguage();
  const { data: stats, isLoading } = useMonthlyStats();

  if (isLoading) {
    return (
      <DashboardWidgetShell
        title={t('dashboard.financeSnapshot')}
        icon={DollarSign}
        iconColor="text-success"
        iconBg="bg-success/10"
        accentColor="bg-success/10"
        linkTo="/finance"
        linkText={t('common.viewAll')}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </DashboardWidgetShell>
    );
  }

  const netWorth = stats?.netWorth || 0;
  const monthlyExpenses = stats?.monthlyExpenses || 0;
  const monthlyIncome = stats?.monthlyIncome || 0;
  const savings = monthlyIncome - monthlyExpenses;
  const budgetUsed = monthlyIncome > 0 ? Math.round((monthlyExpenses / monthlyIncome) * 100) : 0;

  return (
    <DashboardWidgetShell
      title={t('dashboard.financeSnapshot')}
      icon={DollarSign}
      iconColor="text-success"
      iconBg="bg-success/10"
      accentColor="bg-success/10"
      linkTo="/finance"
      linkText={t('common.viewAll')}
    >
      {/* Stats */}
      <div className="space-y-1">
        <StatRow
          label={t('finance.netWorth')}
          value={`SAR ${netWorth.toLocaleString()}`}
          change={netWorth > 0 ? '+12.5%' : undefined}
          trend="up"
          icon={<Wallet className="w-4.5 h-4.5 text-primary" />}
          iconBg="bg-primary/10"
        />
        
        <StatRow
          label={t('finance.monthlyExpenses')}
          value={`SAR ${monthlyExpenses.toLocaleString()}`}
          change={monthlyExpenses > 0 ? '-5.2%' : undefined}
          trend="down"
          icon={<CreditCard className="w-4.5 h-4.5 text-destructive" />}
          iconBg="bg-destructive/10"
        />
        
        <StatRow
          label={currentLanguage === 'ar' ? 'المدخرات' : 'Savings'}
          value={`SAR ${savings.toLocaleString()}`}
          change={savings > 0 ? '+22%' : undefined}
          trend={savings > 0 ? 'up' : 'down'}
          icon={<PiggyBank className="w-4.5 h-4.5 text-success" />}
          iconBg="bg-success/10"
        />
      </div>

      {/* Budget Progress */}
      <div className="mt-4 pt-3 border-t border-border/40">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">
            {currentLanguage === 'ar' ? 'الميزانية' : 'Budget'}
          </span>
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            budgetUsed > 80 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            {budgetUsed}%
          </span>
        </div>
        
        <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
              budgetUsed > 80 ? 'bg-destructive' : 'bg-gradient-to-r from-primary to-primary/70'
            )}
            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            savings > 0 ? "bg-success" : "bg-destructive"
          )} />
          {currentLanguage === 'ar' 
            ? `متبقي ${Math.abs(monthlyIncome - monthlyExpenses).toLocaleString()} ر.س` 
            : `SAR ${Math.abs(monthlyIncome - monthlyExpenses).toLocaleString()} left`
          }
        </p>
      </div>
    </DashboardWidgetShell>
  );
}