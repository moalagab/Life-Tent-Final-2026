import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, ArrowUpRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useMonthlyStats } from '@/hooks/useFinance';
import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
}

function StatCard({ label, value, change, trend, icon }: StatCardProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
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
      <div className="glass-card p-5 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const netWorth = stats?.netWorth || 0;
  const monthlyExpenses = stats?.monthlyExpenses || 0;
  const monthlyIncome = stats?.monthlyIncome || 0;
  const savings = monthlyIncome - monthlyExpenses;
  const budgetUsed = monthlyIncome > 0 ? Math.round((monthlyExpenses / monthlyIncome) * 100) : 0;

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">{t('dashboard.financeSnapshot')}</h3>
        <Link to="/finance" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          {t('common.viewAll')} <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-4">
        <StatCard
          label={t('finance.netWorth')}
          value={`SAR ${netWorth.toLocaleString()}`}
          change={netWorth > 0 ? '+12.5%' : undefined}
          trend="up"
          icon={<Wallet className="w-5 h-5 text-primary" />}
        />
        
        <div className="h-px bg-border" />
        
        <StatCard
          label={t('finance.monthlyExpenses')}
          value={`SAR ${monthlyExpenses.toLocaleString()}`}
          change={monthlyExpenses > 0 ? '-5.2%' : undefined}
          trend="down"
          icon={<CreditCard className="w-5 h-5 text-destructive" />}
        />
        
        <div className="h-px bg-border" />
        
        <StatCard
          label={currentLanguage === 'ar' ? 'المدخرات هذا الشهر' : 'Savings This Month'}
          value={`SAR ${savings.toLocaleString()}`}
          change={savings > 0 ? '+22%' : undefined}
          trend={savings > 0 ? 'up' : 'down'}
          icon={<PiggyBank className="w-5 h-5 text-success" />}
        />
      </div>

      {/* Quick Budget Progress */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            {currentLanguage === 'ar' ? 'الميزانية الشهرية' : 'Monthly Budget'}
          </span>
          <span className="text-sm font-medium text-foreground">
            {budgetUsed}% {currentLanguage === 'ar' ? 'مستخدم' : 'used'}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-500',
              budgetUsed > 80 ? 'bg-destructive' : 'bg-gradient-gold'
            )}
            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {currentLanguage === 'ar' 
            ? `متبقي ${(monthlyIncome - monthlyExpenses).toLocaleString()} ر.س` 
            : `SAR ${(monthlyIncome - monthlyExpenses).toLocaleString()} remaining`
          }
        </p>
      </div>
    </div>
  );
}
