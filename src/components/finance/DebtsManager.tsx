import { useState, useMemo } from 'react';
import { 
  CreditCard, Plus, TrendingDown, Calendar, AlertTriangle,
  Calculator, Loader2, MoreVertical, Target, ArrowRight, Edit, Trash2,
  ArrowUpRight, ArrowDownRight, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useDebts, useCreateDebt, useUpdateDebt, useDebtSchedules, Debt } from '@/hooks/useAdvancedFinance';
import { toast } from 'sonner';
import { format, addMonths, differenceInMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function DebtsManager() {
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage;
  const locale = language === 'ar' ? ar : enUS;

  const { data: debts, isLoading } = useDebts();
  const { data: schedules } = useDebtSchedules();
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStrategy, setSelectedStrategy] = useState<'snowball' | 'avalanche'>('avalanche');
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const [newDebt, setNewDebt] = useState({
    name: '',
    lender: '',
    total_amount: '',
    remaining_amount: '',
    interest_rate: '',
    minimum_payment: '',
    monthly_payment: '',
    monthly_payment_date: '1',
    start_date: '',
    end_date: '',
    currency: 'SAR',
    debt_type: 'from_me' as 'to_me' | 'from_me',
    notes: '',
  });

  const activeDebts = debts?.filter(d => d.status === 'active') || [];
  const debtsToMe = activeDebts.filter(d => (d as any).debt_type === 'to_me');
  const debtsFromMe = activeDebts.filter(d => (d as any).debt_type !== 'to_me');
  
  const totalDebt = debtsFromMe.reduce((sum, d) => sum + (d.remaining_amount || 0), 0);
  const totalOwedToMe = debtsToMe.reduce((sum, d) => sum + (d.remaining_amount || 0), 0);
  const totalMinPayment = activeDebts.reduce((sum, d) => sum + (d.minimum_payment || 0), 0);
  const weightedAvgRate = activeDebts.length > 0
    ? activeDebts.reduce((sum, d) => sum + (d.interest_rate || 0) * (d.remaining_amount || 0), 0) / (totalDebt + totalOwedToMe || 1)
    : 0;

  // Calculate payoff plans
  const snowballOrder = useMemo(() => {
    return [...debtsFromMe].sort((a, b) => (a.remaining_amount || 0) - (b.remaining_amount || 0));
  }, [debtsFromMe]);

  const avalancheOrder = useMemo(() => {
    return [...debtsFromMe].sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0));
  }, [debtsFromMe]);

  const calculatePayoffDate = (debt: Debt, extraPayment: number = 0) => {
    const balance = debt.remaining_amount || 0;
    const rate = (debt.interest_rate || 0) / 100 / 12;
    const payment = (debt.minimum_payment || 0) + extraPayment;

    if (payment <= 0 || balance <= 0) return null;

    if (rate === 0) {
      return Math.ceil(balance / payment);
    }

    const months = Math.log(payment / (payment - balance * rate)) / Math.log(1 + rate);
    return Math.ceil(months);
  };

  const calculateTotalInterest = (debt: Debt, months: number) => {
    const balance = debt.remaining_amount || 0;
    const rate = (debt.interest_rate || 0) / 100 / 12;
    const payment = debt.minimum_payment || 0;
    
    let remaining = balance;
    let totalInterest = 0;
    
    for (let i = 0; i < months && remaining > 0; i++) {
      const interest = remaining * rate;
      totalInterest += interest;
      remaining = remaining + interest - payment;
    }
    
    return Math.max(0, totalInterest);
  };

  const handleCreateDebt = async () => {
    if (!newDebt.name || !newDebt.total_amount) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createDebt.mutateAsync({
        name: newDebt.name,
        lender: newDebt.lender || null,
        total_amount: parseFloat(newDebt.total_amount),
        remaining_amount: parseFloat(newDebt.remaining_amount) || parseFloat(newDebt.total_amount),
        interest_rate: parseFloat(newDebt.interest_rate) || 0,
        minimum_payment: parseFloat(newDebt.minimum_payment) || null,
        monthly_payment: parseFloat(newDebt.monthly_payment) || parseFloat(newDebt.minimum_payment) || null,
        monthly_payment_date: parseInt(newDebt.monthly_payment_date) || 1,
        start_date: newDebt.start_date || null,
        end_date: newDebt.end_date || null,
        currency: newDebt.currency,
        status: 'active',
        notes: `${newDebt.debt_type}|${newDebt.notes}`,
      });
      toast.success(t('finance.debtAdded'));
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateDebt = async () => {
    if (!editingDebt) return;

    try {
      await updateDebt.mutateAsync({
        id: editingDebt.id,
        name: newDebt.name || editingDebt.name,
        lender: newDebt.lender || editingDebt.lender,
        total_amount: newDebt.total_amount ? parseFloat(newDebt.total_amount) : editingDebt.total_amount,
        remaining_amount: newDebt.remaining_amount ? parseFloat(newDebt.remaining_amount) : editingDebt.remaining_amount,
        interest_rate: newDebt.interest_rate ? parseFloat(newDebt.interest_rate) : editingDebt.interest_rate,
        minimum_payment: newDebt.minimum_payment ? parseFloat(newDebt.minimum_payment) : editingDebt.minimum_payment,
        monthly_payment: newDebt.monthly_payment ? parseFloat(newDebt.monthly_payment) : editingDebt.monthly_payment,
        monthly_payment_date: newDebt.monthly_payment_date ? parseInt(newDebt.monthly_payment_date) : editingDebt.monthly_payment_date,
        start_date: newDebt.start_date || editingDebt.start_date,
        end_date: newDebt.end_date || editingDebt.end_date,
        currency: newDebt.currency || editingDebt.currency,
        notes: `${newDebt.debt_type}|${newDebt.notes}`,
      });
      toast.success(t('finance.debtUpdated'));
      setIsEditDialogOpen(false);
      setEditingDebt(null);
      resetForm();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await updateDebt.mutateAsync({
        id: debtId,
        status: 'closed',
      });
      toast.success(t('finance.debtDeleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleMarkAsPaid = async (debtId: string) => {
    try {
      await updateDebt.mutateAsync({
        id: debtId,
        status: 'closed',
        remaining_amount: 0,
      });
      toast.success(t('finance.paid'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const openEditDialog = (debt: Debt) => {
    setEditingDebt(debt);
    const debtNotes = debt.notes?.split('|') || ['from_me', ''];
    setNewDebt({
      name: debt.name,
      lender: debt.lender || '',
      total_amount: debt.total_amount.toString(),
      remaining_amount: debt.remaining_amount.toString(),
      interest_rate: debt.interest_rate?.toString() || '',
      minimum_payment: debt.minimum_payment?.toString() || '',
      monthly_payment: debt.monthly_payment?.toString() || '',
      monthly_payment_date: debt.monthly_payment_date?.toString() || '1',
      start_date: debt.start_date || '',
      end_date: debt.end_date || '',
      currency: debt.currency || 'SAR',
      debt_type: (debtNotes[0] as 'to_me' | 'from_me') || 'from_me',
      notes: debtNotes[1] || '',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setNewDebt({
      name: '',
      lender: '',
      total_amount: '',
      remaining_amount: '',
      interest_rate: '',
      minimum_payment: '',
      monthly_payment: '',
      monthly_payment_date: '1',
      start_date: '',
      end_date: '',
      currency: 'SAR',
      debt_type: 'from_me',
      notes: '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const DebtForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pe-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={newDebt.debt_type === 'from_me' ? 'destructive' : 'outline'}
          onClick={() => setNewDebt({ ...newDebt, debt_type: 'from_me' })}
          className="flex items-center gap-2"
        >
          <ArrowDownRight className="w-4 h-4" />
          {t('finance.debtFromMe')}
        </Button>
        <Button
          type="button"
          variant={newDebt.debt_type === 'to_me' ? 'default' : 'outline'}
          className={newDebt.debt_type === 'to_me' ? 'bg-success hover:bg-success/90' : ''}
          onClick={() => setNewDebt({ ...newDebt, debt_type: 'to_me' })}
        >
          <ArrowUpRight className="w-4 h-4 me-2" />
          {t('finance.debtToMe')}
        </Button>
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t('finance.debtName')} *</label>
        <Input
          placeholder={language === 'ar' ? 'مثال: قرض السيارة' : 'e.g. Car Loan'}
          value={newDebt.name}
          onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
        />
      </div>
      
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">
          {newDebt.debt_type === 'to_me' ? t('finance.borrower') : t('finance.lender')}
        </label>
        <Input
          placeholder={language === 'ar' ? 'اسم الجهة أو الشخص' : 'Person or institution name'}
          value={newDebt.lender}
          onChange={(e) => setNewDebt({ ...newDebt, lender: e.target.value })}
        />
      </div>

      {/* Amount Section */}
      <div className="p-3 rounded-lg bg-muted/30 space-y-3">
        <h4 className="font-medium text-sm">{language === 'ar' ? 'المبالغ' : 'Amounts'}</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('finance.totalAmount')} *</label>
            <Input
              type="number"
              placeholder="0.00"
              value={newDebt.total_amount}
              onChange={(e) => setNewDebt({ ...newDebt, total_amount: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('finance.remainingAmount')}</label>
            <Input
              type="number"
              placeholder={newDebt.total_amount || '0.00'}
              value={newDebt.remaining_amount}
              onChange={(e) => setNewDebt({ ...newDebt, remaining_amount: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Monthly Payment Section */}
      <div className="p-3 rounded-lg bg-muted/30 space-y-3">
        <h4 className="font-medium text-sm">{language === 'ar' ? 'الدفعات الشهرية' : 'Monthly Payments'}</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {language === 'ar' ? 'القسط الشهري' : 'Monthly Payment'}
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={newDebt.monthly_payment}
              onChange={(e) => setNewDebt({ ...newDebt, monthly_payment: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {language === 'ar' ? 'يوم السداد' : 'Payment Day'}
            </label>
            <Select 
              value={newDebt.monthly_payment_date} 
              onValueChange={(value) => setNewDebt({ ...newDebt, monthly_payment_date: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر اليوم' : 'Select day'} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {language === 'ar' ? `يوم ${i + 1}` : `Day ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('finance.minimumPayment')}</label>
            <Input
              type="number"
              placeholder="0.00"
              value={newDebt.minimum_payment}
              onChange={(e) => setNewDebt({ ...newDebt, minimum_payment: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('finance.interestRate')} %</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newDebt.interest_rate}
              onChange={(e) => setNewDebt({ ...newDebt, interest_rate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Dates Section */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t('finance.startDate')}</label>
          <Input
            type="date"
            value={newDebt.start_date}
            onChange={(e) => setNewDebt({ ...newDebt, start_date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t('finance.dueDate')}</label>
          <Input
            type="date"
            value={newDebt.end_date}
            onChange={(e) => setNewDebt({ ...newDebt, end_date: e.target.value })}
          />
        </div>
      </div>

      {/* Currency */}
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{language === 'ar' ? 'العملة' : 'Currency'}</label>
        <Select 
          value={newDebt.currency} 
          onValueChange={(value) => setNewDebt({ ...newDebt, currency: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SAR">SAR - {language === 'ar' ? 'ريال سعودي' : 'Saudi Riyal'}</SelectItem>
            <SelectItem value="USD">USD - {language === 'ar' ? 'دولار أمريكي' : 'US Dollar'}</SelectItem>
            <SelectItem value="AED">AED - {language === 'ar' ? 'درهم إماراتي' : 'UAE Dirham'}</SelectItem>
            <SelectItem value="SDG">SDG - {language === 'ar' ? 'جنيه سوداني' : 'Sudanese Pound'}</SelectItem>
            <SelectItem value="EGP">EGP - {language === 'ar' ? 'جنيه مصري' : 'Egyptian Pound'}</SelectItem>
            <SelectItem value="KWD">KWD - {language === 'ar' ? 'دينار كويتي' : 'Kuwaiti Dinar'}</SelectItem>
            <SelectItem value="BHD">BHD - {language === 'ar' ? 'دينار بحريني' : 'Bahraini Dinar'}</SelectItem>
            <SelectItem value="QAR">QAR - {language === 'ar' ? 'ريال قطري' : 'Qatari Riyal'}</SelectItem>
            <SelectItem value="OMR">OMR - {language === 'ar' ? 'ريال عماني' : 'Omani Rial'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
        <Input
          placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
          value={newDebt.notes}
          onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })}
        />
      </div>

      <Button 
        onClick={isEdit ? handleUpdateDebt : handleCreateDebt} 
        className="w-full" 
        disabled={createDebt.isPending || updateDebt.isPending}
      >
        {(createDebt.isPending || updateDebt.isPending) ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isEdit ? t('common.save') : t('common.add')}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('finance.debts')}</h2>
          <p className="text-muted-foreground">
            {activeDebts.length} {t('finance.activeDebts')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="w-4 h-4 me-2" />
              {t('finance.addDebt')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('finance.addDebt')}</DialogTitle>
            </DialogHeader>
            <DebtForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 border-l-4 border-l-destructive">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium text-muted-foreground">{t('finance.debtFromMe')}</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{totalDebt.toLocaleString()} SAR</p>
          <p className="text-xs text-muted-foreground mt-1">
            {debtsFromMe.length} {language === 'ar' ? 'ديون نشطة' : 'active debts'}
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-success">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">{t('finance.debtToMe')}</span>
          </div>
          <p className="text-2xl font-bold text-success">{totalOwedToMe.toLocaleString()} SAR</p>
          <p className="text-xs text-muted-foreground mt-1">
            {debtsToMe.length} {language === 'ar' ? 'مستحقات' : 'receivables'}
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">{t('finance.monthlyPayments')}</span>
          </div>
          <p className="text-2xl font-bold">{totalMinPayment.toLocaleString()} SAR</p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'ar' ? 'الحد الأدنى الشهري' : 'minimum monthly'}
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-muted-foreground">{t('finance.paidOff')}</span>
          </div>
          <p className="text-2xl font-bold text-green-500">
            {debts?.filter(d => d.status === 'closed').length || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'ar' ? 'ديون مسددة' : 'debts cleared'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('finance.overview')}</TabsTrigger>
          <TabsTrigger value="payoffPlan">{t('finance.payoffPlan')}</TabsTrigger>
          <TabsTrigger value="schedule">{t('finance.schedule')}</TabsTrigger>
        </TabsList>

        {/* Debts Overview */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          {activeDebts.map((debt) => {
            const paidPercent = ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100;
            const monthsToPayoff = calculatePayoffDate(debt);
            const payoffDate = monthsToPayoff 
              ? addMonths(new Date(), monthsToPayoff)
              : null;
            const isDebtToMe = (debt as any).notes === 'to_me' || debt.notes === 'to_me';

            // Calculate next payment date from schedules
            const nextPayment = schedules?.find(s => s.debt_id === debt.id && !s.is_paid);
            const daysUntilDue = debt.end_date ? Math.ceil((new Date(debt.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
            const isNearDue = daysUntilDue !== null && daysUntilDue <= 30 && daysUntilDue > 0;
            const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

            return (
              <div key={debt.id} className={cn(
                "glass-card p-5 transition-all duration-300 hover:shadow-lg",
                isOverdue && "border-destructive/50 bg-destructive/5",
                isNearDue && !isOverdue && "border-orange-500/50 bg-orange-500/5"
              )}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shadow-sm',
                      isDebtToMe ? 'bg-success/10' : 'bg-destructive/10'
                    )}>
                      {isDebtToMe ? (
                        <ArrowUpRight className="w-6 h-6 text-success" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{debt.name}</h3>
                      {debt.lender && (
                        <p className="text-sm text-muted-foreground">{debt.lender}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOverdue && (
                      <Badge variant="destructive" className="animate-pulse">
                        <AlertTriangle className="w-3 h-3 me-1" />
                        {language === 'ar' ? 'متأخر' : 'Overdue'}
                      </Badge>
                    )}
                    {isNearDue && !isOverdue && (
                      <Badge variant="outline" className="border-orange-500 text-orange-500">
                        <Calendar className="w-3 h-3 me-1" />
                        {daysUntilDue} {language === 'ar' ? 'يوم' : 'days'}
                      </Badge>
                    )}
                    <Badge variant={isDebtToMe ? 'default' : 'destructive'}>
                      {isDebtToMe ? t('finance.debtToMe') : t('finance.debtFromMe')}
                    </Badge>
                    {debt.interest_rate > 0 && (
                      <Badge variant="secondary">{debt.interest_rate}% APR</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(debt)}>
                          <Edit className="w-4 h-4 me-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkAsPaid(debt.id)}>
                          <Check className="w-4 h-4 me-2" />
                          {t('finance.markAsPaid')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 me-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Amount Progress */}
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{t('finance.remaining')}</span>
                      <span className={cn('font-bold text-lg', isDebtToMe ? 'text-success' : 'text-destructive')}>
                        {debt.remaining_amount.toLocaleString()} {debt.currency || 'SAR'}
                      </span>
                    </div>
                    <Progress value={paidPercent} className="h-2.5" />
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-muted-foreground">
                        {paidPercent.toFixed(0)}% {t('finance.paid')}
                      </span>
                      <span className="text-muted-foreground">
                        {t('finance.of')} {debt.total_amount.toLocaleString()} {debt.currency || 'SAR'}
                      </span>
                    </div>
                  </div>

                  {/* Payment Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{t('finance.minimumPayment')}</p>
                      <p className="font-semibold text-sm">
                        {debt.minimum_payment?.toLocaleString() || '-'} {debt.currency || 'SAR'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        {language === 'ar' ? 'السداد القادم' : 'Next Payment'}
                      </p>
                      <p className="font-semibold text-sm">
                        {nextPayment ? format(new Date(nextPayment.due_date), 'MMM d', { locale }) : '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        {language === 'ar' ? 'السداد النهائي' : 'Final Due'}
                      </p>
                      <p className={cn(
                        "font-semibold text-sm",
                        isOverdue && "text-destructive",
                        isNearDue && !isOverdue && "text-orange-500"
                      )}>
                        {debt.end_date ? format(new Date(debt.end_date), 'MMM d, yyyy', { locale }) : '-'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{t('finance.estimatedPayoff')}</p>
                      <p className="font-semibold text-sm">
                        {payoffDate ? format(payoffDate, 'MMM yyyy', { locale }) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Start Date */}
                  {debt.start_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{language === 'ar' ? 'تاريخ البداية:' : 'Started:'} {format(new Date(debt.start_date), 'PPP', { locale })}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {activeDebts.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{t('finance.noDebts')}</p>
              <p className="text-sm text-success mt-2">{t('finance.debtFree')}</p>
            </div>
          )}
        </TabsContent>

        {/* Payoff Plan */}
        <TabsContent value="payoffPlan" className="space-y-6 mt-6">
          {debtsFromMe.length > 0 ? (
            <>
              <div className="flex gap-4">
                <Button
                  variant={selectedStrategy === 'snowball' ? 'default' : 'outline'}
                  onClick={() => setSelectedStrategy('snowball')}
                  className="flex-1"
                >
                  <span className="me-2">❄️</span>
                  {t('finance.snowball')}
                </Button>
                <Button
                  variant={selectedStrategy === 'avalanche' ? 'default' : 'outline'}
                  onClick={() => setSelectedStrategy('avalanche')}
                  className="flex-1"
                >
                  <span className="me-2">🏔️</span>
                  {t('finance.avalanche')}
                </Button>
              </div>

              <div className="glass-card p-5">
                <h3 className="font-semibold mb-2">
                  {selectedStrategy === 'snowball' ? t('finance.snowballStrategy') : t('finance.avalancheStrategy')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedStrategy === 'snowball' 
                    ? t('finance.snowballDescription')
                    : t('finance.avalancheDescription')
                  }
                </p>

                <div className="space-y-3">
                  {(selectedStrategy === 'snowball' ? snowballOrder : avalancheOrder).map((debt, index) => {
                    const monthsToPayoff = calculatePayoffDate(debt);
                    const totalInterest = monthsToPayoff ? calculateTotalInterest(debt, monthsToPayoff) : 0;

                    return (
                      <div key={debt.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{debt.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {debt.remaining_amount.toLocaleString()} SAR @ {debt.interest_rate}%
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <div className="text-end">
                          <p className="text-sm font-medium">
                            {monthsToPayoff ? `${monthsToPayoff} ${t('finance.months')}` : '-'}
                          </p>
                          <p className="text-xs text-destructive">
                            +{totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })} {t('finance.interest')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{t('finance.noDebts')}</p>
            </div>
          )}
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="space-y-4 mt-6">
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">{t('finance.paymentSchedule')}</h3>
            <div className="space-y-3">
              {schedules?.filter(s => !s.is_paid).slice(0, 10).map((schedule) => {
                const debt = debts?.find(d => d.id === schedule.debt_id);
                const isOverdue = new Date(schedule.due_date) < new Date();

                return (
                  <div 
                    key={schedule.id} 
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      isOverdue ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {isOverdue && <AlertTriangle className="w-4 h-4 text-destructive" />}
                      <div>
                        <p className="font-medium">{debt?.name || '-'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(schedule.due_date), 'EEEE, MMM d', { locale })}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold">{schedule.amount.toLocaleString()} SAR</span>
                  </div>
                );
              })}

              {(!schedules || schedules.filter(s => !s.is_paid).length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  {language === 'ar' ? 'لا توجد دفعات قادمة' : 'No upcoming payments'}
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('finance.editDebt')}</DialogTitle>
          </DialogHeader>
          <DebtForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
}