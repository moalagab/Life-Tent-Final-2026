import React, { useState, useMemo } from 'react';
import { 
  CreditCard, Plus, TrendingDown, Calendar, AlertTriangle,
  Calculator, Loader2, MoreVertical, Target, ArrowRight, Edit, Trash2,
  ArrowUpRight, ArrowDownRight, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useDebts, useCreateDebt, useUpdateDebt, useDebtSchedules, Debt } from '@/hooks/useAdvancedFinance';
import { toast } from 'sonner';
import { format, addMonths, differenceInMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DebtFormProps {
  isEdit?: boolean;
  language: string;
  newDebt: {
    name: string;
    lender: string;
    total_amount: string;
    remaining_amount: string;
    interest_rate: string;
    minimum_payment: string;
    monthly_payment: string;
    monthly_payment_date: string;
    start_date: string;
    end_date: string;
    currency: string;
    debt_type: 'to_me' | 'from_me';
    notes: string;
  };
  setNewDebt: React.Dispatch<React.SetStateAction<DebtFormProps['newDebt']>>;
  setIsDialogOpen: (v: boolean) => void;
  setIsEditDialogOpen: (v: boolean) => void;
  setEditingDebt: (v: null) => void;
  resetForm: () => void;
  handleCreateDebt: () => void;
  handleUpdateDebt: () => void;
  isCreatePending: boolean;
  isUpdatePending: boolean;
}

function DebtForm({
  isEdit = false,
  language,
  newDebt,
  setNewDebt,
  setIsDialogOpen,
  setIsEditDialogOpen,
  setEditingDebt,
  resetForm,
  handleCreateDebt,
  handleUpdateDebt,
  isCreatePending,
  isUpdatePending,
}: DebtFormProps) {
  return (
    <div className="space-y-5 mt-4 max-h-[65vh] overflow-y-auto pe-2">
      {/* Debt Type Toggle - More Prominent */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {language === 'ar' ? 'نوع الدين' : 'Debt Type'}
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            variant={newDebt.debt_type === 'from_me' ? 'destructive' : 'outline'}
            onClick={() => setNewDebt(prev => ({ ...prev, debt_type: 'from_me' }))}
            className={cn(
              "h-14 flex flex-col items-center justify-center gap-1 transition-all",
              newDebt.debt_type === 'from_me' && "ring-2 ring-destructive ring-offset-2"
            )}
          >
            <ArrowDownRight className="w-5 h-5" />
            <span className="text-xs font-medium">
              {language === 'ar' ? 'دين عليّ' : 'I Owe'}
            </span>
          </Button>
          <Button
            type="button"
            variant={newDebt.debt_type === 'to_me' ? 'default' : 'outline'}
            className={cn(
              "h-14 flex flex-col items-center justify-center gap-1 transition-all",
              newDebt.debt_type === 'to_me' && "bg-success hover:bg-success/90 ring-2 ring-success ring-offset-2"
            )}
            onClick={() => setNewDebt(prev => ({ ...prev, debt_type: 'to_me' }))}
          >
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-xs font-medium">
              {language === 'ar' ? 'دين لي' : 'Owed to Me'}
            </span>
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">
            {language === 'ar' ? 'اسم الدين' : 'Debt Name'} <span className="text-destructive">*</span>
          </Label>
          <Input
            dir="auto"
            placeholder={language === 'ar' ? 'مثال: قرض السيارة، بطاقة ائتمان...' : 'e.g. Car Loan, Credit Card...'}
            value={newDebt.name}
            onChange={(e) => { const v = e.target.value; setNewDebt(prev => ({ ...prev, name: v })); }}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">
            {newDebt.debt_type === 'to_me'
              ? (language === 'ar' ? 'اسم المقترض' : 'Borrower Name')
              : (language === 'ar' ? 'اسم المُقرض' : 'Lender Name')
            }
          </Label>
          <Input
            dir="auto"
            placeholder={language === 'ar' ? 'الجهة أو الشخص' : 'Person or institution'}
            value={newDebt.lender}
            onChange={(e) => { const v = e.target.value; setNewDebt(prev => ({ ...prev, lender: v })); }}
            className="mt-1"
          />
        </div>
      </div>

      {/* Amount Section */}
      <div className="p-4 rounded-lg border bg-card space-y-4">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          {language === 'ar' ? 'المبالغ' : 'Amounts'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium">
              {language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'} <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              placeholder="0"
              value={newDebt.total_amount}
              onChange={(e) => {
                const value = e.target.value;
                setNewDebt(prev => ({
                  ...prev,
                  total_amount: value,
                  remaining_amount: prev.remaining_amount || value
                }));
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">
              {language === 'ar' ? 'المبلغ المتبقي' : 'Remaining'}
            </Label>
            <Input
              type="number"
              placeholder={newDebt.total_amount || '0'}
              value={newDebt.remaining_amount}
              onChange={(e) => { const v = e.target.value; setNewDebt(prev => ({ ...prev, remaining_amount: v })); }}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium">
            {language === 'ar' ? 'العملة' : 'Currency'}
          </Label>
          <Select
            value={newDebt.currency}
            onValueChange={(value) => setNewDebt(prev => ({ ...prev, currency: value }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SAR">🇸🇦 SAR - {language === 'ar' ? 'ريال سعودي' : 'Saudi Riyal'}</SelectItem>
              <SelectItem value="USD">🇺🇸 USD - {language === 'ar' ? 'دولار أمريكي' : 'US Dollar'}</SelectItem>
              <SelectItem value="AED">🇦🇪 AED - {language === 'ar' ? 'درهم إماراتي' : 'UAE Dirham'}</SelectItem>
              <SelectItem value="SDG">🇸🇩 SDG - {language === 'ar' ? 'جنيه سوداني' : 'Sudanese Pound'}</SelectItem>
              <SelectItem value="EGP">🇪🇬 EGP - {language === 'ar' ? 'جنيه مصري' : 'Egyptian Pound'}</SelectItem>
              <SelectItem value="KWD">🇰🇼 KWD - {language === 'ar' ? 'دينار كويتي' : 'Kuwaiti Dinar'}</SelectItem>
              <SelectItem value="BHD">🇧🇭 BHD - {language === 'ar' ? 'دينار بحريني' : 'Bahraini Dinar'}</SelectItem>
              <SelectItem value="QAR">🇶🇦 QAR - {language === 'ar' ? 'ريال قطري' : 'Qatari Riyal'}</SelectItem>
              <SelectItem value="OMR">🇴🇲 OMR - {language === 'ar' ? 'ريال عماني' : 'Omani Rial'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Monthly Payment Section */}
      <div className="p-4 rounded-lg border bg-card space-y-4">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {language === 'ar' ? 'تفاصيل السداد' : 'Payment Details'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium">
              {language === 'ar' ? 'القسط الشهري' : 'Monthly Payment'}
            </Label>
            <Input
              type="number"
              placeholder="0"
              value={newDebt.monthly_payment}
              onChange={(e) => { const v = e.target.value; setNewDebt(prev => ({ ...prev, monthly_payment: v })); }}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">
              {language === 'ar' ? 'يوم السداد' : 'Payment Day'}
            </Label>
            <Select
              value={newDebt.monthly_payment_date}
              onValueChange={(value) => setNewDebt(prev => ({ ...prev, monthly_payment_date: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={language === 'ar' ? 'اختر' : 'Select'} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium">
              {language === 'ar' ? 'الحد الأدنى للسداد' : 'Minimum Payment'}
            </Label>
            <Input
              type="number"
              placeholder="0"
              value={newDebt.minimum_payment}
              onChange={(e) => { const v = e.target.value; setNewDebt(prev => ({ ...prev, minimum_payment: v })); }}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">
              {language === 'ar' ? 'نسبة الفائدة %' : 'Interest Rate %'}
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              value={newDebt.interest_rate}
              onChange={(e) => { const v = e.target.value; setNewDebt(prev => ({ ...prev, interest_rate: v })); }}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Dates Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium">
            {language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
          </Label>
          <Input
            type="date"
            value={newDebt.start_date}
            onChange={(e) => { const v = e.target.value; setNewDebt(prev => ({ ...prev, start_date: v })); }}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">
            {language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
          </Label>
          <Input
            type="date"
            value={newDebt.end_date}
            onChange={(e) => { const v = e.target.value; setNewDebt(prev => ({ ...prev, end_date: v })); }}
            className="mt-1"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-sm font-medium">
          {language === 'ar' ? 'ملاحظات' : 'Notes'}
        </Label>
        <Textarea
          dir="auto"
          placeholder={language === 'ar' ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
          value={newDebt.notes}
          onChange={(e) => { const v = e.target.value; setNewDebt(prev => ({ ...prev, notes: v })); }}
          className="mt-1 min-h-[80px]"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
              setEditingDebt(null);
            } else {
              setIsDialogOpen(false);
            }
            resetForm();
          }}
          className="flex-1"
        >
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button
          onClick={isEdit ? handleUpdateDebt : handleCreateDebt}
          className="flex-1"
          disabled={isCreatePending || isUpdatePending}
        >
          {(isCreatePending || isUpdatePending) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isEdit ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (language === 'ar' ? 'إضافة الدين' : 'Add Debt')}
        </Button>
      </div>
    </div>
  );
}

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);

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
  const debtsToMe = activeDebts.filter(d => {
    const debtNotes = d.notes?.split('|') || ['from_me', ''];
    return debtNotes[0] === 'to_me';
  });
  const debtsFromMe = activeDebts.filter(d => {
    const debtNotes = d.notes?.split('|') || ['from_me', ''];
    return debtNotes[0] !== 'to_me';
  });
  
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
      toast.error(language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
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
      toast.success(language === 'ar' ? 'تم إضافة الدين بنجاح' : 'Debt added successfully');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleUpdateDebt = async () => {
    if (!editingDebt) return;

    if (!newDebt.name || !newDebt.total_amount) {
      toast.error(language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }

    try {
      await updateDebt.mutateAsync({
        id: editingDebt.id,
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
        notes: `${newDebt.debt_type}|${newDebt.notes}`,
      });
      toast.success(language === 'ar' ? 'تم تحديث الدين بنجاح' : 'Debt updated successfully');
      setIsEditDialogOpen(false);
      setEditingDebt(null);
      resetForm();
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleDeleteDebt = async (debt: Debt) => {
    try {
      await updateDebt.mutateAsync({
        id: debt.id,
        status: 'closed',
      });
      toast.success(language === 'ar' ? 'تم حذف الدين' : 'Debt deleted');
      setDeleteConfirmOpen(false);
      setDebtToDelete(null);
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleMarkAsPaid = async (debtId: string) => {
    try {
      await updateDebt.mutateAsync({
        id: debtId,
        status: 'closed',
        remaining_amount: 0,
      });
      toast.success(language === 'ar' ? 'تم تسديد الدين' : 'Debt paid off');
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
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

  const openDeleteConfirm = (debt: Debt) => {
    setDebtToDelete(debt);
    setDeleteConfirmOpen(true);
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
        <Button variant="gold" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 me-2" />
          {language === 'ar' ? 'إضافة دين' : 'Add Debt'}
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-lg max-h-[92svh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إضافة دين جديد' : 'Add New Debt'}</DialogTitle>
              <DialogDescription>
                {language === 'ar' ? 'أدخل تفاصيل الدين أو القرض' : 'Enter the debt or loan details'}
              </DialogDescription>
            </DialogHeader>
            <DebtForm
              language={language}
              newDebt={newDebt}
              setNewDebt={setNewDebt}
              setIsDialogOpen={setIsDialogOpen}
              setIsEditDialogOpen={setIsEditDialogOpen}
              setEditingDebt={setEditingDebt}
              resetForm={resetForm}
              handleCreateDebt={handleCreateDebt}
              handleUpdateDebt={handleUpdateDebt}
              isCreatePending={createDebt.isPending}
              isUpdatePending={updateDebt.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 border-l-4 border-l-destructive">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium text-muted-foreground">
              {language === 'ar' ? 'ديون عليّ' : 'I Owe'}
            </span>
          </div>
          <p className="text-2xl font-bold text-destructive">{totalDebt.toLocaleString()} SAR</p>
          <p className="text-xs text-muted-foreground mt-1">
            {debtsFromMe.length} {language === 'ar' ? 'ديون نشطة' : 'active debts'}
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-success">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">
              {language === 'ar' ? 'ديون لي' : 'Owed to Me'}
            </span>
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
            const debtNotes = debt.notes?.split('|') || ['from_me', ''];
            const isDebtToMe = debtNotes[0] === 'to_me';

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
                    <Badge variant={isDebtToMe ? 'default' : 'destructive'} className={isDebtToMe ? 'bg-success' : ''}>
                      {isDebtToMe ? (language === 'ar' ? 'دين لي' : 'Owed to Me') : (language === 'ar' ? 'دين عليّ' : 'I Owe')}
                    </Badge>
                    {debt.interest_rate > 0 && (
                      <Badge variant="secondary">{debt.interest_rate}% APR</Badge>
                    )}
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

                  {/* Action Buttons - More Visible */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(debt)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleMarkAsPaid(debt.id)}
                      className="flex-1 text-success hover:text-success hover:bg-success/10"
                    >
                      <Check className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'تم السداد' : 'Mark Paid'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openDeleteConfirm(debt)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingDebt(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[92svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل الدين' : 'Edit Debt'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'قم بتعديل تفاصيل الدين' : 'Update the debt details'}
            </DialogDescription>
          </DialogHeader>
          <DebtForm
            isEdit
            language={language}
            newDebt={newDebt}
            setNewDebt={setNewDebt}
            setIsDialogOpen={setIsDialogOpen}
            setIsEditDialogOpen={setIsEditDialogOpen}
            setEditingDebt={setEditingDebt}
            resetForm={resetForm}
            handleCreateDebt={handleCreateDebt}
            handleUpdateDebt={handleUpdateDebt}
            isCreatePending={createDebt.isPending}
            isUpdatePending={updateDebt.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? `هل أنت متأكد من حذف "${debtToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${debtToDelete?.name}"? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => debtToDelete && handleDeleteDebt(debtToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
