import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      color:   'from-emerald-500 to-teal-600',
      tabs: [
        { id: 'dashboard',    label: t('finance.dashboard'),    icon: Gauge    },
        { id: 'accounts',     label: t('finance.accounts'),     icon: Wallet   },
        { id: 'transactions', label: t('finance.transactions'), icon: Receipt  },
        { id: 'budget',       label: t('finance.budgets'),      icon: PiggyBank },
      ],
    },
    {
      labelAr: 'التخطيط',
      labelEn: 'Planning',
      color:   'from-blue-500 to-indigo-600',
      tabs: [
        { id: 'wishlist',     label: t('finance.wishlist'),     icon: ShoppingBag },
        { id: 'debts',        label: t('finance.debts'),        icon: CreditCard  },
        { id: 'subscriptions',label: t('finance.subscriptions'),icon: RefreshCw   },
        { id: 'investments',  label: t('finance.investments'),  icon: TrendingUp  },
      ],
    },
    {
      labelAr: 'متقدم',
      labelEn: 'Advanced',
      color:   'from-violet-500 to-purple-600',
      tabs: [
        { id: 'projects', label: t('finance.projectFinance'), icon: Briefcase },
        { id: 'reports',  label: t('finance.reports'),        icon: FileText  },
        { id: 'audit',    label: t('finance.auditLog'),       icon: History   },
        { id: 'import',   label: t('finance.dataImport'),     icon: Upload    },
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

        {/* Grouped tab navigation — 3 sections of 4 pills each */}
        <div className="space-y-2">
          {TAB_GROUPS.map(group => {
            const groupActive = group.tabs.some(t => t.id === activeTab);
            return (
              <div key={group.labelEn} className="space-y-1.5">
                {/* Group label */}
                <p className={cn(
                  'text-[10px] font-bold uppercase tracking-widest px-0.5 transition-colors',
                  groupActive ? 'text-foreground' : 'text-muted-foreground/60',
                )}>
                  {isRTL ? group.labelAr : group.labelEn}
                </p>
                {/* Pill row */}
                <div className="flex flex-wrap gap-1.5">
                  {group.tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as FinanceTab)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95',
                          isActive
                            ? `bg-gradient-to-r ${group.color} text-white shadow-sm`
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FinanceTab)} className="space-y-6">
        <div />

        <TabsContent value="dashboard"><FinanceDashboard /></TabsContent>
        <TabsContent value="accounts"><AccountsManager /></TabsContent>
        <TabsContent value="transactions"><TransactionsManager /></TabsContent>
        <TabsContent value="budget"><BudgetManager /></TabsContent>
        <TabsContent value="wishlist"><WishlistManager /></TabsContent>
        <TabsContent value="debts"><DebtsManager /></TabsContent>
        <TabsContent value="subscriptions"><SubscriptionsManager /></TabsContent>
        <TabsContent value="investments"><InvestmentsManager /></TabsContent>
        <TabsContent value="projects"><ProjectFinanceManager /></TabsContent>
        <TabsContent value="reports"><FinanceReports /></TabsContent>
        <TabsContent value="audit"><FinanceAuditLogView /></TabsContent>
        <TabsContent value="import"><DataImport /></TabsContent>
      </Tabs>

      {/* AI Assistant */}
      <FinanceAIAssistant />
    </MainLayout>
  );
}
