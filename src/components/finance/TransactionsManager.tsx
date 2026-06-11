import { useState, useMemo, useRef } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Plus, Filter, Search,
  Upload, Tag, Paperclip, Split, Loader2, MoreVertical, Trash2,
  Pencil, Download, Image, X, Check, FileImage
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useAccounts, useTransactions, useCreateTransaction, Transaction } from '@/hooks/useFinance';
import { useCategories } from '@/hooks/useAdvancedFinance';
import { useProjects } from '@/hooks/useProjects';
import { useUpdateTransaction, useDeleteTransaction, useUploadReceipt } from '@/hooks/useTransactionMutations';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function TransactionsManager() {
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage;
  const locale = language === 'ar' ? ar : enUS;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: accounts } = useAccounts();
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const { data: projects } = useProjects();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const uploadReceipt = useUploadReceipt();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('current');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    account_id: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    tags: [] as string[],
    notes: '',
  });

  const [editTransaction, setEditTransaction] = useState({
    id: '',
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    account_id: '',
    project_id: '',
    date: '',
    notes: '',
  });

  const [newTag, setNewTag] = useState('');

  const resetNewForm = () => {
    setNewTransaction({ 
      description: '', 
      amount: '', 
      type: 'expense', 
      category: '', 
      account_id: '',
      project_id: '',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      notes: '',
    });
  };

  const handleCreateTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.account_id) {
      toast.error(language === 'ar' ? 'يرجى إدخال جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    try {
      await createTransaction.mutateAsync({
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        type: newTransaction.type,
        category: newTransaction.category || null,
        account_id: newTransaction.account_id,
        project_id: newTransaction.project_id || null,
        date: newTransaction.date,
        tags: newTransaction.tags.length > 0 ? newTransaction.tags : null,
      });
      toast.success(language === 'ar' ? 'تمت إضافة العملية بنجاح' : 'Transaction added successfully');
      setIsDialogOpen(false);
      resetNewForm();
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleUpdateTransaction = async () => {
    if (!editTransaction.description || !editTransaction.amount) {
      toast.error(language === 'ar' ? 'يرجى إدخال جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    try {
      await updateTransaction.mutateAsync({
        id: editTransaction.id,
        description: editTransaction.description,
        amount: parseFloat(editTransaction.amount),
        type: editTransaction.type,
        category: editTransaction.category || null,
        date: editTransaction.date,
      });
      toast.success(language === 'ar' ? 'تم تحديث العملية بنجاح' : 'Transaction updated successfully');
      setIsEditDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      await deleteTransaction.mutateAsync(selectedTransaction.id);
      toast.success(language === 'ar' ? 'تم حذف العملية' : 'Transaction deleted');
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTransaction) return;

    setUploadingReceipt(true);
    try {
      await uploadReceipt.mutateAsync({
        transactionId: selectedTransaction.id,
        file,
      });
      toast.success(language === 'ar' ? 'تم رفع الإيصال بنجاح' : 'Receipt uploaded successfully');
      setIsReceiptDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل رفع الإيصال' : 'Failed to upload receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const openEditDialog = (tx: Transaction) => {
    setEditTransaction({
      id: tx.id,
      description: tx.description,
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category || '',
      account_id: tx.account_id,
      project_id: tx.project_id || '',
      date: tx.date,
      notes: tx.notes || '',
    });
    setSelectedTransaction(tx);
    setIsEditDialogOpen(true);
  };

  const addTag = () => {
    if (newTag && !newTransaction.tags.includes(newTag)) {
      setNewTransaction(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setNewTransaction(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(query) ||
        tx.category?.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === filterCategory);
    }

    if (filterAccount !== 'all') {
      filtered = filtered.filter(tx => tx.account_id === filterAccount);
    }

    if (filterMonth !== 'all') {
      const now = new Date();
      let startDate: Date, endDate: Date;
      
      if (filterMonth === 'current') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      } else if (filterMonth === 'previous') {
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
      } else if (filterMonth === 'last3') {
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
      } else {
        startDate = new Date(0);
        endDate = now;
      }

      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
      });
    }

    return filtered;
  }, [transactions, searchQuery, filterType, filterCategory, filterAccount, filterMonth]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  // Get unique categories from transactions
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions?.forEach(tx => {
      if (tx.category) cats.add(tx.category);
    });
    return Array.from(cats);
  }, [transactions]);

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
          <h2 className="text-2xl font-bold">{language === 'ar' ? 'العمليات المالية' : 'Transactions'}</h2>
          <p className="text-muted-foreground">
            {filteredTransactions.length} {language === 'ar' ? 'عملية' : 'transactions'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="w-4 h-4 me-2" />
                {language === 'ar' ? 'إضافة عملية' : 'Add Transaction'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'إضافة عملية جديدة' : 'Add New Transaction'}</DialogTitle>
                <DialogDescription>
                  {language === 'ar' ? 'أدخل تفاصيل العملية المالية' : 'Enter transaction details'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={newTransaction.type === 'expense' ? 'destructive' : 'outline'}
                    onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                    className="h-12"
                  >
                    <ArrowDownRight className="w-5 h-5 me-2" />
                    {language === 'ar' ? 'مصروف' : 'Expense'}
                  </Button>
                  <Button
                    type="button"
                    variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                    className={cn('h-12', newTransaction.type === 'income' && 'bg-success hover:bg-success/90')}
                    onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
                  >
                    <ArrowUpRight className="w-5 h-5 me-2" />
                    {language === 'ar' ? 'دخل' : 'Income'}
                  </Button>
                </div>

                <div>
                  <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                  <Input
                    placeholder={language === 'ar' ? 'مثال: مشتريات السوبرماركت' : 'e.g., Grocery shopping'}
                    value={newTransaction.description}
                    onChange={(e) => { const v = e.target.value; setNewTransaction(prev => ({ ...prev, description: v })); }}
                    dir="auto"
                  />
                </div>
                
                <div>
                  <Label>{language === 'ar' ? 'المبلغ' : 'Amount'}</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => { const v = e.target.value; setNewTransaction(prev => ({ ...prev, amount: v })); }}
                  />
                </div>

                <div>
                  <Label>{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => { const v = e.target.value; setNewTransaction(prev => ({ ...prev, date: v })); }}
                  />
                </div>

                <div>
                  <Label>{language === 'ar' ? 'الحساب' : 'Account'} *</Label>
                  <Select 
                    value={newTransaction.account_id} 
                    onValueChange={(value) => setNewTransaction(prev => ({ ...prev, account_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر الحساب' : 'Select account'} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                  <Select 
                    value={newTransaction.category} 
                    onValueChange={(value) => setNewTransaction(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{language === 'ar' ? cat.name_ar || cat.name : cat.name}</SelectItem>
                      ))}
                      {uniqueCategories.map((cat) => (
                        !categories?.find(c => c.name === cat) && (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{language === 'ar' ? 'المشروع (اختياري)' : 'Project (Optional)'}</Label>
                  <Select 
                    value={newTransaction.project_id || 'none'} 
                    onValueChange={(value) => setNewTransaction(prev => ({ ...prev, project_id: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'ربط بمشروع' : 'Link to project'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{language === 'ar' ? 'بدون' : 'None'}</SelectItem>
                      {projects?.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id}>{proj.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                  <Textarea
                    placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                    value={newTransaction.notes}
                    onChange={(e) => { const v = e.target.value; setNewTransaction(prev => ({ ...prev, notes: v })); }}
                    dir="auto"
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label>{language === 'ar' ? 'الوسوم' : 'Tags'}</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder={language === 'ar' ? 'أضف وسم' : 'Add tag'}
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      dir="auto"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {newTransaction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {newTransaction.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleCreateTransaction} className="w-full" disabled={createTransaction.isPending}>
                  {createTransaction.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'إضافة العملية' : 'Add Transaction')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-s-4 border-s-success">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الدخل' : 'Total Income'}</p>
            <p className="text-2xl font-bold text-success">+{totals.income.toLocaleString()} SAR</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-s-4 border-s-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
            <p className="text-2xl font-bold text-destructive">-{totals.expense.toLocaleString()} SAR</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-s-4" style={{ borderLeftColor: totals.net >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الصافي' : 'Net'}</p>
            <p className={cn('text-2xl font-bold', totals.net >= 0 ? 'text-success' : 'text-destructive')}>
              {totals.net >= 0 ? '+' : ''}{totals.net.toLocaleString()} SAR
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={language === 'ar' ? 'بحث في العمليات...' : 'Search transactions...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            dir="auto"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
            <SelectItem value="income">{language === 'ar' ? 'دخل' : 'Income'}</SelectItem>
            <SelectItem value="expense">{language === 'ar' ? 'مصروف' : 'Expense'}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'جميع الفئات' : 'All Categories'}</SelectItem>
            {uniqueCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAccount} onValueChange={setFilterAccount}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'جميع الحسابات' : 'All Accounts'}</SelectItem>
            {accounts?.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'كل الوقت' : 'All Time'}</SelectItem>
            <SelectItem value="current">{language === 'ar' ? 'الشهر الحالي' : 'This Month'}</SelectItem>
            <SelectItem value="previous">{language === 'ar' ? 'الشهر السابق' : 'Last Month'}</SelectItem>
            <SelectItem value="last3">{language === 'ar' ? 'آخر 3 أشهر' : 'Last 3 Months'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <div className="glass-card divide-y divide-border">
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
              )}>
                {tx.type === 'income' ? (
                  <ArrowUpRight className="w-5 h-5 text-success" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{tx.description}</p>
                  {tx.is_reconciled && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Check className="w-3 h-3 me-1" />
                      {language === 'ar' ? 'مطابق' : 'Reconciled'}
                    </Badge>
                  )}
                  {tx.receipt_url && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <FileImage className="w-3 h-3 me-1" />
                      {language === 'ar' ? 'إيصال' : 'Receipt'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{tx.category || (language === 'ar' ? 'غير مصنف' : 'Uncategorized')}</span>
                  <span>•</span>
                  <span>{format(new Date(tx.date), 'MMM d, yyyy', { locale })}</span>
                  {tx.tags && tx.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <Tag className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{tx.tags.join(', ')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={cn(
                'text-lg font-bold',
                tx.type === 'income' ? 'text-success' : 'text-destructive'
              )}>
                {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} SAR
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(tx)}>
                    <Pencil className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedTransaction(tx);
                    setIsReceiptDialogOpen(true);
                  }}>
                    <Paperclip className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'إرفاق إيصال' : 'Attach Receipt'}
                  </DropdownMenuItem>
                  {tx.receipt_url && (
                    <DropdownMenuItem onClick={() => window.open(tx.receipt_url, '_blank')}>
                      <Download className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'تحميل الإيصال' : 'Download Receipt'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedTransaction(tx);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <ArrowUpRight className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد عمليات' : 'No transactions'}</p>
          </div>
        )}
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل العملية' : 'Edit Transaction'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={editTransaction.type === 'expense' ? 'destructive' : 'outline'}
                onClick={() => setEditTransaction(prev => ({ ...prev, type: 'expense' }))}
              >
                <ArrowDownRight className="w-4 h-4 me-2" />
                {language === 'ar' ? 'مصروف' : 'Expense'}
              </Button>
              <Button
                type="button"
                variant={editTransaction.type === 'income' ? 'default' : 'outline'}
                className={cn(editTransaction.type === 'income' && 'bg-success hover:bg-success/90')}
                onClick={() => setEditTransaction(prev => ({ ...prev, type: 'income' }))}
              >
                <ArrowUpRight className="w-4 h-4 me-2" />
                {language === 'ar' ? 'دخل' : 'Income'}
              </Button>
            </div>

            <div>
              <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
              <Input
                value={editTransaction.description}
                onChange={(e) => { const v = e.target.value; setEditTransaction(prev => ({ ...prev, description: v })); }}
                dir="auto"
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'المبلغ' : 'Amount'}</Label>
              <Input
                type="number"
                value={editTransaction.amount}
                onChange={(e) => { const v = e.target.value; setEditTransaction(prev => ({ ...prev, amount: v })); }}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
              <Input
                type="date"
                value={editTransaction.date}
                onChange={(e) => { const v = e.target.value; setEditTransaction(prev => ({ ...prev, date: v })); }}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
              <Input
                value={editTransaction.category}
                onChange={(e) => { const v = e.target.value; setEditTransaction(prev => ({ ...prev, category: v })); }}
                dir="auto"
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea
                value={editTransaction.notes}
                onChange={(e) => { const v = e.target.value; setEditTransaction(prev => ({ ...prev, notes: v })); }}
                dir="auto"
              />
            </div>

            <Button onClick={handleUpdateTransaction} className="w-full" disabled={updateTransaction.isPending}>
              {updateTransaction.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this transaction? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive hover:bg-destructive/90">
              {deleteTransaction.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'حذف' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إرفاق إيصال' : 'Attach Receipt'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'ارفع صورة الإيصال أو الفاتورة' : 'Upload a receipt or invoice image'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div 
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingReceipt ? (
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-3 animate-spin" />
              ) : (
                <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              )}
              <p className="text-muted-foreground">
                {language === 'ar' ? 'اضغط لاختيار ملف أو اسحب الملف هنا' : 'Click to select or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'ar' ? 'صور أو PDF' : 'Images or PDF'}
              </p>
            </div>
            {selectedTransaction?.receipt_url && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-primary" />
                  <span className="text-sm">{language === 'ar' ? 'إيصال موجود' : 'Existing receipt'}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.open(selectedTransaction.receipt_url, '_blank')}>
                  <Download className="w-4 h-4 me-1" />
                  {language === 'ar' ? 'عرض' : 'View'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
