import { useState, useMemo } from 'react';
import { 
  RefreshCw, Plus, Calendar, AlertTriangle, Star,
  Pause, Play, Trash2, Loader2, MoreVertical, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useSubscriptions, useAccounts } from '@/hooks/useFinance';
import { useCreateSubscription, useUpdateSubscription, useDeleteSubscription } from '@/hooks/useAdvancedFinance';
import { toast } from 'sonner';
import { format, addDays, addMonths, addYears, isAfter, isBefore, differenceInDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const cycleLabels: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

const cycleDays: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  annual: 365,
};

export function SubscriptionsManager() {
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage;
  const locale = language === 'ar' ? ar : enUS;

  const { data: subscriptions, isLoading } = useSubscriptions();
  const { data: accounts } = useAccounts();
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const [newSub, setNewSub] = useState({
    name: '',
    provider: '',
    amount: '',
    currency: 'SAR',
    billing_cycle: 'monthly',
    next_billing_date: '',
    category: '',
    payment_account_id: '',
    notes: '',
  });

  // Calculate totals
  const monthlyTotal = useMemo(() => {
    if (!subscriptions) return 0;
    return subscriptions.reduce((sum, sub) => {
      const cycle = sub.billing_cycle as string;
      const multiplier = cycle === 'yearly' || cycle === 'annual' ? 1/12 
        : cycle === 'quarterly' ? 1/3 
        : cycle === 'weekly' ? 4 
        : 1;
      return sum + (sub.amount * multiplier);
    }, 0);
  }, [subscriptions]);

  const annualTotal = monthlyTotal * 12;

  // Upcoming renewals
  const upcomingRenewals = useMemo(() => {
    if (!subscriptions) return [];
    const in7Days = addDays(new Date(), 7);
    return subscriptions
      .filter(sub => {
        const nextDate = new Date(sub.next_billing_date);
        return isAfter(nextDate, new Date()) && isBefore(nextDate, in7Days);
      })
      .sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime());
  }, [subscriptions]);

  // Calendar data
  const calendarData = useMemo(() => {
    if (!subscriptions) return [];
    const months: { month: Date; subscriptions: typeof subscriptions }[] = [];
    
    for (let i = 0; i < 12; i++) {
      const monthDate = addMonths(new Date(), i);
      const monthSubs = subscriptions.filter(sub => {
        // Simulate recurring dates
        let nextDate = new Date(sub.next_billing_date);
        const cycle = sub.billing_cycle as string;
        while (nextDate < monthDate) {
          if (cycle === 'monthly') nextDate = addMonths(nextDate, 1);
          else if (cycle === 'yearly' || cycle === 'annual') nextDate = addYears(nextDate, 1);
          else if (cycle === 'quarterly') nextDate = addMonths(nextDate, 3);
          else nextDate = addDays(nextDate, 7);
        }
        return nextDate.getMonth() === monthDate.getMonth() && 
               nextDate.getFullYear() === monthDate.getFullYear();
      });
      months.push({ month: monthDate, subscriptions: monthSubs });
    }
    
    return months;
  }, [subscriptions]);

  const handleCreateSubscription = async () => {
    if (!newSub.name || !newSub.amount || !newSub.next_billing_date) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createSubscription.mutateAsync({
        name: newSub.name,
        provider: newSub.provider || null,
        amount: parseFloat(newSub.amount),
        currency: newSub.currency,
        billing_cycle: newSub.billing_cycle,
        next_billing_date: newSub.next_billing_date,
        category: newSub.category || null,
        payment_account_id: newSub.payment_account_id || null,
        notes: newSub.notes || null,
        is_active: true,
      });
      toast.success(t('finance.subscriptionAdded'));
      setIsDialogOpen(false);
      setNewSub({
        name: '',
        provider: '',
        amount: '',
        currency: 'SAR',
        billing_cycle: 'monthly',
        next_billing_date: '',
        category: '',
        payment_account_id: '',
        notes: '',
      });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handlePauseSubscription = async (id: string, currentStatus: boolean) => {
    try {
      await updateSubscription.mutateAsync({
        id,
        is_active: !currentStatus,
      });
      toast.success(currentStatus ? t('finance.subscriptionPaused') : t('finance.subscriptionResumed'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      await deleteSubscription.mutateAsync(id);
      toast.success(t('finance.subscriptionDeleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleRateSubscription = async (id: string, rating: number) => {
    try {
      await updateSubscription.mutateAsync({ id, usage_rating: rating });
      toast.success(t('finance.ratingUpdated'));
    } catch (error) {
      toast.error(t('common.error'));
    }
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
          <h2 className="text-2xl font-bold">{t('finance.subscriptions')}</h2>
          <p className="text-muted-foreground">
            {subscriptions?.length || 0} {t('finance.activeSubscriptions')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            {t('finance.list')}
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('calendar')}
          >
            <Calendar className="w-4 h-4 me-1" />
            {t('finance.calendar')}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="w-4 h-4 me-2" />
                {t('finance.addSubscription')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('finance.addSubscription')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
                <Input
                  placeholder={t('finance.subscriptionName')}
                  value={newSub.name}
                  onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                />
                <Input
                  placeholder={t('finance.provider')}
                  value={newSub.provider}
                  onChange={(e) => setNewSub({ ...newSub, provider: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder={t('finance.amount')}
                    value={newSub.amount}
                    onChange={(e) => setNewSub({ ...newSub, amount: e.target.value })}
                  />
                  <Select 
                    value={newSub.currency} 
                    onValueChange={(value) => setNewSub({ ...newSub, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select 
                  value={newSub.billing_cycle} 
                  onValueChange={(value) => setNewSub({ ...newSub, billing_cycle: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t('finance.weekly')}</SelectItem>
                    <SelectItem value="monthly">{t('finance.monthly')}</SelectItem>
                    <SelectItem value="quarterly">{t('finance.quarterly')}</SelectItem>
                    <SelectItem value="annual">{t('finance.annual')}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  placeholder={t('finance.nextBillingDate')}
                  value={newSub.next_billing_date}
                  onChange={(e) => setNewSub({ ...newSub, next_billing_date: e.target.value })}
                />
                <Input
                  placeholder={t('finance.category')}
                  value={newSub.category}
                  onChange={(e) => setNewSub({ ...newSub, category: e.target.value })}
                />
                <Select 
                  value={newSub.payment_account_id} 
                  onValueChange={(value) => setNewSub({ ...newSub, payment_account_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('finance.selectAccount')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('common.none')}</SelectItem>
                    {accounts?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder={t('finance.notes')}
                  value={newSub.notes}
                  onChange={(e) => setNewSub({ ...newSub, notes: e.target.value })}
                />
                <Button onClick={handleCreateSubscription} className="w-full" disabled={createSubscription.isPending}>
                  {createSubscription.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{t('finance.monthlyTotal')}</p>
          <p className="text-2xl font-bold">{monthlyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{t('finance.annualTotal')}</p>
          <p className="text-2xl font-bold">{annualTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-warning" />
            <p className="text-sm text-muted-foreground">{t('finance.renewingSoon')}</p>
          </div>
          <p className="text-2xl font-bold">{upcomingRenewals.length}</p>
        </div>
      </div>

      {/* Upcoming Alerts */}
      {upcomingRenewals.length > 0 && (
        <div className="glass-card p-4 border-warning/50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="font-semibold">{t('finance.upcomingRenewals')}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcomingRenewals.map((sub) => (
              <Badge key={sub.id} variant="secondary">
                {sub.name} - {format(new Date(sub.next_billing_date), 'MMM d', { locale })} ({sub.amount} SAR)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {view === 'list' ? (
        /* List View */
        <div className="space-y-3">
          {subscriptions?.map((sub) => {
            const daysUntil = differenceInDays(new Date(sub.next_billing_date), new Date());
            const isUpcoming = daysUntil >= 0 && daysUntil <= 7;

            return (
              <div 
                key={sub.id} 
                className={cn(
                  'glass-card p-4 flex items-center justify-between',
                  !sub.is_active && 'opacity-60'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{sub.name}</h4>
                      {!sub.is_active && (
                        <Badge variant="secondary">{t('finance.paused')}</Badge>
                      )}
                      {isUpcoming && sub.is_active && (
                        <Badge variant="outline" className="border-warning text-warning">
                          {t('finance.renewingSoon')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {sub.provider && <span>{sub.provider}</span>}
                      {sub.provider && <span>•</span>}
                      <span>{t(`finance.${sub.billing_cycle}`)}</span>
                      <span>•</span>
                      <span>{t('finance.next')}: {format(new Date(sub.next_billing_date), 'MMM d', { locale })}</span>
                    </div>
                    {/* Usage Rating */}
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRateSubscription(sub.id, star)}
                          className="p-0.5"
                        >
                          <Star
                            className={cn(
                              'w-3 h-3 transition-colors',
                              star <= (sub.usage_rating || 0)
                                ? 'fill-warning text-warning'
                                : 'text-muted-foreground/30'
                            )}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-muted-foreground ms-1">
                        {t('finance.usageRating')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-end">
                    <p className="font-bold text-lg">{sub.amount.toLocaleString()} {sub.currency || 'SAR'}</p>
                    <p className="text-xs text-muted-foreground">/{t(`finance.${sub.billing_cycle}`)}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePauseSubscription(sub.id, sub.is_active)}>
                        {sub.is_active ? (
                          <>
                            <Pause className="w-4 h-4 me-2" />
                            {t('finance.pause')}
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 me-2" />
                            {t('finance.resume')}
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteSubscription(sub.id)}
                      >
                        <Trash2 className="w-4 h-4 me-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          {(!subscriptions || subscriptions.length === 0) && (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{t('finance.noSubscriptions')}</p>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {calendarData.map(({ month, subscriptions: monthSubs }) => {
            const total = monthSubs.reduce((sum, s) => sum + s.amount, 0);
            
            return (
              <div key={month.toISOString()} className="glass-card p-4">
                <h3 className="font-semibold mb-3">{format(month, 'MMMM yyyy', { locale })}</h3>
                <div className="space-y-2 mb-3">
                  {monthSubs.slice(0, 3).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{sub.name}</span>
                      <span className="font-medium">{sub.amount}</span>
                    </div>
                  ))}
                  {monthSubs.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{monthSubs.length - 3} {t('finance.more')}
                    </p>
                  )}
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('finance.total')}</span>
                    <span className="font-bold">{total.toLocaleString()} SAR</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
