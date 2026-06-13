import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  LayoutDashboard, Wallet, Receipt, PiggyBank,
  CreditCard, RefreshCw, TrendingUp, FileText, Briefcase, Upload,
  Gauge, ShoppingBag, History
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { AccountsManager } from '@/components/finance/AccountsManager';
import { TransactionsManager } from '@/components/finance/TransactionsManager';
import { BudgetManager } from '@/components/finance/BudgetManager';
import { DebtsManager } from '@/components/finance/DebtsManager';
import { SubscriptionsManager } from '@/components/finance/SubscriptionsManager';
import { InvestmentsManager } from '@/components/finance/InvestmentsManager';
import { ProjectFinanceManager } from '@/components/finance/ProjectFinanceManager';
import { FinanceReports } from '@/components/finance/FinanceReports';
import { DataImport } from '@/components/finance/DataImport';
import { WishlistManager } from '@/components/finance/WishlistManager';
import { FinanceAIAssistant } from '@/components/finance/FinanceAIAssistant';
import { FinanceAuditLogView } from '@/components/finance/FinanceAuditLogView';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { cn } from '@/lib/utils';

const ALLOWED_TABS = [
  'dashboard','accounts','transactions','budget','wishlist','debts',
  'subscriptions','investments','projects','reports','audit','import',
] as const;
type FinanceTab = typeof ALLOWED_TABS[number];

// Stable references — prevent useRealtimeSubscription from re-subscribing on every render
const TRANSACTIONS_QUERY_KEY = ['transactions'];
const ACCOUNTS_QUERY_KEY = ['accounts'];

export default function Finance() {
  const { t, isRTL } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const initialTab: FinanceTab = (ALLOWED_TABS as readonly string[]).includes(rawTab ?? '')
    ? (rawTab as FinanceTab)
    : 'dashboard';
  const [activeTab, setActiveTab] = useState<FinanceTab>(initialTab);

  // Deep-link support with validation: ignore unknown tab values; ?new=1 opens transactions
  useEffect(() => {
    const tab = searchParams.get('tab');
    const isNew = searchParams.get('new') === '1';
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (isNew) {
      setActiveTab('transactions');
      next.delete('new');
      changed = true;
    } else if (tab) {
      if ((ALLOWED_TABS as readonly string[]).includes(tab)) {
        setActiveTab(tab as FinanceTab);
      } else {
        next.delete('tab');
        changed = true;
      }
    }
    if (changed) setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Realtime subscriptions
  useRealtimeSubscription({ table: 'transactions', queryKey: TRANSACTIONS_QUERY_KEY });
  useRealtimeSubscription({ table: 'accounts', queryKey: ACCOUNTS_QUERY_KEY });

  // ── Grouped tab structure — reduces cognitive load on mobile ─────────────────
  const TAB_GROUPS = [
    {
      labelAr: 'أعمال يومية',
      labelEn: 'Day-to-Day',
      activeBorder: 'border-emerald-400/40',
      tabs: [
        { id: 'dashboard',    label: t('finance.dashboard'),    icon: Gauge,     from: 'from-emerald-500', to: 'to-teal-600'     },
        { id: 'accounts',     label: t('finance.accounts'),     icon: Wallet,    from: 'from-green-500',   to: 'to-emerald-600'  },
        { id: 'transactions', label: t('finance.transactions'), icon: Receipt,   from: 'from-blue-500',    to: 'to-blue-600'     },
        { id: 'budget',       label: t('finance.budgets'),      icon: PiggyBank, from: 'from-amber-500',   to: 'to-orange-500'   },
      ],
    },
    {
      labelAr: 'التخطيط',
      labelEn: 'Planning',
      activeBorder: 'border-blue-400/40',
      tabs: [
        { id: 'wishlist',      label: t('finance.wishlist'),      icon: ShoppingBag, from: 'from-pink-500',   to: 'to-rose-500'    },
        { id: 'debts',         label: t('finance.debts'),         icon: CreditCard,  from: 'from-red-500',    to: 'to-rose-600'    },
        { id: 'subscriptions', label: t('finance.subscriptions'), icon: RefreshCw,   from: 'from-cyan-500',   to: 'to-blue-500'    },
        { id: 'investments',   label: t('finance.investments'),   icon: TrendingUp,  from: 'from-violet-500', to: 'to-purple-600'  },
      ],
    },
    {
      labelAr: 'متقدم',
      labelEn: 'Advanced',
      activeBorder: 'border-violet-400/40',
      tabs: [
        { id: 'projects', label: t('finance.projectFinance'), icon: Briefcase, from: 'from-indigo-500', to: 'to-blue-600'   },
        { id: 'reports',  label: t('finance.reports'),        icon: FileText,  from: 'from-slate-500',  to: 'to-gray-600'   },
        { id: 'audit',    label: t('finance.auditLog'),       icon: History,   from: 'from-yellow-500', to: 'to-amber-500'  },
        { id: 'import',   label: t('finance.dataImport'),     icon: Upload,    from: 'from-teal-500',   to: 'to-green-500'  },
      ],
    },
  ] as const;

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Wallet className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{t('finance.title')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('finance.subtitle')}</p>
          </div>
        </div>

        {/* Grouped tab navigation — Goals-style card grid */}
        <div className="space-y-3">
          {TAB_GROUPS.map(group => {
            const groupActive = group.tabs.some(t => t.id === activeTab);
            return (
              <div key={group.labelEn} className="space-y-2">
                {/* Group label */}
                <p className={cn(
                  'text-[10px] font-bold uppercase tracking-widest px-0.5 transition-colors',
                  groupActive ? 'text-foreground' : 'text-muted-foreground/50',
                )}>
                  {isRTL ? group.labelAr : group.labelEn}
                </p>
                {/* Card grid — 4 columns */}
                <div className="grid grid-cols-4 gap-2">
                  {group.tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as FinanceTab)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-2xl transition-all duration-200 active:scale-95 border',
                          isActive
                            ? cn('bg-card/80 border-border/50 shadow-sm', group.activeBorder)
                            : 'border-transparent bg-muted/30 hover:bg-muted/50',
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm',
                          tab.from, tab.to,
                        )}>
                          <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" strokeWidth={1.8} />
                        </div>
                        <p className={cn(
                          'text-[10px] font-semibold text-center leading-tight',
                          isActive ? 'text-foreground' : 'text-foreground/60',
                        )}>
                          {tab.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Render only the active tab — prevents all 13 components from mounting simultaneously */}
      <div className="mt-4">
        {activeTab === 'dashboard'     && <FinanceDashboard />}
        {activeTab === 'accounts'      && <AccountsManager />}
        {activeTab === 'transactions'  && <TransactionsManager />}
        {activeTab === 'budget'        && <BudgetManager />}
        {activeTab === 'wishlist'      && <WishlistManager />}
        {activeTab === 'debts'         && <DebtsManager />}
        {activeTab === 'subscriptions' && <SubscriptionsManager />}
        {activeTab === 'investments'   && <InvestmentsManager />}
        {activeTab === 'projects'      && <ProjectFinanceManager />}
        {activeTab === 'reports'       && <FinanceReports />}
        {activeTab === 'audit'         && <FinanceAuditLogView />}
        {activeTab === 'import'        && <DataImport />}
      </div>

      {/* AI Assistant */}
      <FinanceAIAssistant />
    </MainLayout>
  );
}
