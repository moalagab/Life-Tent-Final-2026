import { useState } from 'react';
import { 
  Wallet, Plus, CreditCard, Building, Smartphone, 
  MoreVertical, Check, X, RefreshCw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useAccounts, useCreateAccount, useTransactions } from '@/hooks/useFinance';
import { useReconcileAccount, useReconcileTransactions } from '@/hooks/useAdvancedFinance';
import { toast } from 'sonner';
import { format } from 'date-fns';

const accountIcons: Record<string, React.ElementType> = {
  bank: Building,
  checking: Building,
  savings: Wallet,
  credit: CreditCard,
  wallet: Smartphone,
  investment: Wallet,
  cash: Wallet,
};

const accountColors: Record<string, string> = {
  bank: '#3b82f6',
  checking: '#3b82f6',
  savings: '#10b981',
  credit: '#ef4444',
  wallet: '#f59e0b',
  investment: '#8b5cf6',
  cash: '#22c55e',
};

export function AccountsManager() {
  const { t } = useLanguage();
  const { data: accounts, isLoading } = useAccounts();
  const { data: transactions } = useTransactions();
  const createAccount = useCreateAccount();
  const reconcileAccount = useReconcileAccount();
  const reconcileTransactions = useReconcileTransactions();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [reconcileBalance, setReconcileBalance] = useState('');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'bank',
    balance: '',
    currency: 'SAR',
    icon: '',
    color: '',
  });

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
        currency: newAccount.currency,
        icon: newAccount.icon || undefined,
        color: newAccount.color || accountColors[newAccount.type],
      });
      toast.success(t('finance.accountAdded'));
      setIsDialogOpen(false);
      setNewAccount({ name: '', type: 'bank', balance: '', currency: 'SAR', icon: '', color: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleReconcile = async () => {
    if (!selectedAccountId || !reconcileBalance) return;

    try {
      // Reconcile account balance
      await reconcileAccount.mutateAsync({
        accountId: selectedAccountId,
        balance: parseFloat(reconcileBalance),
      });

      // Mark selected transactions as reconciled
      if (selectedTxIds.length > 0) {
        await reconcileTransactions.mutateAsync(selectedTxIds);
      }

      toast.success(t('finance.reconciled'));
      setIsReconcileOpen(false);
      setSelectedAccountId(null);
      setReconcileBalance('');
      setSelectedTxIds([]);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const accountTransactions = transactions?.filter(tx => tx.account_id === selectedAccountId) || [];
  const unreconciledTxs = accountTransactions.filter(tx => !tx.is_reconciled);

  const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;

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
          <h2 className="text-2xl font-bold">{t('finance.accounts')}</h2>
          <p className="text-muted-foreground">
            {t('finance.totalBalance')}: <span className="font-bold text-foreground">{totalBalance.toLocaleString()} SAR</span>
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="w-4 h-4 me-2" />
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
              <Select 
                value={newAccount.type} 
                onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">{t('finance.bank')}</SelectItem>
                  <SelectItem value="checking">{t('finance.checking')}</SelectItem>
                  <SelectItem value="savings">{t('finance.savings')}</SelectItem>
                  <SelectItem value="credit">{t('finance.credit')}</SelectItem>
                  <SelectItem value="wallet">{t('finance.wallet')}</SelectItem>
                  <SelectItem value="investment">{t('finance.investment')}</SelectItem>
                  <SelectItem value="cash">{t('finance.cash')}</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={newAccount.currency} 
                onValueChange={(value) => setNewAccount({ ...newAccount, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR - {t('finance.accounts') === 'الحسابات' ? 'ريال سعودي' : 'Saudi Riyal'}</SelectItem>
                  <SelectItem value="USD">USD - {t('finance.accounts') === 'الحسابات' ? 'دولار أمريكي' : 'US Dollar'}</SelectItem>
                  <SelectItem value="AED">AED - {t('finance.accounts') === 'الحسابات' ? 'درهم إماراتي' : 'UAE Dirham'}</SelectItem>
                  <SelectItem value="SDG">SDG - {t('finance.accounts') === 'الحسابات' ? 'جنيه سوداني' : 'Sudanese Pound'}</SelectItem>
                  <SelectItem value="EGP">EGP - {t('finance.accounts') === 'الحسابات' ? 'جنيه مصري' : 'Egyptian Pound'}</SelectItem>
                  <SelectItem value="KWD">KWD - {t('finance.accounts') === 'الحسابات' ? 'دينار كويتي' : 'Kuwaiti Dinar'}</SelectItem>
                  <SelectItem value="EUR">EUR - {t('finance.accounts') === 'الحسابات' ? 'يورو' : 'Euro'}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder={t('finance.openingBalance')}
                value={newAccount.balance}
                onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
              />
              <Button onClick={handleCreateAccount} className="w-full" disabled={createAccount.isPending}>
                {createAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts?.map((account) => {
          const Icon = accountIcons[account.type] || Wallet;
          const color = account.color || accountColors[account.type] || '#6366f1';
          
          return (
            <div 
              key={account.id} 
              className="glass-card p-5 hover:shadow-lg transition-shadow"
              style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{account.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {t(`finance.${account.type}`)} • {account.currency || 'SAR'}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedAccountId(account.id);
                      setIsReconcileOpen(true);
                    }}>
                      <RefreshCw className="w-4 h-4 me-2" />
                      {t('finance.reconcile')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="mt-4">
                <p className="text-2xl font-bold">
                  {(account.balance || 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{account.currency || 'SAR'}</span>
                </p>
                {account.last_reconciled_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('finance.lastReconciled')}: {format(new Date(account.last_reconciled_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {(!accounts || accounts.length === 0) && (
          <div className="col-span-full text-center py-12">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">{t('finance.noAccounts')}</p>
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
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'MMM d')}</p>
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
    </div>
  );
}
