import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMonthlyStats } from '@/hooks/useFinance';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { AccountsManager } from '@/components/finance/AccountsManager';
import { TransactionsManager } from '@/components/finance/TransactionsManager';
import { BudgetManager } from '@/components/finance/BudgetManager';
import { WishlistManager } from '@/components/finance/WishlistManager';
import { DebtsManager } from '@/components/finance/DebtsManager';
import { SubscriptionsManager } from '@/components/finance/SubscriptionsManager';
import { InvestmentsManager } from '@/components/finance/InvestmentsManager';
import { FinanceReports } from '@/components/finance/FinanceReports';
import { FinanceIntelligencePanel } from '@/components/finance/FinanceIntelligencePanel';
import { cn } from '@/lib/utils';
import {
  Wallet, Activity, Receipt, PiggyBank, TrendingUp,
} from 'lucide-react';

type Tab = 'overview' | 'transactions' | 'budget' | 'investments';

const TABS = [
  { id: 'overview'     as Tab, labelAr: 'نظرة عامة',            icon: Activity    },
  { id: 'transactions' as Tab, labelAr: 'الحسابات والمعاملات',  icon: Receipt     },
  { id: 'budget'       as Tab, labelAr: 'الميزانية والديون',    icon: PiggyBank   },
  { id: 'investments'  as Tab, labelAr: 'الاستثمار والتقارير',  icon: TrendingUp  },
];

function formatMoney(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export default function FinanceWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { data: stats } = useMonthlyStats();

  const netWorth       = stats?.netWorth       ?? 0;
  const monthlyExpenses = stats?.monthlyExpenses ?? 0;
  const savingsRate    = stats?.savingsRate     ?? 0;

  const kpis = [
    { label: 'صافي الثروة',     value: `${formatMoney(netWorth)} ر.س`,     color: netWorth >= 0 ? 'text-emerald-500' : 'text-destructive' },
    { label: 'مصاريف الشهر',   value: `${formatMoney(monthlyExpenses)} ر.س`, color: 'text-amber-500' },
    { label: 'معدل الادخار',   value: `${savingsRate}%`,                    color: savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 10 ? 'text-primary' : 'text-destructive' },
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="glass-card p-5 relative overflow-hidden" style={{ borderTop: '3px solid hsl(142, 76%, 36%)' }}>
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ background: 'radial-gradient(60% 60% at 80% 20%, hsl(142, 76%, 36%), transparent)' }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6 text-emerald-500" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground">المالية الشخصية</h1>
                <p className="text-sm text-muted-foreground mt-0.5">نظرة شاملة على وضعك المالي</p>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="relative mt-5 grid grid-cols-3 gap-3">
            {kpis.map(kpi => (
              <div key={kpi.label} className="bg-muted/30 rounded-xl p-3 text-center">
                <p className={cn('text-xl font-bold', kpi.color)}>{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-2">
          {TABS.map(({ id: tabId, labelAr, icon: Icon }) => {
            const active = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all active:scale-95',
                  active
                    ? 'bg-card/80 border-border/50'
                    : 'border-transparent bg-muted/30 hover:bg-muted/50',
                )}
              >
                <Icon
                  className={cn('w-5 h-5', active ? 'text-emerald-500' : 'text-muted-foreground')}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span className={cn('text-xs font-semibold', active ? 'text-foreground' : 'text-foreground/60')}>
                  {labelAr}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="pb-8 space-y-4">

          {activeTab === 'overview' && (
            <>
              <FinanceDashboard />
              <FinanceIntelligencePanel />
            </>
          )}

          {activeTab === 'transactions' && (
            <>
              <AccountsManager />
              <TransactionsManager />
            </>
          )}

          {activeTab === 'budget' && (
            <>
              <BudgetManager />
              <WishlistManager />
              <DebtsManager />
              <SubscriptionsManager />
            </>
          )}

          {activeTab === 'investments' && (
            <>
              <InvestmentsManager />
              <FinanceReports />
            </>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
