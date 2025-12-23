import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTransactions } from '@/hooks/useFinance';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { FileText, Download, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--destructive))', '#8b5cf6', '#f59e0b', '#06b6d4'];

export function MonthlyReport() {
  const { t, currentLanguage } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { data: allTransactions } = useTransactions();
  
  const locale = currentLanguage === 'ar' ? arSA : enUS;
  
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  const transactions = allTransactions?.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= monthStart && txDate <= monthEnd;
  }) || [];
  
  const income = transactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);
    
  const expenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);
    
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
  
  // Group expenses by category
  const categoryData = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => {
      const category = tx.category || t('finance.uncategorized');
      acc[category] = (acc[category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
    
  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }));
  
  // Daily breakdown
  const dailyData = transactions.reduce((acc, tx) => {
    const day = format(new Date(tx.date), 'd');
    if (!acc[day]) {
      acc[day] = { day, income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      acc[day].income += tx.amount;
    } else {
      acc[day].expense += tx.amount;
    }
    return acc;
  }, {} as Record<string, { day: string; income: number; expense: number }>);
  
  const barData = Object.values(dailyData).sort((a, b) => parseInt(a.day) - parseInt(b.day));
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => direction === 'prev' ? subMonths(prev, 1) : subMonths(prev, -1));
  };
  
  const exportReport = () => {
    const reportData = {
      month: format(selectedMonth, 'MMMM yyyy', { locale }),
      summary: { income, expenses, balance, savingsRate },
      categoryBreakdown: categoryData,
      transactions: transactions.map(tx => ({
        date: tx.date,
        description: tx.description,
        category: tx.category,
        type: tx.type,
        amount: tx.amount,
      })),
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${format(selectedMonth, 'yyyy-MM')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('finance.monthlyReport')}</h3>
            <p className="text-sm text-muted-foreground">{t('finance.monthlyReportDesc')}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportReport}>
          <Download className="w-4 h-4 me-2" />
          {t('common.export')}
        </Button>
      </div>
      
      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-lg font-semibold text-foreground min-w-[150px] text-center">
          {format(selectedMonth, 'MMMM yyyy', { locale })}
        </span>
        <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">{t('finance.monthlyIncome')}</span>
          </div>
          <p className="text-xl font-bold text-success">{income.toLocaleString()} SAR</p>
        </div>
        
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-sm text-muted-foreground">{t('finance.monthlyExpenses')}</span>
          </div>
          <p className="text-xl font-bold text-destructive">{expenses.toLocaleString()} SAR</p>
        </div>
        
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">{t('finance.balance')}</span>
          </div>
          <p className={cn('text-xl font-bold', balance >= 0 ? 'text-success' : 'text-destructive')}>
            {balance.toLocaleString()} SAR
          </p>
        </div>
        
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">{t('finance.savingsRate')}</span>
          </div>
          <p className={cn('text-xl font-bold', savingsRate >= 20 ? 'text-success' : 'text-destructive')}>
            {savingsRate}%
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <h4 className="text-sm font-medium text-foreground mb-4">{t('finance.dailyBreakdown')}</h4>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
          )}
        </div>
        
        {/* Category Breakdown */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <h4 className="text-sm font-medium text-foreground mb-4">{t('finance.categoryBreakdown')}</h4>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
          )}
          
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
