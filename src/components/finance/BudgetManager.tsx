import { useState, useMemo } from 'react';
import { 
  Plus, Wallet, Target, TrendingUp, AlertTriangle,
  ChevronRight, Lock, Unlock, Loader2, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useMonthlyStats, useTransactions } from '@/hooks/useFinance';
import { useEnvelopes, useCreateEnvelope, useUpdateEnvelope, useSinkingFunds, useCreateSinkingFund, useUpdateSinkingFund } from '@/hooks/useAdvancedFinance';
import { toast } from 'sonner';
import { format, differenceInMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function BudgetManager() {
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage;
  const locale = language === 'ar' ? ar : enUS;

  const { data: monthlyStats } = useMonthlyStats();
  const { data: transactions } = useTransactions();
  const { data: envelopes, isLoading: envelopesLoading } = useEnvelopes();
  const { data: sinkingFunds, isLoading: fundsLoading } = useSinkingFunds();
  
  const createEnvelope = useCreateEnvelope();
  const updateEnvelope = useUpdateEnvelope();
  const createSinkingFund = useCreateSinkingFund();
  const updateSinkingFund = useUpdateSinkingFund();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEnvelopeDialogOpen, setIsEnvelopeDialogOpen] = useState(false);
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);

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
      toast.success(t('finance.envelopeCreated'));
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

    // Calculate monthly contribution if target date is set
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
      toast.success(t('finance.fundCreated'));
      setIsFundDialogOpen(false);
      setNewFund({ name: '', target_amount: '', target_date: '', monthly_contribution: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleAddToEnvelope = async (id: string, amount: number) => {
    const envelope = envelopes?.find(e => e.id === id);
    if (!envelope) return;

    try {
      await updateEnvelope.mutateAsync({
        id,
        available_amount: (envelope.available_amount || 0) + amount,
      });
      toast.success(t('finance.envelopeUpdated'));
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
      toast.success(t('finance.fundUpdated'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const isLoading = envelopesLoading || fundsLoading;

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
          <h2 className="text-2xl font-bold">{t('finance.budget')}</h2>
          <p className="text-muted-foreground">{format(new Date(), 'MMMM yyyy', { locale })}</p>
        </div>
      </div>

      {/* ZBB Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{t('finance.monthlyIncome')}</p>
          <p className="text-2xl font-bold text-success">+{totalIncome.toLocaleString()} SAR</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{t('finance.assigned')}</p>
          <p className="text-2xl font-bold">{totalAssigned.toLocaleString()} SAR</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{t('finance.unassigned')}</p>
          <p className={cn(
            'text-2xl font-bold',
            unassigned > 0 ? 'text-warning' : unassigned < 0 ? 'text-destructive' : 'text-success'
          )}>
            {unassigned.toLocaleString()} SAR
          </p>
          {unassigned !== 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {unassigned > 0 ? t('finance.assignRemaining') : t('finance.overAssigned')}
            </p>
          )}
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{t('finance.runway')}</p>
          <p className="text-2xl font-bold">{runwayMonths} {t('finance.months')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('finance.ifIncomeStops')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('finance.overview')}</TabsTrigger>
          <TabsTrigger value="envelopes">{t('finance.envelopes')}</TabsTrigger>
          <TabsTrigger value="sinkingFunds">{t('finance.sinkingFunds')}</TabsTrigger>
          <TabsTrigger value="forecast">{t('finance.forecast')}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Category Spending */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">{t('finance.spendingByCategory')}</h3>
            <div className="space-y-4">
              {categorySpending.slice(0, 8).map(({ category, amount }) => {
                const budget = 5000; // Default budget per category
                const percentage = Math.min((amount / budget) * 100, 100);
                const isOver = amount > budget;
                
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{category}</span>
                      <span className={cn(
                        'text-sm font-bold',
                        isOver ? 'text-destructive' : 'text-foreground'
                      )}>
                        {amount.toLocaleString()} / {budget.toLocaleString()} SAR
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={cn('h-2', isOver && '[&>div]:bg-destructive')}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Envelopes */}
        <TabsContent value="envelopes" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Dialog open={isEnvelopeDialogOpen} onOpenChange={setIsEnvelopeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold">
                  <Plus className="w-4 h-4 me-2" />
                  {t('finance.createEnvelope')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('finance.createEnvelope')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder={t('finance.envelopeName')}
                    value={newEnvelope.name}
                    onChange={(e) => setNewEnvelope({ ...newEnvelope, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder={t('finance.targetAmount')}
                    value={newEnvelope.target_amount}
                    onChange={(e) => setNewEnvelope({ ...newEnvelope, target_amount: e.target.value })}
                  />
                  <Input
                    type="color"
                    value={newEnvelope.color}
                    onChange={(e) => setNewEnvelope({ ...newEnvelope, color: e.target.value })}
                  />
                  <Button onClick={handleCreateEnvelope} className="w-full" disabled={createEnvelope.isPending}>
                    {createEnvelope.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.create')}
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
                  className="glass-card p-5"
                  style={{ borderTopColor: envelope.color || '#10b981', borderTopWidth: '3px' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{envelope.name}</h4>
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('finance.available')}</span>
                      <span className="font-bold">{available.toLocaleString()} SAR</span>
                    </div>
                    {target > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('finance.target')}</span>
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
                <p className="text-muted-foreground">{t('finance.noEnvelopes')}</p>
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
                  {t('finance.createSinkingFund')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('finance.createSinkingFund')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder={t('finance.fundName')}
                    value={newFund.name}
                    onChange={(e) => setNewFund({ ...newFund, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder={t('finance.targetAmount')}
                    value={newFund.target_amount}
                    onChange={(e) => setNewFund({ ...newFund, target_amount: e.target.value })}
                  />
                  <Input
                    type="date"
                    placeholder={t('finance.targetDate')}
                    value={newFund.target_date}
                    onChange={(e) => setNewFund({ ...newFund, target_date: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder={t('finance.monthlyContribution')}
                    value={newFund.monthly_contribution}
                    onChange={(e) => setNewFund({ ...newFund, monthly_contribution: e.target.value })}
                  />
                  <Button onClick={handleCreateFund} className="w-full" disabled={createSinkingFund.isPending}>
                    {createSinkingFund.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.create')}
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
                <div key={fund.id} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{fund.name}</h4>
                    <Target className="w-4 h-4 text-muted-foreground" />
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
                        <p className="text-muted-foreground">{t('finance.remaining')}</p>
                        <p className="font-medium">{remaining.toLocaleString()} SAR</p>
                      </div>
                      {fund.target_date && (
                        <div>
                          <p className="text-muted-foreground">{t('finance.deadline')}</p>
                          <p className="font-medium">{format(new Date(fund.target_date), 'MMM yyyy', { locale })}</p>
                        </div>
                      )}
                      {fund.monthly_contribution && (
                        <div>
                          <p className="text-muted-foreground">{t('finance.monthlyContribution')}</p>
                          <p className="font-medium">{fund.monthly_contribution.toLocaleString()} SAR</p>
                        </div>
                      )}
                      {monthsLeft !== null && (
                        <div>
                          <p className="text-muted-foreground">{t('finance.monthsLeft')}</p>
                          <p className={cn('font-medium', !onTrack && 'text-warning')}>
                            {monthsLeft} {t('finance.months')}
                          </p>
                        </div>
                      )}
                    </div>
                    {!onTrack && (
                      <div className="flex items-center gap-2 text-warning text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        {t('finance.behindSchedule')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleAddToFund(fund.id, fund.monthly_contribution || 100)}
                    >
                      +{(fund.monthly_contribution || 100).toLocaleString()}
                    </Button>
                  </div>
                </div>
              );
            })}

            {(!sinkingFunds || sinkingFunds.length === 0) && (
              <div className="col-span-full text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{t('finance.noSinkingFunds')}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Forecast */}
        <TabsContent value="forecast" className="space-y-6 mt-6">
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">{t('finance.12MonthForecast')}</h3>
            <div className="space-y-4">
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() + i);
                const projectedIncome = totalIncome * (1 + (Math.random() * 0.1 - 0.05)); // ±5% variation
                const projectedExpenses = monthlyExpenses * (1 + (Math.random() * 0.15 - 0.05)); // -5% to +10%
                const projectedNet = projectedIncome - projectedExpenses;

                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="font-medium">{format(date, 'MMMM yyyy', { locale })}</span>
                    <div className="flex items-center gap-8">
                      <span className="text-success">+{projectedIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      <span className="text-destructive">-{projectedExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      <span className={cn(
                        'font-bold',
                        projectedNet >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {projectedNet >= 0 ? '+' : ''}{projectedNet.toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
