import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, TrendingUp, TrendingDown, Wallet, 
  PieChart, BarChart3, Calendar, ArrowUpRight, ArrowDownRight,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAccounts, useTransactions, useMonthlyStats, useSubscriptions } from '@/hooks/useFinance';
import { useDebts, useInvestmentPortfolios, useInvestmentHoldings } from '@/hooks/useAdvancedFinance';
import { cn } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
];

export function FinanceReports() {
  const { currentLanguage } = useLanguage();
  const language = currentLanguage;
  const [period, setPeriod] = useState('6m');

  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: transactions } = useTransactions(500);
  const { data: monthlyStats } = useMonthlyStats();
  const { data: debts } = useDebts();
  const { data: subscriptions } = useSubscriptions();
  const { data: portfolios } = useInvestmentPortfolios();
  const { data: holdings } = useInvestmentHoldings();

  // Calculate Net Worth
  const calculateNetWorth = () => {
    const totalAssets = accounts?.reduce((sum, acc) => {
      if (acc.type !== 'credit') {
        return sum + (acc.balance || 0);
      }
      return sum;
    }, 0) || 0;

    const totalLiabilities = (accounts?.reduce((sum, acc) => {
      if (acc.type === 'credit') {
        return sum + Math.abs(acc.balance || 0);
      }
      return sum;
    }, 0) || 0) + (debts?.reduce((sum, d) => sum + d.remaining_amount, 0) || 0);

    const investmentValue = holdings?.reduce((sum, h) => {
      return sum + h.quantity * (h.current_price || h.avg_cost);
    }, 0) || 0;

    return {
      assets: totalAssets + investmentValue,
      liabilities: totalLiabilities,
      netWorth: totalAssets + investmentValue - totalLiabilities,
    };
  };

  // Generate monthly cashflow data
  const getCashflowData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthTransactions = transactions?.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= monthStart && txDate <= monthEnd;
      }) || [];

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month: format(date, 'MMM'),
        income,
        expenses,
        net: income - expenses,
      });
    }
    return months;
  };

  // Category spending breakdown
  const getCategorySpending = () => {
    const categoryMap: Record<string, number> = {};
    
    transactions?.filter(t => t.type === 'expense').forEach(t => {
      const category = t.category || (language === 'ar' ? 'غير مصنف' : 'Uncategorized');
      categoryMap[category] = (categoryMap[category] || 0) + t.amount;
    });

    return Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }));
  };

  // Debt payoff projection
  const getDebtPayoffData = () => {
    if (!debts?.length) return [];

    return debts.filter(d => d.status === 'active').map(d => {
      const monthlyPayment = d.minimum_payment || (d.remaining_amount / 12);
      const monthsToPayoff = monthlyPayment > 0 ? Math.ceil(d.remaining_amount / monthlyPayment) : 0;
      
      return {
        name: d.name,
        remaining: d.remaining_amount,
        monthsToPayoff,
        interestRate: d.interest_rate,
      };
    });
  };

  // Subscription forecast
  const getSubscriptionForecast = () => {
    const monthlyTotal = subscriptions?.reduce((sum, s) => {
      if (s.billing_cycle === 'monthly') return sum + s.amount;
      if (s.billing_cycle === 'yearly') return sum + (s.amount / 12);
      if (s.billing_cycle === 'quarterly') return sum + (s.amount / 3);
      return sum;
    }, 0) || 0;

    const yearlyTotal = monthlyTotal * 12;

    return { monthlyTotal, yearlyTotal };
  };

  // Portfolio allocation
  const getPortfolioAllocation = () => {
    if (!holdings?.length) return [];

    const allocationMap: Record<string, number> = {};
    let totalValue = 0;

    holdings.forEach(h => {
      const type = h.asset?.type || 'other';
      const value = h.quantity * (h.current_price || h.avg_cost);
      allocationMap[type] = (allocationMap[type] || 0) + value;
      totalValue += value;
    });

    return Object.entries(allocationMap).map(([type, value], index) => ({
      name: type,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: COLORS[index % COLORS.length],
    }));
  };

  const netWorthData = calculateNetWorth();
  const cashflowData = getCashflowData();
  const categoryData = getCategorySpending();
  const debtData = getDebtPayoffData();
  const subscriptionForecast = getSubscriptionForecast();
  const portfolioData = getPortfolioAllocation();

  const handleExport = () => {
    // Simple CSV export
    const csvData = cashflowData.map(d => 
      `${d.month},${d.income},${d.expenses},${d.net}`
    ).join('\n');
    
    const blob = new Blob([`Month,Income,Expenses,Net\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance-report.csv';
    a.click();
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تحليل شامل لوضعك المالي' : 'Comprehensive financial analysis'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">{language === 'ar' ? 'شهر' : '1 Month'}</SelectItem>
              <SelectItem value="3m">{language === 'ar' ? '3 أشهر' : '3 Months'}</SelectItem>
              <SelectItem value="6m">{language === 'ar' ? '6 أشهر' : '6 Months'}</SelectItem>
              <SelectItem value="1y">{language === 'ar' ? 'سنة' : '1 Year'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 me-2" />
            {language === 'ar' ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {netWorthData.assets.toLocaleString()} SAR
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الالتزامات' : 'Total Liabilities'}
                </p>
                <p className="text-3xl font-bold text-destructive mt-1">
                  {netWorthData.liabilities.toLocaleString()} SAR
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'صافي الثروة' : 'Net Worth'}
                </p>
                <p className={cn(
                  "text-3xl font-bold mt-1",
                  netWorthData.netWorth >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {netWorthData.netWorth.toLocaleString()} SAR
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="cashflow" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cashflow">
            {language === 'ar' ? 'التدفق النقدي' : 'Cashflow'}
          </TabsTrigger>
          <TabsTrigger value="spending">
            {language === 'ar' ? 'الإنفاق' : 'Spending'}
          </TabsTrigger>
          <TabsTrigger value="debts">
            {language === 'ar' ? 'الديون' : 'Debts'}
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            {language === 'ar' ? 'الاشتراكات' : 'Subscriptions'}
          </TabsTrigger>
          <TabsTrigger value="investments">
            {language === 'ar' ? 'الاستثمارات' : 'Investments'}
          </TabsTrigger>
        </TabsList>

        {/* Cashflow Report */}
        <TabsContent value="cashflow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'التدفق النقدي الشهري' : 'Monthly Cashflow'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashflowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        name={language === 'ar' ? 'الدخل' : 'Income'}
                        stroke="hsl(var(--success))" 
                        fill="hsl(var(--success) / 0.2)"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        name={language === 'ar' ? 'المصروفات' : 'Expenses'}
                        stroke="hsl(var(--destructive))" 
                        fill="hsl(var(--destructive) / 0.2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'صافي التدفق' : 'Net Cashflow'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashflowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="net" 
                        name={language === 'ar' ? 'الصافي' : 'Net'}
                        radius={[4, 4, 0, 0]}
                      >
                        {cashflowData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.net >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Spending Report */}
        <TabsContent value="spending">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'توزيع الإنفاق' : 'Spending Distribution'}</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `${value.toLocaleString()} SAR`}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'أعلى الفئات إنفاقاً' : 'Top Spending Categories'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((cat, index) => {
                    const total = categoryData.reduce((sum, c) => sum + c.value, 0);
                    const percentage = total > 0 ? (cat.value / total) * 100 : 0;
                    
                    return (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{cat.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {cat.value.toLocaleString()} SAR ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Debts Report */}
        <TabsContent value="debts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'توقعات سداد الديون' : 'Debt Payoff Projection'}</CardTitle>
              </CardHeader>
              <CardContent>
                {debtData.length > 0 ? (
                  <div className="space-y-4">
                    {debtData.map((debt, index) => (
                      <div key={index} className="p-4 rounded-xl bg-muted/30 border border-border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{debt.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {debt.interestRate}% {language === 'ar' ? 'فائدة' : 'interest'}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {debt.monthsToPayoff} {language === 'ar' ? 'شهر' : 'months'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-destructive">
                            {debt.remaining.toLocaleString()} SAR
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'لا توجد ديون نشطة' : 'No active debts'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'ملخص الديون' : 'Debt Summary'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'إجمالي الديون' : 'Total Debt'}
                    </p>
                    <p className="text-2xl font-bold text-destructive">
                      {debtData.reduce((sum, d) => sum + d.remaining, 0).toLocaleString()} SAR
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border">
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'متوسط معدل الفائدة' : 'Average Interest Rate'}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {debtData.length > 0 
                        ? (debtData.reduce((sum, d) => sum + d.interestRate, 0) / debtData.length).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Report */}
        <TabsContent value="subscriptions">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'توقعات الاشتراكات' : 'Subscription Forecast'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'التكلفة الشهرية' : 'Monthly Cost'}
                  </p>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {subscriptionForecast.monthlyTotal.toLocaleString()} SAR
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-warning/10 border border-warning/20">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'التكلفة السنوية' : 'Yearly Cost'}
                  </p>
                  <p className="text-3xl font-bold text-warning mt-2">
                    {subscriptionForecast.yearlyTotal.toLocaleString()} SAR
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-foreground mb-4">
                  {language === 'ar' ? 'الاشتراكات النشطة' : 'Active Subscriptions'}
                </h4>
                <div className="space-y-2">
                  {subscriptions?.filter(s => s.is_active).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.billing_cycle} • {language === 'ar' ? 'التجديد' : 'Renews'}: {format(new Date(s.next_billing_date), 'MMM d')}
                        </p>
                      </div>
                      <span className="font-semibold text-foreground">{s.amount} SAR</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investments Report */}
        <TabsContent value="investments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'توزيع المحفظة' : 'Portfolio Allocation'}</CardTitle>
              </CardHeader>
              <CardContent>
                {portfolioData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={portfolioData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {portfolioData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `${value.toLocaleString()} SAR`}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'لا توجد استثمارات' : 'No investments'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'تفاصيل التوزيع' : 'Allocation Details'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioData.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-foreground capitalize">{item.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.percentage.toFixed(1)}% ({item.value.toLocaleString()} SAR)
                        </span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
