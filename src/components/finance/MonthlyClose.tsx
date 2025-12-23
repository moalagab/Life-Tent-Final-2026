import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lock, Unlock, Calendar, CheckCircle, AlertTriangle, 
  Loader2, FileText, TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions, useMonthlyStats } from '@/hooks/useFinance';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface ClosedPeriod {
  id: string;
  month: number;
  year: number;
  closed_at: string;
  closed_by: string;
  notes?: string;
  income_total: number;
  expense_total: number;
  net_total: number;
}

export function MonthlyClose() {
  const { currentLanguage } = useLanguage();
  const language = currentLanguage;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: transactions } = useTransactions(1000);
  const { data: monthlyStats } = useMonthlyStats();

  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [closeNotes, setCloseNotes] = useState('');
  const [periodToReopen, setPeriodToReopen] = useState<ClosedPeriod | null>(null);

  // Fetch closed periods from budgets table (using status = 'closed')
  const { data: closedPeriods, isLoading } = useQuery({
    queryKey: ['closed-periods', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('status', 'closed')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) throw error;
      
      // Transform to ClosedPeriod format
      return data.map(b => ({
        id: b.id,
        month: b.month,
        year: b.year,
        closed_at: b.closed_at || b.updated_at,
        closed_by: b.user_id,
        notes: b.notes,
        income_total: 0, // Will be calculated
        expense_total: b.spent_amount || 0,
        net_total: (b.limit_amount || 0) - (b.spent_amount || 0),
      })) as ClosedPeriod[];
    },
    enabled: !!user,
  });

  // Check if a period is closed
  const isPeriodClosed = (month: number, year: number) => {
    return closedPeriods?.some(p => p.month === month && p.year === year);
  };

  // Calculate period stats
  const calculatePeriodStats = (month: number, year: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = endOfMonth(monthStart);

    const periodTransactions = transactions?.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= monthStart && txDate <= monthEnd;
    }) || [];

    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      net: income - expenses,
      transactionCount: periodTransactions.length,
    };
  };

  // Close period mutation
  const closePeriodMutation = useMutation({
    mutationFn: async ({ month, year, notes }: { month: number; year: number; notes: string }) => {
      const stats = calculatePeriodStats(month, year);
      
      // Create or update budget with closed status
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('month', month)
        .eq('year', year)
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('budgets')
          .update({
            status: 'closed' as const,
            closed_at: new Date().toISOString(),
            notes,
            spent_amount: stats.expenses,
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert({
            user_id: user!.id,
            month,
            year,
            category: 'monthly_close',
            limit_amount: stats.income,
            spent_amount: stats.expenses,
            status: 'closed' as const,
            closed_at: new Date().toISOString(),
            notes,
          });
        
        if (error) throw error;
      }

      // Mark transactions as reconciled
      const monthStart = new Date(year, month, 1);
      const monthEnd = endOfMonth(monthStart);
      
      await supabase
        .from('transactions')
        .update({ 
          is_reconciled: true,
          reconciled_at: new Date().toISOString(),
        })
        .gte('date', monthStart.toISOString().split('T')[0])
        .lte('date', monthEnd.toISOString().split('T')[0])
        .eq('user_id', user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closed-periods'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(language === 'ar' ? 'تم إقفال الفترة بنجاح' : 'Period closed successfully');
      setIsCloseDialogOpen(false);
      setCloseNotes('');
    },
    onError: () => {
      toast.error(language === 'ar' ? 'فشل في إقفال الفترة' : 'Failed to close period');
    },
  });

  // Reopen period mutation
  const reopenPeriodMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const { error } = await supabase
        .from('budgets')
        .update({
          status: 'active' as const,
          closed_at: null,
        })
        .eq('id', periodId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closed-periods'] });
      toast.success(language === 'ar' ? 'تم فتح الفترة' : 'Period reopened');
      setIsReopenDialogOpen(false);
      setPeriodToReopen(null);
    },
  });

  // Generate last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      month: date.getMonth(),
      year: date.getFullYear(),
      label: format(date, 'MMMM yyyy'),
    };
  });

  const currentPeriodStats = calculatePeriodStats(selectedMonth, selectedYear);

  if (isLoading) {
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
            {language === 'ar' ? 'الإقفال الشهري' : 'Monthly Close'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إقفال الفترات المحاسبية وتجميد العمليات' : 'Close accounting periods and lock transactions'}
          </p>
        </div>
        <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Lock className="w-4 h-4 me-2" />
              {language === 'ar' ? 'إقفال فترة' : 'Close Period'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إقفال فترة محاسبية' : 'Close Accounting Period'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'الشهر' : 'Month'}
                  </label>
                  <Select 
                    value={selectedMonth.toString()} 
                    onValueChange={(v) => setSelectedMonth(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {format(new Date(2024, i, 1), 'MMMM')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'السنة' : 'Year'}
                  </label>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isPeriodClosed(selectedMonth, selectedYear) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {language === 'ar' ? 'هذه الفترة مقفلة بالفعل' : 'This period is already closed'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Period Summary */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                <p className="font-medium text-foreground">
                  {language === 'ar' ? 'ملخص الفترة' : 'Period Summary'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الدخل' : 'Income'}</p>
                    <p className="text-lg font-semibold text-success">
                      +{currentPeriodStats.income.toLocaleString()} SAR
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المصروفات' : 'Expenses'}</p>
                    <p className="text-lg font-semibold text-destructive">
                      -{currentPeriodStats.expenses.toLocaleString()} SAR
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الصافي' : 'Net'}</p>
                  <p className={cn(
                    "text-xl font-bold",
                    currentPeriodStats.net >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {currentPeriodStats.net >= 0 ? '+' : ''}{currentPeriodStats.net.toLocaleString()} SAR
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentPeriodStats.transactionCount} {language === 'ar' ? 'عملية' : 'transactions'}
                </p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                </label>
                <Textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'أي ملاحظات عن هذه الفترة...' : 'Any notes about this period...'}
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'ar' 
                    ? 'سيتم تجميد جميع العمليات في هذه الفترة ولن يمكن تعديلها'
                    : 'All transactions in this period will be locked and cannot be modified'
                  }
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => closePeriodMutation.mutate({ 
                  month: selectedMonth, 
                  year: selectedYear, 
                  notes: closeNotes 
                })}
                disabled={closePeriodMutation.isPending || isPeriodClosed(selectedMonth, selectedYear)}
              >
                {closePeriodMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'إقفال الفترة' : 'Close Period'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Period Status Timeline */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {language === 'ar' ? 'حالة الفترات' : 'Period Status'}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {months.map(({ month, year, label }) => {
              const isClosed = isPeriodClosed(month, year);
              const stats = calculatePeriodStats(month, year);
              const isCurrentMonth = month === new Date().getMonth() && year === new Date().getFullYear();
              
              return (
                <div 
                  key={`${month}-${year}`}
                  className={cn(
                    "p-4 rounded-xl border text-center transition-colors",
                    isClosed 
                      ? "bg-success/10 border-success/30" 
                      : isCurrentMonth
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/30 border-border"
                  )}
                >
                  <div className="flex items-center justify-center mb-2">
                    {isClosed ? (
                      <Lock className="w-5 h-5 text-success" />
                    ) : (
                      <Unlock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-medium text-foreground text-sm">{label}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    stats.net >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {stats.net >= 0 ? '+' : ''}{stats.net.toLocaleString()}
                  </p>
                  {isClosed && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {language === 'ar' ? 'مقفل' : 'Closed'}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Closed Periods List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {language === 'ar' ? 'الفترات المقفلة' : 'Closed Periods'}
            </div>
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'سجل الإقفالات السابقة' : 'History of closed periods'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {closedPeriods && closedPeriods.length > 0 ? (
            <div className="space-y-3">
              {closedPeriods.map(period => (
                <div 
                  key={period.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {format(new Date(period.year, period.month, 1), 'MMMM yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'تم الإقفال' : 'Closed'}: {format(new Date(period.closed_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p className={cn(
                        "font-semibold",
                        period.net_total >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {period.net_total >= 0 ? '+' : ''}{period.net_total.toLocaleString()} SAR
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setPeriodToReopen(period);
                        setIsReopenDialogOpen(true);
                      }}
                    >
                      <Unlock className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد فترات مقفلة' : 'No closed periods'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reopen Dialog */}
      <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'فتح فترة مقفلة' : 'Reopen Closed Period'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {language === 'ar' 
                  ? 'هل أنت متأكد من فتح هذه الفترة؟ سيتم السماح بتعديل العمليات فيها.'
                  : 'Are you sure you want to reopen this period? Transactions will become editable.'
                }
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReopenDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => periodToReopen && reopenPeriodMutation.mutate(periodToReopen.id)}
              disabled={reopenPeriodMutation.isPending}
            >
              {reopenPeriodMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Unlock className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'فتح الفترة' : 'Reopen Period'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
