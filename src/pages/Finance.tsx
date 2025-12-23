import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, Wallet, Receipt, PiggyBank, 
  CreditCard, RefreshCw, TrendingUp, FileText, Briefcase, Upload,
  Globe, Lock
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { FinanceHome } from '@/components/finance/FinanceHome';
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
    { id: 'projects', label: language === 'ar' ? 'المشاريع' : 'Projects', icon: Briefcase },
    { id: 'currencies', label: language === 'ar' ? 'العملات' : 'Currencies', icon: Globe },
    { id: 'close', label: language === 'ar' ? 'الإقفال' : 'Close', icon: Lock },
    { id: 'reports', label: language === 'ar' ? 'التقارير' : 'Reports', icon: FileText },
    { id: 'import', label: language === 'ar' ? 'استيراد' : 'Import', icon: Upload },
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
                className="flex items-center gap-2 px-3 py-2 whitespace-nowrap"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview"><FinanceHome /></TabsContent>
        <TabsContent value="accounts"><AccountsManager /></TabsContent>
        <TabsContent value="transactions"><TransactionsManager /></TabsContent>
        <TabsContent value="budget"><BudgetManager /></TabsContent>
        <TabsContent value="debts"><DebtsManager /></TabsContent>
        <TabsContent value="subscriptions"><SubscriptionsManager /></TabsContent>
        <TabsContent value="investments"><InvestmentsManager /></TabsContent>
        <TabsContent value="projects"><ProjectFinanceManager /></TabsContent>
        <TabsContent value="currencies"><CurrencyManager /></TabsContent>
        <TabsContent value="close"><MonthlyClose /></TabsContent>
        <TabsContent value="reports"><FinanceReports /></TabsContent>
        <TabsContent value="import"><DataImport /></TabsContent>
      </Tabs>
    </MainLayout>
  );
}
