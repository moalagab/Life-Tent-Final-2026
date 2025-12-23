import { MainLayout } from '@/components/layout/MainLayout';
import { 
  Wallet, TrendingUp, TrendingDown, 
  PiggyBank, ArrowUpRight, ArrowDownRight, Plus, RefreshCw, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useAccounts, useTransactions, useMonthlyStats, useSubscriptions, useCreateTransaction, useCreateAccount } from '@/hooks/useFinance';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FinanceCharts } from '@/components/finance/FinanceCharts';

const currencies = ['SAR', 'USD', 'AED', 'KWD'];

export default function Finance() {
  const { t } = useLanguage();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(10);
  const { data: monthlyStats, isLoading: statsLoading } = useMonthlyStats();
  const { data: subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
  const createTransaction = useCreateTransaction();
  const createAccount = useCreateAccount();

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    account_id: '',
  });
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'checking',
    balance: '',
  });

  const isLoading = accountsLoading || transactionsLoading || statsLoading || subscriptionsLoading;

  const stats = [
    { 
      label: t('finance.netWorth'), 
      value: `SAR ${(monthlyStats?.netWorth || 0).toLocaleString()}`, 
      change: '+12.5%', 
      trend: 'up', 
      icon: Wallet, 
      color: 'primary' 
    },
    { 
      label: t('finance.monthlyIncome'), 
      value: `SAR ${(monthlyStats?.monthlyIncome || 0).toLocaleString()}`, 
      change: '+8.2%', 
      trend: 'up', 
      icon: TrendingUp, 
      color: 'success' 
    },
    { 
      label: t('finance.monthlyExpenses'), 
      value: `SAR ${(monthlyStats?.monthlyExpenses || 0).toLocaleString()}`, 
      change: '-5.2%', 
      trend: 'down', 
      icon: TrendingDown, 
      color: 'destructive' 
    },
    { 
      label: t('finance.savingsRate'), 
      value: `${monthlyStats?.savingsRate || 0}%`, 
      change: '+3.1%', 
      trend: 'up', 
      icon: PiggyBank, 
      color: 'primary' 
    },
  ];

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
        date: new Date().toISOString().split('T')[0],
      });
      toast.success(t('finance.transactionAdded'));
      setIsTransactionDialogOpen(false);
      setNewTransaction({ description: '', amount: '', type: 'expense', category: '', account_id: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.name) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createAccount.mutateAsync({
        name: newAccount.name,
        type: newAccount.type,
        balance: parseFloat(newAccount.balance) || 0,
      });
      toast.success(t('finance.accountAdded'));
      setIsAccountDialogOpen(false);
      setNewAccount({ name: '', type: 'checking', balance: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('finance.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('finance.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <Plus className="w-5 h-5 me-2" />
                  {t('finance.addAccount')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('finance.addAccount')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder={t('finance.accountName')}
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  />
                  <Select value={newAccount.type} onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">{t('finance.checking')}</SelectItem>
                      <SelectItem value="savings">{t('finance.savings')}</SelectItem>
                      <SelectItem value="credit">{t('finance.credit')}</SelectItem>
                      <SelectItem value="investment">{t('finance.investment')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder={t('finance.balance')}
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                  />
                  <Button onClick={handleCreateAccount} className="w-full" disabled={createAccount.isPending}>
                    {createAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" size="lg">
                  <Plus className="w-5 h-5 me-2" />
                  {t('finance.addTransaction')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('finance.addTransaction')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
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
                  <Select value={newTransaction.type} onValueChange={(value: 'income' | 'expense') => setNewTransaction({ ...newTransaction, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">{t('finance.income')}</SelectItem>
                      <SelectItem value="expense">{t('finance.expense')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newTransaction.account_id} onValueChange={(value) => setNewTransaction({ ...newTransaction, account_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('finance.selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={t('finance.category')}
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  />
                  <Button onClick={handleCreateTransaction} className="w-full" disabled={createTransaction.isPending}>
                    {createTransaction.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                stat.color === 'primary' && 'bg-primary/10',
                stat.color === 'success' && 'bg-success/10',
                stat.color === 'destructive' && 'bg-destructive/10'
              )}>
                <stat.icon className={cn(
                  'w-5 h-5',
                  stat.color === 'primary' && 'text-primary',
                  stat.color === 'success' && 'text-success',
                  stat.color === 'destructive' && 'text-destructive'
                )} />
              </div>
              <span className={cn(
                'flex items-center gap-1 text-xs font-medium',
                stat.trend === 'up' ? 'text-success' : 'text-destructive'
              )}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-foreground">{t('finance.recentTransactions')}</h3>
            <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              {t('common.viewAll')} <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
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
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.category || t('finance.uncategorized')} • {format(new Date(tx.date), 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-bold',
                    tx.type === 'income' ? 'text-success' : 'text-destructive'
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} SAR
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{t('finance.noTransactions')}</p>
            </div>
          )}
        </div>

        {/* Subscriptions */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-foreground">{t('finance.subscriptions')}</h3>
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </div>

          {subscriptions && subscriptions.length > 0 ? (
            <>
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📦</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('finance.next')}: {format(new Date(sub.next_billing_date), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {sub.amount} {sub.currency || 'SAR'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('finance.monthlyTotal')}</span>
                  <span className="font-bold gold-text">
                    {subscriptions.reduce((acc, s) => acc + s.amount, 0)} SAR
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{t('finance.noSubscriptions')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <FinanceCharts />
    </MainLayout>
  );
}
