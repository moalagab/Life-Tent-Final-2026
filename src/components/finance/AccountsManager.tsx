import { useState } from 'react';
import { 
  Wallet, Plus, CreditCard, Building, Smartphone, 
  MoreVertical, Check, X, RefreshCw, Loader2, Pencil, Trash2,
  TrendingUp, Eye, EyeOff, ArrowRightLeft, Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { parseMoneyInput } from '@/lib/parseMoneyInput';
import { useLanguage } from '@/hooks/useLanguage';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, useTransactions } from '@/hooks/useFinance';
import { useReconcileAccount, useReconcileTransactions } from '@/hooks/useAdvancedFinance';
import { useCurrencyConversion, CURRENCIES, getCurrencySymbol } from '@/hooks/useCurrencyConversion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { Account } from '@/hooks/useFinance';

const accountIcons: Record<string, React.ElementType> = {
  bank: Building,
  checking: Building,
  savings: Wallet,
  credit: CreditCard,
  wallet: Smartphone,
  investment: TrendingUp,
  cash: Coins,
};

const accountColors: Record<string, string> = {
  bank: 'hsl(var(--primary))',
  checking: 'hsl(var(--primary))',
  savings: 'hsl(var(--success))',
  credit: 'hsl(var(--destructive))',
  wallet: 'hsl(var(--warning))',
  investment: 'hsl(var(--muted-foreground))',
  cash: 'hsl(var(--success))',
};

export function AccountsManager() {
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage;
  const locale = language === 'ar' ? ar : enUS;
  const { data: accounts, isLoading } = useAccounts();
  const { data: transactions } = useTransactions();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const reconcileAccount = useReconcileAccount();
  const reconcileTransactions = useReconcileTransactions();
  const { convertToSAR } = useCurrencyConversion();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [reconcileBalance, setReconcileBalance] = useState('');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [showBalances, setShowBalances] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'bank',
    balance: '',
    currency: 'SAR',
    icon: '',
    color: '',
  });

  const resetForm = () => {
    setNewAccount({ name: '', type: 'bank', balance: '', currency: 'SAR', icon: '', color: '' });
    setIsEditMode(false);
    setEditingAccountId(null);
  };

  const openEditDialog = (account: Account) => {
    setNewAccount({
      name: account.name,
      type: account.type,
      balance: String(account.balance || 0),
      currency: account.currency || 'SAR',
      icon: account.icon || '',
      color: account.color || '',
    });
    setEditingAccountId(account.id);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!newAccount.name) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم الحساب' : 'Please enter account name');
      return;
    }

    const balance = newAccount.balance ? parseMoneyInput(newAccount.balance) : 0;
    if (balance === null) {
      toast.error(language === 'ar' ? 'الرصيد غير صالح' : 'Invalid balance');
      return;
    }

    try {
      await createAccount.mutateAsync({
        name: newAccount.name,
        type: newAccount.type,
        balance,
        currency: newAccount.currency,
        icon: newAccount.icon || undefined,
        color: newAccount.color || accountColors[newAccount.type],
      });
      toast.success(language === 'ar' ? 'تم إضافة الحساب بنجاح' : 'Account added successfully');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleUpdateAccount = async () => {
    if (!newAccount.name || !editingAccountId) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم الحساب' : 'Please enter account name');
      return;
    }

    const balance = newAccount.balance ? parseMoneyInput(newAccount.balance) : 0;
    if (balance === null) {
      toast.error(language === 'ar' ? 'الرصيد غير صالح' : 'Invalid balance');
      return;
    }

    try {
      await updateAccount.mutateAsync({
        id: editingAccountId,
        name: newAccount.name,
        type: newAccount.type,
        balance,
        currency: newAccount.currency,
        icon: newAccount.icon || undefined,
        color: newAccount.color || accountColors[newAccount.type],
      });
      toast.success(language === 'ar' ? 'تم تحديث الحساب بنجاح' : 'Account updated successfully');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      await deleteAccount.mutateAsync(accountToDelete.id);
      toast.success(language === 'ar' ? 'تم حذف الحساب' : 'Account deleted');
      setIsDeleteOpen(false);
      setAccountToDelete(null);
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleReconcile = async () => {
    if (!selectedAccountId || !reconcileBalance) return;

    const balance = parseMoneyInput(reconcileBalance);
    if (balance === null) {
      toast.error(language === 'ar' ? 'الرصيد غير صالح' : 'Invalid balance');
      return;
    }

    try {
      await reconcileAccount.mutateAsync({
        accountId: selectedAccountId,
        balance,
      });

      if (selectedTxIds.length > 0) {
        await reconcileTransactions.mutateAsync(selectedTxIds);
      }

      toast.success(language === 'ar' ? 'تمت المطابقة بنجاح' : 'Reconciliation complete');
      setIsReconcileOpen(false);
      setSelectedAccountId(null);
      setReconcileBalance('');
      setSelectedTxIds([]);
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const accountTransactions = transactions?.filter(tx => tx.account_id === selectedAccountId) || [];
  const unreconciledTxs = accountTransactions.filter(tx => !tx.is_reconciled);

  // Calculate totals
  const totalBalanceSAR = accounts?.reduce((sum, acc) => {
    const balance = acc.balance || 0;
    const currency = acc.currency || 'SAR';
    return sum + convertToSAR(balance, currency);
  }, 0) || 0;

  // Filter accounts by type
  const filteredAccounts = accounts?.filter(acc => {
    if (activeTab === 'all') return true;
    return acc.type === activeTab;
  });

  // Group accounts by currency for summary
  const currencySummary = accounts?.reduce((acc, account) => {
    const currency = account.currency || 'SAR';
    if (!acc[currency]) {
      acc[currency] = { total: 0, count: 0, inSAR: 0 };
    }
    acc[currency].total += account.balance || 0;
    acc[currency].count += 1;
    acc[currency].inSAR += convertToSAR(account.balance || 0, currency);
    return acc;
  }, {} as Record<string, { total: number; count: number; inSAR: number }>);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{language === 'ar' ? 'الحسابات' : 'Accounts'}</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">
              {language === 'ar' ? 'إجمالي الرصيد (بالريال السعودي):' : 'Total Balance (in SAR):'}
            </p>
            <span className="font-bold text-xl text-foreground">
              {showBalances ? `${totalBalanceSAR.toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR` : '••••••'}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowBalances(!showBalances)}>
              {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'إضافة حساب' : 'Add Account'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isEditMode ? (language === 'ar' ? 'تعديل الحساب' : 'Edit Account') : (language === 'ar' ? 'إضافة حساب جديد' : 'Add New Account')}</DialogTitle>
              <DialogDescription>
                {language === 'ar' ? 'أدخل تفاصيل الحساب' : 'Enter account details'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>{language === 'ar' ? 'اسم الحساب' : 'Account Name'}</Label>
                <Input
                  placeholder={language === 'ar' ? 'مثال: البنك الأهلي' : 'e.g., Main Bank'}
                  value={newAccount.name}
                  onChange={(e) => { const v = e.target.value; setNewAccount(prev => ({ ...prev, name: v })); }}
                  dir="auto"
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'نوع الحساب' : 'Account Type'}</Label>
                <Select 
                  value={newAccount.type} 
                  onValueChange={(value) => setNewAccount(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">{language === 'ar' ? 'بنك' : 'Bank'}</SelectItem>
                    <SelectItem value="checking">{language === 'ar' ? 'حساب جاري' : 'Checking'}</SelectItem>
                    <SelectItem value="savings">{language === 'ar' ? 'حساب توفير' : 'Savings'}</SelectItem>
                    <SelectItem value="credit">{language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</SelectItem>
                    <SelectItem value="wallet">{language === 'ar' ? 'محفظة إلكترونية' : 'E-Wallet'}</SelectItem>
                    <SelectItem value="investment">{language === 'ar' ? 'استثمار' : 'Investment'}</SelectItem>
                    <SelectItem value="cash">{language === 'ar' ? 'نقد' : 'Cash'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'ar' ? 'العملة' : 'Currency'}</Label>
                <Select 
                  value={newAccount.currency} 
                  onValueChange={(value) => setNewAccount(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} - {language === 'ar' ? c.nameAr : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'ar' ? 'الرصيد الافتتاحي' : 'Opening Balance'}</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newAccount.balance}
                  onChange={(e) => { const v = e.target.value; setNewAccount(prev => ({ ...prev, balance: v })); }}
                />
              </div>
              <Button 
                onClick={isEditMode ? handleUpdateAccount : handleCreateAccount} 
                className="w-full" 
                disabled={createAccount.isPending || updateAccount.isPending}
              >
                {(createAccount.isPending || updateAccount.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  isEditMode ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (language === 'ar' ? 'إضافة الحساب' : 'Add Account')
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Currency Summary Cards */}
      {currencySummary && Object.keys(currencySummary).length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(currencySummary).map(([currency, data]) => (
            <Card key={currency} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{currency}</Badge>
                  <span className="text-xs text-muted-foreground">{data.count} {language === 'ar' ? 'حسابات' : 'accounts'}</span>
                </div>
                <p className="font-bold text-lg">
                  {showBalances ? data.total.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '••••'}
                </p>
                {currency !== 'SAR' && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {showBalances ? data.inSAR.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '••••'} SAR
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Account Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="overflow-x-auto flex-nowrap w-full justify-start h-auto">
          <TabsTrigger value="all" className="flex-shrink-0">{language === 'ar' ? 'الكل' : 'All'}</TabsTrigger>
          <TabsTrigger value="bank" className="flex-shrink-0">{language === 'ar' ? 'بنوك' : 'Banks'}</TabsTrigger>
          <TabsTrigger value="savings" className="flex-shrink-0">{language === 'ar' ? 'توفير' : 'Savings'}</TabsTrigger>
          <TabsTrigger value="credit" className="flex-shrink-0">{language === 'ar' ? 'ائتمان' : 'Credit'}</TabsTrigger>
          <TabsTrigger value="wallet" className="flex-shrink-0">{language === 'ar' ? 'محافظ' : 'Wallets'}</TabsTrigger>
          <TabsTrigger value="investment" className="flex-shrink-0">{language === 'ar' ? 'استثمار' : 'Investment'}</TabsTrigger>
          <TabsTrigger value="cash" className="flex-shrink-0">{language === 'ar' ? 'نقد' : 'Cash'}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts?.map((account) => {
          const Icon = accountIcons[account.type] || Wallet;
          const color = account.color || accountColors[account.type] || 'hsl(var(--primary))';
          const balanceInSAR = convertToSAR(account.balance || 0, account.currency || 'SAR');
          
          return (
            <Card 
              key={account.id} 
              className="glass-card hover:shadow-lg transition-all duration-300 group"
              style={{ borderInlineStartColor: color, borderInlineStartWidth: '4px' }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{account.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                        <span>{language === 'ar' ? (account.type === 'bank' ? 'بنك' : account.type === 'savings' ? 'توفير' : account.type === 'credit' ? 'ائتمان' : account.type === 'wallet' ? 'محفظة' : account.type === 'investment' ? 'استثمار' : account.type === 'cash' ? 'نقد' : account.type) : account.type}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">{account.currency || 'SAR'}</Badge>
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(account)}>
                        <Pencil className="w-4 h-4 me-2" />
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedAccountId(account.id);
                        setIsReconcileOpen(true);
                      }}>
                        <RefreshCw className="w-4 h-4 me-2" />
                        {language === 'ar' ? 'مطابقة' : 'Reconcile'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => {
                          setAccountToDelete(account);
                          setIsDeleteOpen(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 me-2" />
                        {language === 'ar' ? 'حذف' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-4 space-y-1">
                  <p className="text-2xl font-bold">
                    {showBalances ? (account.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '••••••'}
                    <span className="text-sm font-normal text-muted-foreground ms-1">{account.currency || 'SAR'}</span>
                  </p>
                  {account.currency !== 'SAR' && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <ArrowRightLeft className="w-3 h-3" />
                      ≈ {showBalances ? balanceInSAR.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '••••'} SAR
                    </p>
                  )}
                  {account.last_reconciled_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'ar' ? 'آخر مطابقة:' : 'Last reconciled:'} {format(new Date(account.last_reconciled_at), 'MMM d, yyyy', { locale })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!filteredAccounts || filteredAccounts.length === 0) && (
          <div className="col-span-full text-center py-12">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد حسابات' : 'No accounts'}</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'إضافة حساب' : 'Add Account'}
            </Button>
          </div>
        )}
      </div>

      {/* Reconciliation Dialog */}
      <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance.reconcileAccount')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('finance.bankBalance')}</label>
              <Input
                type="number"
                placeholder={t('finance.enterBankBalance')}
                value={reconcileBalance}
                onChange={(e) => setReconcileBalance(e.target.value)}
              />
            </div>

            {unreconciledTxs.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('finance.unreconciledTransactions')} ({unreconciledTxs.length})
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {unreconciledTxs.map((tx) => (
                    <div 
                      key={tx.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                        selectedTxIds.includes(tx.id) ? 'bg-primary/10' : 'hover:bg-muted/50'
                      )}
                      onClick={() => {
                        setSelectedTxIds(prev => 
                          prev.includes(tx.id) 
                            ? prev.filter(id => id !== tx.id)
                            : [...prev, tx.id]
                        );
                      }}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center',
                        selectedTxIds.includes(tx.id) ? 'bg-primary border-primary' : 'border-border'
                      )}>
                        {selectedTxIds.includes(tx.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'MMM d', { locale })}</p>
                      </div>
                      <span className={cn(
                        'font-bold text-sm',
                        tx.type === 'income' ? 'text-success' : 'text-destructive'
                      )}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsReconcileOpen(false)} className="flex-1">
                <X className="w-4 h-4 me-2" />
                {t('common.cancel')}
              </Button>
              <Button onClick={handleReconcile} className="flex-1" disabled={!reconcileBalance}>
                <Check className="w-4 h-4 me-2" />
                {t('finance.reconcile')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('finance.deleteAccountWarning', { name: accountToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAccountToDelete(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAccount.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
