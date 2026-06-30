import { 
  Wallet, TrendingUp, TrendingDown, PiggyBank, 
  CreditCard, Target, AlertTriangle, Calendar,
  ArrowUpRight, ArrowDownRight, Bell, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useMonthlyStats, useSubscriptions, useTransactions, useAccounts } from '@/hooks/useFinance';
import { useDebts, useInvestmentHoldings, useInvestmentPortfolios } from '@/hooks/useAdvancedFinance';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, change, trend, icon: Icon, color }: StatCardProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          color === 'primary' && 'bg-primary/10',
          color === 'success' && 'bg-success/10',
          color === 'destructive' && 'bg-destructive/10',
          color === 'warning' && 'bg-warning/10',
          color === 'gold' && 'bg-gold/10'
        )}>
          <Icon className={cn(
            'w-5 h-5',
            color === 'primary' && 'text-primary',
            color === 'success' && 'text-success',
            color === 'destructive' && 'text-destructive',
            color === 'warning' && 'text-warning',
            color === 'gold' && 'text-gold'
          )} />
        </div>
        {change && (
          <span className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend === 'up' ? 'text-success' : 'text-destructive'
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

export function FinanceHome() {
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage;
  const locale = language === 'ar' ? ar : enUS;
  
  const { data: monthlyStats } = useMonthlyStats();
  const { data: subscriptions } = useSubscriptions();
  const { data: transactions } = useTransactions(5);
  const { data: accounts } = useAccounts();
  const { data: debts } = useDebts();
  const { data: portfolios } = useInvestmentPortfolios();
  const { data: holdings } = useInvestmentHoldings(portfolios?.[0]?.id);

  // Calculate totals
  const totalDebt = debts?.reduce((sum, d) => sum + (d.remaining_amount || 0), 0) || 0;
  const totalInterest = debts?.reduce((sum, d) => sum + ((d.remaining_amount || 0) * (d.interest_rate || 0) / 100), 0) || 0;
  const upcomingSubscriptions = subscriptions?.filter(s => {
    const nextDate = new Date(s.next_billing_date);
    return isAfter(nextDate, new Date()) && isBefore(nextDate, addDays(new Date(), 30));
  }) || [];
  const upcomingSubsTotal = upcomingSubscriptions.reduce((sum, s) => sum + s.amount, 0);
  
  // Portfolio value
  const portfolioValue = holdings?.reduce((sum, h) => {
    const value = h.quantity * (h.current_price || h.avg_cost);
    return sum + value;
  }, 0) || 0;
  
  const portfolioCost = holdings?.reduce((sum, h) => sum + (h.quantity * h.avg_cost), 0) || 0;
  const portfolioGain = portfolioValue - portfolioCost;
  const portfolioGainPercent = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0;

  // Alerts
  const alerts: { type: 'warning' | 'danger' | 'info'; message: string }[] = [];
  
  // Budget overspend alert
  if (monthlyStats && monthlyStats.monthlyExpenses > monthlyStats.monthlyIncome * 0.9) {
    alerts.push({ type: 'warning', message: t('finance.alerts.overspending') });
  }
  
  // Upcoming bills
  if (upcomingSubscriptions.length > 0) {
    const nextSub = upcomingSubscriptions[0];
    alerts.push({ 
      type: 'info', 
      message: `${t('finance.alerts.upcomingBill')}: ${nextSub.name} (${nextSub.amount} SAR)` 
    });
  }
  
  // Debt payment due
  const upcomingDebtPayments = debts?.filter(d => d.status === 'active' && d.end_date);
  if (upcomingDebtPayments && upcomingDebtPayments.length > 0) {
    alerts.push({ type: 'warning', message: t('finance.alerts.debtPaymentDue') });
  }

  const stats = [
    { 
      label: t('finance.cashOnHand'), 
      value: `SAR ${(accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0).toLocaleString()}`, 
      icon: Wallet, 
      color: 'primary' 
    },
    { 
      label: t('finance.netWorth'), 
      value: `SAR ${(monthlyStats?.netWorth || 0).toLocaleString()}`, 
      change: '+12.5%',
      trend: 'up' as const,
      icon: TrendingUp, 
      color: 'success' 
    },
    { 
      label: t('finance.thisMonth'), 
      value: `SAR ${((monthlyStats?.monthlyIncome || 0) - (monthlyStats?.monthlyExpenses || 0)).toLocaleString()}`, 
      change: monthlyStats && monthlyStats.monthlyIncome > monthlyStats.monthlyExpenses ? '+' : '',
      trend: monthlyStats && monthlyStats.monthlyIncome > monthlyStats.monthlyExpenses ? 'up' as const : 'down' as const,
      icon: PiggyBank, 
      color: monthlyStats && monthlyStats.monthlyIncome > monthlyStats.monthlyExpenses ? 'success' : 'destructive'
    },
    { 
      label: t('finance.totalDebts'), 
      value: `SAR ${totalDebt.toLocaleString()}`, 
      icon: CreditCard, 
      color: 'destructive' 
    },
    { 
      label: t('finance.upcomingBills'), 
      value: `SAR ${upcomingSubsTotal.toLocaleString()}`, 
      icon: Calendar, 
      color: 'warning' 
    },
    { 
      label: t('finance.portfolioValue'), 
      value: `SAR ${portfolioValue.toLocaleString()}`, 
      change: `${portfolioGainPercent >= 0 ? '+' : ''}${portfolioGainPercent.toFixed(1)}%`,
      trend: portfolioGainPercent >= 0 ? 'up' as const : 'down' as const,
      icon: Target, 
      color: 'gold' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div 
              key={i}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border',
                alert.type === 'warning' && 'bg-warning/10 border-warning/20',
                alert.type === 'danger' && 'bg-destructive/10 border-destructive/20',
                alert.type === 'info' && 'bg-primary/10 border-primary/20'
              )}
            >
              <AlertTriangle className={cn(
                'w-4 h-4',
                alert.type === 'warning' && 'text-warning',
                alert.type === 'danger' && 'text-destructive',
                alert.type === 'info' && 'text-primary'
              )} />
              <span className="text-sm">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense This Month */}
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold mb-4">{t('finance.thisMonth')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">{t('finance.income')}</span>
              </div>
              <span className="font-bold text-success">
                +{(monthlyStats?.monthlyIncome || 0).toLocaleString()} SAR
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm text-muted-foreground">{t('finance.expenses')}</span>
              </div>
              <span className="font-bold text-destructive">
                -{(monthlyStats?.monthlyExpenses || 0).toLocaleString()} SAR
              </span>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t('finance.net')}</span>
                <span className={cn(
                  'font-bold text-lg',
                  (monthlyStats?.monthlyIncome || 0) > (monthlyStats?.monthlyExpenses || 0) 
                    ? 'text-success' : 'text-destructive'
                )}>
                  {((monthlyStats?.monthlyIncome || 0) - (monthlyStats?.monthlyExpenses || 0)).toLocaleString()} SAR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Obligations */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('finance.upcoming30Days')}</h3>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {upcomingSubscriptions.slice(0, 4).map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(sub.next_billing_date), 'MMM d', { locale })}
                  </p>
                </div>
                <span className="font-bold text-sm">{sub.amount} SAR</span>
              </div>
            ))}
            {upcomingSubscriptions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('finance.noUpcoming')}
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('finance.recentActivity')}</h3>
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {transactions?.slice(0, 4).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                  )}>
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[120px]">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.date), 'MMM d', { locale })}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  tx.type === 'income' ? 'text-success' : 'text-destructive'
                )}>
                  {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
