import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, ArrowUpRight, Loader2, DollarSign } from 'lucide-react';
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
  iconBg: string;
}

function StatCard({ label, value, change, trend, icon, iconBg }: StatCardProps) {
  return (
    <div className="group flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-all duration-300">
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
        iconBg
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-lg font-bold text-foreground truncate">{value}</p>
      </div>
      {change && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full transition-transform duration-300 group-hover:scale-105',
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
      <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full flex items-center justify-center">
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
    <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('dashboard.financeSnapshot')}</h3>
          </div>
          <Link 
            to="/finance" 
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            {t('common.viewAll')} 
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Stats */}
        <div className="space-y-1">
          <StatCard
            label={t('finance.netWorth')}
            value={`SAR ${netWorth.toLocaleString()}`}
            change={netWorth > 0 ? '+12.5%' : undefined}
            trend="up"
            icon={<Wallet className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/10"
          />
          
          <StatCard
            label={t('finance.monthlyExpenses')}
            value={`SAR ${monthlyExpenses.toLocaleString()}`}
            change={monthlyExpenses > 0 ? '-5.2%' : undefined}
            trend="down"
            icon={<CreditCard className="w-5 h-5 text-destructive" />}
            iconBg="bg-destructive/10"
          />
          
          <StatCard
            label={currentLanguage === 'ar' ? 'المدخرات هذا الشهر' : 'Savings This Month'}
            value={`SAR ${savings.toLocaleString()}`}
            change={savings > 0 ? '+22%' : undefined}
            trend={savings > 0 ? 'up' : 'down'}
            icon={<PiggyBank className="w-5 h-5 text-success" />}
            iconBg="bg-success/10"
          />
        </div>

        {/* Budget Progress */}
        <div className="mt-5 pt-4 border-t border-border/50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">
              {currentLanguage === 'ar' ? 'الميزانية الشهرية' : 'Monthly Budget'}
            </span>
            <span className={cn(
              "text-sm font-bold px-2 py-0.5 rounded-full",
              budgetUsed > 80 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            )}>
              {budgetUsed}%
            </span>
          </div>
          
          <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out',
                budgetUsed > 80 ? 'bg-gradient-to-r from-destructive to-destructive/70' : 'bg-gradient-to-r from-primary to-gold-500'
              )}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <span className={cn(
              "w-2 h-2 rounded-full",
              savings > 0 ? "bg-success" : "bg-destructive"
            )} />
            {currentLanguage === 'ar' 
              ? `متبقي ${Math.abs(monthlyIncome - monthlyExpenses).toLocaleString()} ر.س` 
              : `SAR ${Math.abs(monthlyIncome - monthlyExpenses).toLocaleString()} remaining`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
