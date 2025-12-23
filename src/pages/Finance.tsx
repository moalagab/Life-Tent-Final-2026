import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, Wallet, Receipt, PiggyBank, 
  CreditCard, RefreshCw, TrendingUp, FileText 
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { FinanceHome } from '@/components/finance/FinanceHome';
import { AccountsManager } from '@/components/finance/AccountsManager';
import { TransactionsManager } from '@/components/finance/TransactionsManager';
import { BudgetManager } from '@/components/finance/BudgetManager';
import { DebtsManager } from '@/components/finance/DebtsManager';
import { SubscriptionsManager } from '@/components/finance/SubscriptionsManager';
import { InvestmentsManager } from '@/components/finance/InvestmentsManager';
import { FinanceCharts } from '@/components/finance/FinanceCharts';
import { MonthlyReport } from '@/components/finance/MonthlyReport';

export default function Finance() {
  const { currentLanguage } = useLanguage();
  const language = currentLanguage;
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: language === 'ar' ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard },
    { id: 'accounts', label: language === 'ar' ? 'الحسابات' : 'Accounts', icon: Wallet },
    { id: 'transactions', label: language === 'ar' ? 'العمليات' : 'Transactions', icon: Receipt },
    { id: 'budget', label: language === 'ar' ? 'الميزانية' : 'Budget', icon: PiggyBank },
    { id: 'debts', label: language === 'ar' ? 'الديون' : 'Debts', icon: CreditCard },
    { id: 'subscriptions', label: language === 'ar' ? 'الاشتراكات' : 'Subscriptions', icon: RefreshCw },
    { id: 'investments', label: language === 'ar' ? 'الاستثمارات' : 'Investments', icon: TrendingUp },
    { id: 'reports', label: language === 'ar' ? 'التقارير' : 'Reports', icon: FileText },
  ];

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          {language === 'ar' ? 'المالية' : 'Finance'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'ar' ? 'إدارة شاملة لأموالك واستثماراتك' : 'Complete financial management system'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex min-w-full md:min-w-0 h-auto p-1 bg-muted/50">
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2 px-4 py-2 whitespace-nowrap"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <FinanceHome />
        </TabsContent>

        <TabsContent value="accounts">
          <AccountsManager />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsManager />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetManager />
        </TabsContent>

        <TabsContent value="debts">
          <DebtsManager />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionsManager />
        </TabsContent>

        <TabsContent value="investments">
          <InvestmentsManager />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <FinanceCharts />
          <MonthlyReport />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
