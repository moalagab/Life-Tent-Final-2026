import { useMemo } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, PiggyBank, CreditCard, 
  Target, AlertTriangle, ArrowUpRight, ArrowDownRight,
  DollarSign, BarChart3, PieChart, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useAccounts, useTransactions, useMonthlyStats, useSubscriptions } from '@/hooks/useFinance';
import { useDebts, useInvestmentHoldings, useEnvelopes, useSinkingFunds } from '@/hooks/useAdvancedFinance';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart as RechartsPie, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

function StatCard({ title, value, change, changeLabel, icon: Icon, trend, color = 'primary' }: StatCardProps) {
  return (
    <Card className="glass-card hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-sm',
                trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : 
                 trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
                <span>{change > 0 ? '+' : ''}{change}%</span>
                {changeLabel && <span className="text-muted-foreground ms-1">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-xl',
            color === 'success' ? 'bg-success/20 text-success' :
            color === 'warning' ? 'bg-warning/20 text-warning' :
            color === 'destructive' ? 'bg-destructive/20 text-destructive' :
            'bg-primary/20 text-primary'
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceDashboard() {
  const { currentLanguage } = useLanguage();
  const language = currentLanguage;
  const locale = language === 'ar' ? ar : enUS;
  
  const { data: accounts } = useAccounts();
  const { data: transactions } = useTransactions();
  const { data: monthlyStats } = useMonthlyStats();
  const { data: subscriptions } = useSubscriptions();
  const { data: debts } = useDebts();
  const { data: holdings } = useInvestmentHoldings();
  const { data: envelopes } = useEnvelopes();
  const { data: sinkingFunds } = useSinkingFunds();

  // Calculate net worth
  const netWorth = useMemo(() => {
    const accountsTotal = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
    const investmentsTotal = holdings?.reduce((sum, h) => 
      sum + (h.quantity * (h.current_price || h.avg_cost)), 0) || 0;
    const debtsTotal = debts?.filter(d => d.status === 'active')
      .reduce((sum, d) => sum + d.remaining_amount, 0) || 0;
    return accountsTotal + investmentsTotal - debtsTotal;
  }, [accounts, holdings, debts]);

  // Calculate monthly cashflow data
  const cashflowData = useMemo(() => {
    if (!transactions) return [];
    
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthTx = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= start && txDate <= end;
      });
      
      const income = monthTx.filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expenses = monthTx.filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      last6Months.push({
        month: format(date, 'MMM', { locale }),
        income,
        expenses,
        net: income - expenses,
      });
    }
    return last6Months;
  }, [transactions, locale]);

  // Spending by category
  const categoryData = useMemo(() => {
    if (!transactions) return [];
    
    const spending: Record<string, number> = {};
    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const cat = tx.category || (language === 'ar' ? 'غير مصنف' : 'Uncategorized');
        spending[cat] = (spending[cat] || 0) + tx.amount;
      });

    return Object.entries(spending)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions, language]);

  // Account balances
  const accountsData = useMemo(() => {
    if (!accounts) return [];
    return accounts
      .filter(acc => acc.is_active !== false)
      .map(acc => ({
        name: acc.name,
        balance: acc.balance || 0,
        type: acc.type,
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [accounts]);

  // Budget progress
  const budgetProgress = useMemo(() => {
    const income = monthlyStats?.monthlyIncome || 0;
    const assigned = envelopes?.reduce((sum, e) => sum + (e.target_amount || 0), 0) || 0;
    const available = envelopes?.reduce((sum, e) => sum + (e.available_amount || 0), 0) || 0;
    return { income, assigned, available, unassigned: income - assigned };
  }, [monthlyStats, envelopes]);

  // Goals progress
  const goalsData = useMemo(() => {
    if (!sinkingFunds) return [];
    return sinkingFunds.map(fund => ({
      name: fund.name,
      current: fund.current_amount || 0,
      target: fund.target_amount,
      progress: ((fund.current_amount || 0) / fund.target_amount) * 100,
    })).slice(0, 4);
  }, [sinkingFunds]);

  // Alerts
  const alerts = useMemo(() => {
    const list: { type: 'warning' | 'danger'; message: string }[] = [];
    
    // Overspending
    if (monthlyStats && monthlyStats.monthlyExpenses > monthlyStats.monthlyIncome) {
      list.push({
        type: 'danger',
        message: language === 'ar' ? 'المصروفات تتجاوز الدخل هذا الشهر' : 'Expenses exceed income this month',
      });
    }
    
    // Low savings rate
    if (monthlyStats && monthlyStats.savingsRate < 10 && monthlyStats.savingsRate >= 0) {
      list.push({
        type: 'warning',
        message: language === 'ar' ? 'معدل الادخار منخفض جداً' : 'Savings rate is very low',
      });
    }

    // Upcoming subscriptions
    const upcomingSubs = subscriptions?.filter(s => {
      const days = Math.ceil((new Date(s.next_billing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 7 && days >= 0;
    });
    if (upcomingSubs && upcomingSubs.length > 0) {
      list.push({
        type: 'warning',
        message: language === 'ar' 
          ? `${upcomingSubs.length} اشتراكات تُجدد خلال أسبوع` 
          : `${upcomingSubs.length} subscriptions renewing within a week`,
      });
    }
    
    return list;
  }, [monthlyStats, subscriptions, language]);

  const monthlyIncome = monthlyStats?.monthlyIncome || 0;
  const monthlyExpenses = monthlyStats?.monthlyExpenses || 0;
  const savingsRate = monthlyStats?.savingsRate || 0;
  const totalDebt = debts?.filter(d => d.status === 'active')
    .reduce((sum, d) => sum + d.remaining_amount, 0) || 0;
  const portfolioValue = holdings?.reduce((sum, h) => 
    sum + (h.quantity * (h.current_price || h.avg_cost)), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div 
              key={i}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                alert.type === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
              )}
            >
              <AlertTriangle className="w-5 h-5" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={language === 'ar' ? 'صافي الثروة' : 'Net Worth'}
          value={`${netWorth.toLocaleString()} SAR`}
          icon={Wallet}
          color="primary"
        />
        <StatCard
          title={language === 'ar' ? 'الدخل الشهري' : 'Monthly Income'}
          value={`${monthlyIncome.toLocaleString()} SAR`}
          icon={TrendingUp}
          color="success"
          trend="up"
          change={12}
          changeLabel={language === 'ar' ? 'من الشهر الماضي' : 'vs last month'}
        />
        <StatCard
          title={language === 'ar' ? 'المصروفات الشهرية' : 'Monthly Expenses'}
          value={`${monthlyExpenses.toLocaleString()} SAR`}
          icon={TrendingDown}
          color={monthlyExpenses > monthlyIncome ? 'destructive' : 'warning'}
        />
        <StatCard
          title={language === 'ar' ? 'معدل الادخار' : 'Savings Rate'}
          value={`${savingsRate}%`}
          icon={PiggyBank}
          color={savingsRate >= 20 ? 'success' : savingsRate >= 10 ? 'warning' : 'destructive'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashflow Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {language === 'ar' ? 'التدفق النقدي' : 'Cashflow'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                    name={language === 'ar' ? 'الدخل' : 'Income'}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="2"
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.6}
                    name={language === 'ar' ? 'المصروفات' : 'Expenses'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              {language === 'ar' ? 'المصروفات حسب الفئة' : 'Spending by Category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <RechartsPie>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString()} SAR`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="w-1/2 space-y-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="truncate max-w-[100px]">{cat.name}</span>
                    </div>
                    <span className="font-medium">{cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Accounts */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              {language === 'ar' ? 'الحسابات' : 'Accounts'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {accountsData.map(acc => (
              <div key={acc.name} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{acc.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{acc.type}</p>
                </div>
                <span className={cn(
                  'font-bold',
                  acc.balance >= 0 ? 'text-foreground' : 'text-destructive'
                )}>
                  {acc.balance.toLocaleString()} SAR
                </span>
              </div>
            ))}
            {accountsData.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                {language === 'ar' ? 'لا توجد حسابات' : 'No accounts'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Debt Summary */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {language === 'ar' ? 'الديون' : 'Debts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-destructive">
                {totalDebt.toLocaleString()} SAR
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'إجمالي الديون المتبقية' : 'Total remaining debt'}
              </p>
            </div>
            <div className="space-y-2">
              {debts?.filter(d => d.status === 'active').slice(0, 3).map(debt => (
                <div key={debt.id} className="flex items-center justify-between text-sm">
                  <span>{debt.name}</span>
                  <span className="text-destructive">{debt.remaining_amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Investment Summary */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {language === 'ar' ? 'الاستثمارات' : 'Investments'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-success">
                {portfolioValue.toLocaleString()} SAR
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'قيمة المحفظة' : 'Portfolio value'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="font-bold">{holdings?.length || 0}</p>
                <p className="text-muted-foreground">{language === 'ar' ? 'أصول' : 'Assets'}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="font-bold text-success">+{((portfolioValue * 0.05) / portfolioValue * 100).toFixed(1)}%</p>
                <p className="text-muted-foreground">{language === 'ar' ? 'العائد' : 'Return'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      {goalsData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {language === 'ar' ? 'أهداف الادخار' : 'Savings Goals'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {goalsData.map(goal => (
                <div key={goal.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-sm text-muted-foreground">{goal.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(goal.progress, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{goal.current.toLocaleString()}</span>
                    <span>{goal.target.toLocaleString()} SAR</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {language === 'ar' ? 'نظرة على الميزانية' : 'Budget Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-success">{budgetProgress.income.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الدخل' : 'Income'}</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold">{budgetProgress.assigned.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مخصص' : 'Assigned'}</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-primary">{budgetProgress.available.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'متاح' : 'Available'}</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className={cn(
                'text-2xl font-bold',
                budgetProgress.unassigned > 0 ? 'text-warning' : budgetProgress.unassigned < 0 ? 'text-destructive' : 'text-success'
              )}>
                {budgetProgress.unassigned.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'غير مخصص' : 'Unassigned'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
