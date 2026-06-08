import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, Wallet, Receipt, PiggyBank, 
  CreditCard, RefreshCw, TrendingUp, FileText, Briefcase, Upload,
  Globe, Lock, Gauge, ShoppingBag, History
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
import { CurrencyManager } from '@/components/finance/CurrencyManager';
import { MonthlyClose } from '@/components/finance/MonthlyClose';
import { WishlistManager } from '@/components/finance/WishlistManager';
import { FinanceAIAssistant } from '@/components/finance/FinanceAIAssistant';
import { FinanceAuditLogView } from '@/components/finance/FinanceAuditLogView';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const ALLOWED_TABS = [
  'dashboard','accounts','transactions','budget','wishlist','debts',
  'subscriptions','investments','projects','currencies','close','reports','audit','import',
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

  const tabs = [
    { id: 'dashboard', label: t('finance.dashboard'), icon: Gauge },
    { id: 'accounts', label: t('finance.accounts'), icon: Wallet },
    { id: 'transactions', label: t('finance.transactions'), icon: Receipt },
    { id: 'budget', label: t('finance.budgets'), icon: PiggyBank },
    { id: 'wishlist', label: t('finance.wishlist'), icon: ShoppingBag },
    { id: 'debts', label: t('finance.debts'), icon: CreditCard },
    { id: 'subscriptions', label: t('finance.subscriptions'), icon: RefreshCw },
    { id: 'investments', label: t('finance.investments'), icon: TrendingUp },
    { id: 'projects', label: t('finance.projectFinance'), icon: Briefcase },
    { id: 'currencies', label: t('finance.currencies'), icon: Globe },
    { id: 'close', label: t('finance.monthlyClose'), icon: Lock },
    { id: 'reports', label: t('finance.reports'), icon: FileText },
    { id: 'audit', label: t('finance.auditLog'), icon: History },
    { id: 'import', label: t('finance.dataImport'), icon: Upload },
  ];

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          {t('finance.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('finance.subtitle')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FinanceTab)} className="space-y-6">
        <div className="overflow-x-auto pb-2" dir={isRTL ? 'rtl' : 'ltr'}>
          <TabsList className="inline-flex min-w-full md:min-w-0 h-auto p-1 bg-muted/50">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-3 py-2 whitespace-nowrap"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="dashboard"><FinanceDashboard /></TabsContent>
        <TabsContent value="accounts"><AccountsManager /></TabsContent>
        <TabsContent value="transactions"><TransactionsManager /></TabsContent>
        <TabsContent value="budget"><BudgetManager /></TabsContent>
        <TabsContent value="wishlist"><WishlistManager /></TabsContent>
        <TabsContent value="debts"><DebtsManager /></TabsContent>
        <TabsContent value="subscriptions"><SubscriptionsManager /></TabsContent>
        <TabsContent value="investments"><InvestmentsManager /></TabsContent>
        <TabsContent value="projects"><ProjectFinanceManager /></TabsContent>
        <TabsContent value="currencies"><CurrencyManager /></TabsContent>
        <TabsContent value="close"><MonthlyClose /></TabsContent>
        <TabsContent value="reports"><FinanceReports /></TabsContent>
        <TabsContent value="audit"><FinanceAuditLogView /></TabsContent>
        <TabsContent value="import"><DataImport /></TabsContent>
      </Tabs>

      {/* AI Assistant */}
      <FinanceAIAssistant />
    </MainLayout>
  );
}
