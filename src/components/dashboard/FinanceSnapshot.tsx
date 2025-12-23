import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

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

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">{t('dashboard.financeSnapshot')}</h3>
        <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          {t('common.viewAll')} <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-4">
        <StatCard
          label={t('finance.netWorth')}
          value="SAR 245,780"
          change="+12.5%"
          trend="up"
          icon={<Wallet className="w-5 h-5 text-primary" />}
        />
        
        <div className="h-px bg-border" />
        
        <StatCard
          label={t('finance.monthlyExpenses')}
          value="SAR 18,420"
          change="-5.2%"
          trend="down"
          icon={<CreditCard className="w-5 h-5 text-destructive" />}
        />
        
        <div className="h-px bg-border" />
        
        <StatCard
          label={currentLanguage === 'ar' ? 'المدخرات هذا الشهر' : 'Savings This Month'}
          value="SAR 8,500"
          change="+22%"
          trend="up"
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
            {currentLanguage === 'ar' ? '٦٨٪ مستخدم' : '68% used'}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-gold rounded-full transition-all duration-500"
            style={{ width: '68%' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {currentLanguage === 'ar' ? 'متبقي ٦,٤٠٠ ر.س حتى ٣١ ديسمبر' : 'SAR 6,400 remaining until Dec 31'}
        </p>
      </div>
    </div>
  );
}
