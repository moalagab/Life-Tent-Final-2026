import { useState, useMemo } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Plus, Filter, Search,
  Upload, Tag, Paperclip, Split, Loader2, MoreVertical, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useAccounts, useTransactions, useCreateTransaction } from '@/hooks/useFinance';
import { useCategories } from '@/hooks/useAdvancedFinance';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function TransactionsManager() {
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage;
  const locale = language === 'ar' ? ar : enUS;
  
  const { data: accounts } = useAccounts();
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const { data: projects } = useProjects();
  const createTransaction = useCreateTransaction();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('current');
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    account_id: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState('');

  const handleCreateTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.account_id) {
      toast.error(t('common.fillAllFields'));
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
      toast.success(t('finance.transactionAdded'));
      setIsDialogOpen(false);
      setNewTransaction({ 
        description: '', 
        amount: '', 
        type: 'expense', 
        category: '', 
        account_id: '',
        project_id: '',
        date: new Date().toISOString().split('T')[0],
        tags: [],
      });
    } catch (error) {
      toast.error(t('common.error'));
    }
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

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(query) ||
        tx.category?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === filterCategory);
    }

    // Account filter
    if (filterAccount !== 'all') {
      filtered = filtered.filter(tx => tx.account_id === filterAccount);
    }

    // Month filter
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
          <h2 className="text-2xl font-bold">{t('finance.transactions')}</h2>
          <p className="text-muted-foreground">
            {filteredTransactions.length} {t('finance.transactionsFound')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 me-2" />
            {t('finance.import')}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="w-4 h-4 me-2" />
                {t('finance.addTransaction')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('finance.addTransaction')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={newTransaction.type === 'expense' ? 'destructive' : 'outline'}
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                  >
                    <ArrowDownRight className="w-4 h-4 me-2" />
                    {t('finance.expense')}
                  </Button>
                  <Button
                    type="button"
                    variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                    className={newTransaction.type === 'income' ? 'bg-success hover:bg-success/90' : ''}
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                  >
                    <ArrowUpRight className="w-4 h-4 me-2" />
                    {t('finance.income')}
                  </Button>
                </div>

                <Input
                  placeholder={t('finance.description')}
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
                
                <Input
                  type="number"
                  placeholder={t('finance.amount')}
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                />

                <Input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />

                <Select 
                  value={newTransaction.account_id} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, account_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('finance.selectAccount')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={newTransaction.category} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('finance.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                    {uniqueCategories.map((cat) => (
                      !categories?.find(c => c.name === cat) && (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={newTransaction.project_id || 'none'} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, project_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('finance.linkToProject')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('common.none')}</SelectItem>
                    {projects?.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>{proj.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Tags */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('finance.tags')}</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder={t('finance.addTag')}
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
                  {createTransaction.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{t('finance.totalIncome')}</p>
          <p className="text-2xl font-bold text-success">+{totals.income.toLocaleString()} SAR</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{t('finance.totalExpenses')}</p>
          <p className="text-2xl font-bold text-destructive">-{totals.expense.toLocaleString()} SAR</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{t('finance.net')}</p>
          <p className={cn('text-2xl font-bold', totals.net >= 0 ? 'text-success' : 'text-destructive')}>
            {totals.net >= 0 ? '+' : ''}{totals.net.toLocaleString()} SAR
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={t('finance.searchTransactions')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('finance.allTypes')}</SelectItem>
            <SelectItem value="income">{t('finance.income')}</SelectItem>
            <SelectItem value="expense">{t('finance.expense')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('finance.allCategories')}</SelectItem>
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
            <SelectItem value="all">{t('finance.allAccounts')}</SelectItem>
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
            <SelectItem value="all">{t('finance.allTime')}</SelectItem>
            <SelectItem value="current">{t('finance.currentMonth')}</SelectItem>
            <SelectItem value="previous">{t('finance.previousMonth')}</SelectItem>
            <SelectItem value="last3">{t('finance.last3Months')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <div className="glass-card divide-y divide-border">
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
              )}>
                {tx.type === 'income' ? (
                  <ArrowUpRight className="w-5 h-5 text-success" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{tx.description}</p>
                  {tx.is_reconciled && (
                    <Badge variant="outline" className="text-xs">{t('finance.reconciled')}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{tx.category || t('finance.uncategorized')}</span>
                  <span>•</span>
                  <span>{format(new Date(tx.date), 'MMM d, yyyy', { locale })}</span>
                  {tx.tags && tx.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <Tag className="w-3 h-3" />
                      <span>{tx.tags.join(', ')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                'text-lg font-bold',
                tx.type === 'income' ? 'text-success' : 'text-destructive'
              )}>
                {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} SAR
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Split className="w-4 h-4 me-2" />
                    {t('finance.splitTransaction')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Paperclip className="w-4 h-4 me-2" />
                    {t('finance.attachReceipt')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 me-2" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <ArrowUpRight className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">{t('finance.noTransactions')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
