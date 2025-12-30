import { useState, useMemo } from 'react';
import { 
  Plus, Wallet, Target, TrendingUp, AlertTriangle,
  ChevronRight, Loader2, Edit, Trash2, Calculator, MoreVertical
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useMonthlyStats, useTransactions } from '@/hooks/useFinance';
import { useEnvelopes, useCreateEnvelope, useUpdateEnvelope, useSinkingFunds, useCreateSinkingFund, useUpdateSinkingFund, useCategories, Envelope, SinkingFund } from '@/hooks/useAdvancedFinance';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget, useBudgetLines, useCreateBudgetLine, useUpdateBudgetLine, useDeleteBudgetLine, Budget } from '@/hooks/useBudgets';
import { useDeleteEnvelope, useDeleteSinkingFund } from '@/hooks/useBudgetMutations';
import { toast } from 'sonner';
import { format, differenceInMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function BudgetManager() {
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage;
  const locale = language === 'ar' ? ar : enUS;

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: monthlyStats } = useMonthlyStats();
  const { data: transactions } = useTransactions();
  const { data: envelopes, isLoading: envelopesLoading } = useEnvelopes();
  const { data: sinkingFunds, isLoading: fundsLoading } = useSinkingFunds();
  const { data: categories } = useCategories();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets(selectedMonth, selectedYear);
  
  const createEnvelope = useCreateEnvelope();
  const updateEnvelope = useUpdateEnvelope();
  const deleteEnvelope = useDeleteEnvelope();
  const createSinkingFund = useCreateSinkingFund();
  const updateSinkingFund = useUpdateSinkingFund();
  const deleteSinkingFund = useDeleteSinkingFund();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  const createBudgetLine = useCreateBudgetLine();
  const updateBudgetLine = useUpdateBudgetLine();
  const deleteBudgetLine = useDeleteBudgetLine();

  const [activeTab, setActiveTab] = useState('budgets');
  const [isEnvelopeDialogOpen, setIsEnvelopeDialogOpen] = useState(false);
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isEditBudgetDialogOpen, setIsEditBudgetDialogOpen] = useState(false);
  const [isEditEnvelopeDialogOpen, setIsEditEnvelopeDialogOpen] = useState(false);
  const [isEditFundDialogOpen, setIsEditFundDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(null);
  const [selectedFund, setSelectedFund] = useState<SinkingFund | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'envelope' | 'fund' | 'budget'; id: string } | null>(null);

  const { data: budgetLines } = useBudgetLines(selectedBudget?.id || null);

  const [newEnvelope, setNewEnvelope] = useState({
    name: '',
    target_amount: '',
    color: '#10b981',
  });

  const [newFund, setNewFund] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    monthly_contribution: '',
  });

  const [newBudget, setNewBudget] = useState({
    category: '',
    limit_amount: '',
    notes: '',
  });

  // Calculate category spending
  const categorySpending = useMemo(() => {
    if (!transactions) return [];
    
    const spending: Record<string, number> = {};
    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const cat = tx.category || 'Uncategorized';
        spending[cat] = (spending[cat] || 0) + tx.amount;
      });

    return Object.entries(spending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // ZBB Budget - all income should be assigned
  const totalIncome = monthlyStats?.monthlyIncome || 0;
  const totalAssigned = envelopes?.reduce((sum, e) => sum + (e.target_amount || 0), 0) || 0;
  const unassigned = totalIncome - totalAssigned;

  // Runway calculation
  const monthlyExpenses = monthlyStats?.monthlyExpenses || 1;
  const totalCash = monthlyStats?.netWorth || 0;
  const runwayMonths = Math.floor(totalCash / monthlyExpenses);

  // Budget totals
  const totalBudgeted = budgets?.reduce((sum, b) => sum + b.limit_amount, 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + (b.spent_amount || 0), 0) || 0;

  const handleCreateEnvelope = async () => {
    if (!newEnvelope.name) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createEnvelope.mutateAsync({
        name: newEnvelope.name,
        target_amount: parseFloat(newEnvelope.target_amount) || 0,
        color: newEnvelope.color,
        available_amount: 0,
      });
      toast.success(language === 'ar' ? 'تم إنشاء المظروف' : 'Envelope created');
      setIsEnvelopeDialogOpen(false);
      setNewEnvelope({ name: '', target_amount: '', color: '#10b981' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleCreateFund = async () => {
    if (!newFund.name || !newFund.target_amount) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    let monthlyContribution = parseFloat(newFund.monthly_contribution) || 0;
    if (newFund.target_date && !newFund.monthly_contribution) {
      const months = differenceInMonths(new Date(newFund.target_date), new Date());
      if (months > 0) {
        monthlyContribution = parseFloat(newFund.target_amount) / months;
      }
    }

    try {
      await createSinkingFund.mutateAsync({
        name: newFund.name,
        target_amount: parseFloat(newFund.target_amount),
        target_date: newFund.target_date || null,
        monthly_contribution: monthlyContribution,
        current_amount: 0,
        is_active: true,
      });
      toast.success(language === 'ar' ? 'تم إنشاء صندوق الادخار' : 'Sinking fund created');
      setIsFundDialogOpen(false);
      setNewFund({ name: '', target_amount: '', target_date: '', monthly_contribution: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleCreateBudget = async () => {
    if (!newBudget.category || !newBudget.limit_amount) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createBudget.mutateAsync({
        category: newBudget.category,
        limit_amount: parseFloat(newBudget.limit_amount),
        month: selectedMonth,
        year: selectedYear,
        status: 'active',
        notes: newBudget.notes || undefined,
      });
      toast.success(language === 'ar' ? 'تم إنشاء الميزانية' : 'Budget created');
      setIsBudgetDialogOpen(false);
      setNewBudget({ category: '', limit_amount: '', notes: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateBudget = async () => {
    if (!selectedBudget) return;

    try {
      await updateBudget.mutateAsync({
        id: selectedBudget.id,
        category: newBudget.category || selectedBudget.category,
        limit_amount: parseFloat(newBudget.limit_amount) || selectedBudget.limit_amount,
        notes: newBudget.notes,
      });
      toast.success(language === 'ar' ? 'تم تحديث الميزانية' : 'Budget updated');
      setIsEditBudgetDialogOpen(false);
      setSelectedBudget(null);
      setNewBudget({ category: '', limit_amount: '', notes: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await deleteBudget.mutateAsync(budgetId);
      toast.success(language === 'ar' ? 'تم حذف الميزانية' : 'Budget deleted');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteEnvelope = async (id: string) => {
    try {
      await deleteEnvelope.mutateAsync(id);
      toast.success(language === 'ar' ? 'تم حذف المظروف' : 'Envelope deleted');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteFund = async (id: string) => {
    try {
      await deleteSinkingFund.mutateAsync(id);
      toast.success(language === 'ar' ? 'تم حذف صندوق الادخار' : 'Sinking fund deleted');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateEnvelope = async () => {
    if (!selectedEnvelope) return;
    try {
      await updateEnvelope.mutateAsync({
        id: selectedEnvelope.id,
        name: newEnvelope.name,
        target_amount: parseFloat(newEnvelope.target_amount) || 0,
        color: newEnvelope.color,
      });
      toast.success(language === 'ar' ? 'تم تحديث المظروف' : 'Envelope updated');
      setIsEditEnvelopeDialogOpen(false);
      setSelectedEnvelope(null);
      setNewEnvelope({ name: '', target_amount: '', color: '#10b981' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateFund = async () => {
    if (!selectedFund) return;
    try {
      await updateSinkingFund.mutateAsync({
        id: selectedFund.id,
        name: newFund.name,
        target_amount: parseFloat(newFund.target_amount),
        target_date: newFund.target_date || null,
        monthly_contribution: parseFloat(newFund.monthly_contribution) || 0,
      });
      toast.success(language === 'ar' ? 'تم تحديث صندوق الادخار' : 'Sinking fund updated');
      setIsEditFundDialogOpen(false);
      setSelectedFund(null);
      setNewFund({ name: '', target_amount: '', target_date: '', monthly_contribution: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const openEditEnvelope = (envelope: Envelope) => {
    setSelectedEnvelope(envelope);
    setNewEnvelope({
      name: envelope.name,
      target_amount: (envelope.target_amount || 0).toString(),
      color: envelope.color || '#10b981',
    });
    setIsEditEnvelopeDialogOpen(true);
  };

  const openEditFund = (fund: SinkingFund) => {
    setSelectedFund(fund);
    setNewFund({
      name: fund.name,
      target_amount: fund.target_amount.toString(),
      target_date: fund.target_date || '',
      monthly_contribution: (fund.monthly_contribution || 0).toString(),
    });
    setIsEditFundDialogOpen(true);
  };

  const handleAddToEnvelope = async (id: string, amount: number) => {
    const envelope = envelopes?.find(e => e.id === id);
    if (!envelope) return;

    try {
      await updateEnvelope.mutateAsync({
        id,
        available_amount: (envelope.available_amount || 0) + amount,
      });
      toast.success(language === 'ar' ? 'تم التحديث' : 'Updated');
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleAddToFund = async (id: string, amount: number) => {
    const fund = sinkingFunds?.find(f => f.id === id);
    if (!fund) return;

    try {
      await updateSinkingFund.mutateAsync({
        id,
        current_amount: (fund.current_amount || 0) + amount,
      });
      toast.success(language === 'ar' ? 'تم التحديث' : 'Updated');
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const openEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setNewBudget({
      category: budget.category,
      limit_amount: budget.limit_amount.toString(),
      notes: budget.notes || '',
    });
    setIsEditBudgetDialogOpen(true);
  };

  const isLoading = envelopesLoading || fundsLoading || budgetsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const months = [
    { value: 1, label: language === 'ar' ? 'يناير' : 'January' },
    { value: 2, label: language === 'ar' ? 'فبراير' : 'February' },
    { value: 3, label: language === 'ar' ? 'مارس' : 'March' },
    { value: 4, label: language === 'ar' ? 'أبريل' : 'April' },
    { value: 5, label: language === 'ar' ? 'مايو' : 'May' },
    { value: 6, label: language === 'ar' ? 'يونيو' : 'June' },
    { value: 7, label: language === 'ar' ? 'يوليو' : 'July' },
    { value: 8, label: language === 'ar' ? 'أغسطس' : 'August' },
    { value: 9, label: language === 'ar' ? 'سبتمبر' : 'September' },
    { value: 10, label: language === 'ar' ? 'أكتوبر' : 'October' },
    { value: 11, label: language === 'ar' ? 'نوفمبر' : 'November' },
    { value: 12, label: language === 'ar' ? 'ديسمبر' : 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{language === 'ar' ? 'الميزانية' : 'Budget'}</h2>
          <p className="text-muted-foreground">{format(new Date(), 'MMMM yyyy', { locale })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ZBB Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الدخل الشهري' : 'Monthly Income'}</p>
          <p className="text-2xl font-bold text-success">+{totalIncome.toLocaleString()} SAR</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الميزانية' : 'Total Budgeted'}</p>
          <p className="text-2xl font-bold">{totalBudgeted.toLocaleString()} SAR</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المنفق' : 'Spent'}</p>
          <p className={cn(
            'text-2xl font-bold',
            totalSpent > totalBudgeted ? 'text-destructive' : 'text-foreground'
          )}>
            {totalSpent.toLocaleString()} SAR
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المتبقي' : 'Remaining'}</p>
          <p className={cn(
            'text-2xl font-bold',
            totalBudgeted - totalSpent >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {(totalBudgeted - totalSpent).toLocaleString()} SAR
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="budgets">{language === 'ar' ? 'الميزانيات' : 'Budgets'}</TabsTrigger>
          <TabsTrigger value="envelopes">{language === 'ar' ? 'المظاريف' : 'Envelopes'}</TabsTrigger>
          <TabsTrigger value="sinkingFunds">{language === 'ar' ? 'صناديق الادخار' : 'Sinking Funds'}</TabsTrigger>
          <TabsTrigger value="forecast">{language === 'ar' ? 'التوقعات' : 'Forecast'}</TabsTrigger>
        </TabsList>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold">
                  <Plus className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'إنشاء ميزانية' : 'Create Budget'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === 'ar' ? 'إنشاء ميزانية جديدة' : 'Create New Budget'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                    <Input
                      placeholder={language === 'ar' ? 'مثال: الطعام، المواصلات...' : 'e.g., Food, Transport...'}
                      value={newBudget.category}
                      onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'الحد الأقصى' : 'Limit Amount'}</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newBudget.limit_amount}
                      onChange={(e) => setNewBudget({ ...newBudget, limit_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                    <Textarea
                      placeholder={language === 'ar' ? 'ملاحظات اختيارية...' : 'Optional notes...'}
                      value={newBudget.notes}
                      onChange={(e) => setNewBudget({ ...newBudget, notes: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateBudget} className="w-full" disabled={createBudget.isPending}>
                    {createBudget.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'إنشاء' : 'Create')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {budgets?.map((budget) => {
              const spent = budget.spent_amount || 0;
              const percentage = budget.limit_amount > 0 ? (spent / budget.limit_amount) * 100 : 0;
              const isOver = spent > budget.limit_amount;
              const remaining = budget.limit_amount - spent;

              return (
                <div key={budget.id} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{budget.category}</h4>
                      {budget.notes && (
                        <p className="text-sm text-muted-foreground">{budget.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        budget.status === 'active' ? 'bg-success/20 text-success' :
                        budget.status === 'closed' ? 'bg-muted text-muted-foreground' :
                        'bg-warning/20 text-warning'
                      )}>
                        {budget.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
                         budget.status === 'closed' ? (language === 'ar' ? 'مغلق' : 'Closed') :
                         (language === 'ar' ? 'مسودة' : 'Draft')}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => openEditBudget(budget)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBudget(budget.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={cn('h-3 mb-2', isOver && '[&>div]:bg-destructive')}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {spent.toLocaleString()} / {budget.limit_amount.toLocaleString()} SAR
                    </span>
                    <span className={cn(
                      'font-medium',
                      remaining >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {remaining >= 0 ? '+' : ''}{remaining.toLocaleString()} SAR {language === 'ar' ? 'متبقي' : 'remaining'}
                    </span>
                  </div>
                </div>
              );
            })}

            {(!budgets || budgets.length === 0) && (
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد ميزانيات لهذا الشهر' : 'No budgets for this month'}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsBudgetDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'إنشاء ميزانية' : 'Create Budget'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Envelopes */}
        <TabsContent value="envelopes" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Dialog open={isEnvelopeDialogOpen} onOpenChange={setIsEnvelopeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold">
                  <Plus className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'إنشاء مظروف' : 'Create Envelope'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === 'ar' ? 'إنشاء مظروف جديد' : 'Create New Envelope'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                    <Input
                      placeholder={language === 'ar' ? 'اسم المظروف' : 'Envelope name'}
                      value={newEnvelope.name}
                      onChange={(e) => setNewEnvelope({ ...newEnvelope, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'المبلغ المستهدف' : 'Target Amount'}</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newEnvelope.target_amount}
                      onChange={(e) => setNewEnvelope({ ...newEnvelope, target_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'اللون' : 'Color'}</Label>
                    <Input
                      type="color"
                      value={newEnvelope.color}
                      onChange={(e) => setNewEnvelope({ ...newEnvelope, color: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateEnvelope} className="w-full" disabled={createEnvelope.isPending}>
                    {createEnvelope.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'إنشاء' : 'Create')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {envelopes?.map((envelope) => {
              const available = envelope.available_amount || 0;
              const target = envelope.target_amount || 0;
              const percentage = target > 0 ? (available / target) * 100 : 0;

              return (
                <div 
                  key={envelope.id} 
                  className="glass-card p-5 group"
                  style={{ borderTopColor: envelope.color || '#10b981', borderTopWidth: '3px' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{envelope.name}</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditEnvelope(envelope)}>
                          <Edit className="w-4 h-4 me-2" />
                          {language === 'ar' ? 'تعديل' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteConfirm({ type: 'envelope', id: envelope.id })}
                        >
                          <Trash2 className="w-4 h-4 me-2" />
                          {language === 'ar' ? 'حذف' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{language === 'ar' ? 'متاح' : 'Available'}</span>
                      <span className="font-bold">{available.toLocaleString()} SAR</span>
                    </div>
                    {target > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{language === 'ar' ? 'الهدف' : 'Target'}</span>
                        <span>{target.toLocaleString()} SAR</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleAddToEnvelope(envelope.id, 100)}
                    >
                      +100
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleAddToEnvelope(envelope.id, 500)}
                    >
                      +500
                    </Button>
                  </div>
                </div>
              );
            })}

            {(!envelopes || envelopes.length === 0) && (
              <div className="col-span-full text-center py-12">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد مظاريف' : 'No envelopes'}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Sinking Funds */}
        <TabsContent value="sinkingFunds" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold">
                  <Plus className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'إنشاء صندوق ادخار' : 'Create Sinking Fund'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === 'ar' ? 'إنشاء صندوق ادخار جديد' : 'Create New Sinking Fund'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                    <Input
                      placeholder={language === 'ar' ? 'اسم الصندوق' : 'Fund name'}
                      value={newFund.name}
                      onChange={(e) => setNewFund({ ...newFund, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'المبلغ المستهدف' : 'Target Amount'}</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newFund.target_amount}
                      onChange={(e) => setNewFund({ ...newFund, target_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'تاريخ الهدف' : 'Target Date'}</Label>
                    <Input
                      type="date"
                      value={newFund.target_date}
                      onChange={(e) => setNewFund({ ...newFund, target_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'المساهمة الشهرية' : 'Monthly Contribution'}</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newFund.monthly_contribution}
                      onChange={(e) => setNewFund({ ...newFund, monthly_contribution: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateFund} className="w-full" disabled={createSinkingFund.isPending}>
                    {createSinkingFund.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'إنشاء' : 'Create')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sinkingFunds?.map((fund) => {
              const current = fund.current_amount || 0;
              const target = fund.target_amount;
              const percentage = (current / target) * 100;
              const remaining = target - current;
              const monthsLeft = fund.target_date 
                ? differenceInMonths(new Date(fund.target_date), new Date())
                : null;
              const onTrack = monthsLeft && fund.monthly_contribution 
                ? remaining <= fund.monthly_contribution * monthsLeft
                : true;

              return (
                <div key={fund.id} className="glass-card p-5 group">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{fund.name}</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditFund(fund)}>
                          <Edit className="w-4 h-4 me-2" />
                          {language === 'ar' ? 'تعديل' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteConfirm({ type: 'fund', id: fund.id })}
                        >
                          <Trash2 className="w-4 h-4 me-2" />
                          {language === 'ar' ? 'حذف' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-3">
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={cn('h-3', !onTrack && '[&>div]:bg-warning')}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{current.toLocaleString()} SAR</span>
                      <span className="text-muted-foreground">/ {target.toLocaleString()} SAR</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">{language === 'ar' ? 'المتبقي' : 'Remaining'}</p>
                        <p className="font-medium">{remaining.toLocaleString()} SAR</p>
                      </div>
                      {monthsLeft !== null && (
                        <div>
                          <p className="text-muted-foreground">{language === 'ar' ? 'الأشهر المتبقية' : 'Months Left'}</p>
                          <p className="font-medium">{monthsLeft}</p>
                        </div>
                      )}
                    </div>
                    {!onTrack && (
                      <div className="flex items-center gap-2 text-warning text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{language === 'ar' ? 'متأخر عن الجدول' : 'Behind schedule'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleAddToFund(fund.id, 100)}
                    >
                      +100
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleAddToFund(fund.id, 500)}
                    >
                      +500
                    </Button>
                  </div>
                </div>
              );
            })}

            {(!sinkingFunds || sinkingFunds.length === 0) && (
              <div className="col-span-full text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد صناديق ادخار' : 'No sinking funds'}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Forecast */}
        <TabsContent value="forecast" className="space-y-6 mt-6">
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">{language === 'ar' ? 'توقعات 12 شهر' : '12-Month Forecast'}</h3>
            <div className="space-y-4">
              {Array.from({ length: 12 }, (_, i) => {
                const forecastDate = new Date(selectedYear, selectedMonth - 1 + i, 1);
                const projectedIncome = totalIncome;
                const projectedExpenses = monthlyExpenses;
                const projectedNet = projectedIncome - projectedExpenses;

                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="font-medium">{format(forecastDate, 'MMMM yyyy', { locale })}</span>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-success">+{projectedIncome.toLocaleString()}</span>
                      <span className="text-destructive">-{projectedExpenses.toLocaleString()}</span>
                      <span className={cn(
                        'font-bold',
                        projectedNet >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {projectedNet >= 0 ? '+' : ''}{projectedNet.toLocaleString()} SAR
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Budget Dialog */}
      <Dialog open={isEditBudgetDialogOpen} onOpenChange={setIsEditBudgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل الميزانية' : 'Edit Budget'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
              <Input
                value={newBudget.category}
                onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الحد الأقصى' : 'Limit Amount'}</Label>
              <Input
                type="number"
                value={newBudget.limit_amount}
                onChange={(e) => setNewBudget({ ...newBudget, limit_amount: e.target.value })}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea
                value={newBudget.notes}
                onChange={(e) => setNewBudget({ ...newBudget, notes: e.target.value })}
              />
            </div>
            <Button onClick={handleUpdateBudget} className="w-full" disabled={updateBudget.isPending}>
              {updateBudget.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Envelope Dialog */}
      <Dialog open={isEditEnvelopeDialogOpen} onOpenChange={setIsEditEnvelopeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل المظروف' : 'Edit Envelope'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
              <Input
                value={newEnvelope.name}
                onChange={(e) => setNewEnvelope({ ...newEnvelope, name: e.target.value })}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'المبلغ المستهدف' : 'Target Amount'}</Label>
              <Input
                type="number"
                value={newEnvelope.target_amount}
                onChange={(e) => setNewEnvelope({ ...newEnvelope, target_amount: e.target.value })}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'اللون' : 'Color'}</Label>
              <Input
                type="color"
                value={newEnvelope.color}
                onChange={(e) => setNewEnvelope({ ...newEnvelope, color: e.target.value })}
              />
            </div>
            <Button onClick={handleUpdateEnvelope} className="w-full" disabled={updateEnvelope.isPending}>
              {updateEnvelope.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sinking Fund Dialog */}
      <Dialog open={isEditFundDialogOpen} onOpenChange={setIsEditFundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل صندوق الادخار' : 'Edit Sinking Fund'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
              <Input
                value={newFund.name}
                onChange={(e) => setNewFund({ ...newFund, name: e.target.value })}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'المبلغ المستهدف' : 'Target Amount'}</Label>
              <Input
                type="number"
                value={newFund.target_amount}
                onChange={(e) => setNewFund({ ...newFund, target_amount: e.target.value })}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'تاريخ الهدف' : 'Target Date'}</Label>
              <Input
                type="date"
                value={newFund.target_date}
                onChange={(e) => setNewFund({ ...newFund, target_date: e.target.value })}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'المساهمة الشهرية' : 'Monthly Contribution'}</Label>
              <Input
                type="number"
                value={newFund.monthly_contribution}
                onChange={(e) => setNewFund({ ...newFund, monthly_contribution: e.target.value })}
              />
            </div>
            <Button onClick={handleUpdateFund} className="w-full" disabled={updateSinkingFund.isPending}>
              {updateSinkingFund.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this item? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === 'envelope') {
                  handleDeleteEnvelope(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'fund') {
                  handleDeleteFund(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'budget') {
                  handleDeleteBudget(deleteConfirm.id);
                }
              }}
            >
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
