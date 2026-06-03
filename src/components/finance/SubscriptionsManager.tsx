import { useState, useMemo, useEffect } from 'react';
import { 
  RefreshCw, Plus, Calendar, AlertTriangle, Star,
  Pause, Play, Trash2, Loader2, MoreVertical, Bell, Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useSubscriptions, useAccounts } from '@/hooks/useFinance';
import { useCreateSubscription, useUpdateSubscription, useDeleteSubscription } from '@/hooks/useAdvancedFinance';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { format, addDays, addMonths, addYears, isAfter, isBefore, differenceInDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const cycleLabels: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
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
  const { scheduleSubscriptionReminder, enabled: notificationsEnabled } = useNotifications();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const [formData, setFormData] = useState({
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

  const resetForm = () => {
    setFormData({
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
  };

  // Schedule notifications for upcoming renewals
  useEffect(() => {
    if (notificationsEnabled && subscriptions) {
      subscriptions.forEach(sub => {
        if (sub.is_active && sub.next_billing_date) {
          const billingDate = new Date(sub.next_billing_date);
          const now = new Date();
          const daysUntil = differenceInDays(billingDate, now);
          
          // Only schedule for subscriptions due in the next 7 days
          if (daysUntil > 0 && daysUntil <= 7) {
            scheduleSubscriptionReminder(sub.name, sub.amount, billingDate, sub.id);
          }
        }
      });
    }
  }, [subscriptions, notificationsEnabled, scheduleSubscriptionReminder]);

  // Calculate totals
  const monthlyTotal = useMemo(() => {
    if (!subscriptions) return 0;
    return subscriptions.reduce((sum, sub) => {
      if (!sub.is_active) return sum;
      const cycle = sub.billing_cycle as string;
      const multiplier = cycle === 'yearly' || cycle === 'annual' ? 1/12 
        : cycle === 'quarterly' ? 1/3 
        : cycle === 'weekly' ? 4 
        : 1;
      return sum + (sub.amount * multiplier);
    }, 0);
  }, [subscriptions]);

  const annualTotal = monthlyTotal * 12;

  // Upcoming renewals (next 7 days)
  const upcomingRenewals = useMemo(() => {
    if (!subscriptions) return [];
    const in7Days = addDays(new Date(), 7);
    return subscriptions
      .filter(sub => {
        if (!sub.is_active) return false;
        const nextDate = new Date(sub.next_billing_date);
        return isAfter(nextDate, new Date()) && isBefore(nextDate, in7Days);
      })
      .sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime());
  }, [subscriptions]);

  // Overdue subscriptions (active but billing date passed)
  const overdueSubs = useMemo(() => {
    if (!subscriptions) return [];
    return subscriptions
      .filter(sub => sub.is_active && isBefore(new Date(sub.next_billing_date), new Date()))
      .sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime());
  }, [subscriptions]);

  // Calendar data
  const calendarData = useMemo(() => {
    if (!subscriptions) return [];
    const months: { month: Date; subscriptions: typeof subscriptions }[] = [];
    
    for (let i = 0; i < 12; i++) {
      const monthDate = addMonths(new Date(), i);
      const monthSubs = subscriptions.filter(sub => {
        if (!sub.is_active) return false;
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
    if (!formData.name || !formData.amount || !formData.next_billing_date) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      const result = await createSubscription.mutateAsync({
        name: formData.name,
        provider: formData.provider || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        next_billing_date: formData.next_billing_date,
        category: formData.category || null,
        payment_account_id: formData.payment_account_id || null,
        notes: formData.notes || null,
        is_active: true,
      });
      
      // Schedule notification
      if (notificationsEnabled && result) {
        scheduleSubscriptionReminder(
          formData.name,
          parseFloat(formData.amount),
          new Date(formData.next_billing_date),
          result.id
        );
      }
      
      toast.success(t('finance.subscriptionAdded'));
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateSubscription = async () => {
    if (!editingSub || !formData.name || !formData.amount) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await updateSubscription.mutateAsync({
        id: editingSub.id,
        name: formData.name,
        provider: formData.provider || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        next_billing_date: formData.next_billing_date || editingSub.next_billing_date,
        category: formData.category || null,
        payment_account_id: formData.payment_account_id || null,
        notes: formData.notes || null,
      });
      toast.success(language === 'ar' ? 'تم تحديث الاشتراك' : 'Subscription updated');
      setIsEditDialogOpen(false);
      setEditingSub(null);
      resetForm();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const openEditDialog = (sub: any) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      provider: sub.provider || '',
      amount: sub.amount.toString(),
      currency: sub.currency || 'SAR',
      billing_cycle: sub.billing_cycle || 'monthly',
      next_billing_date: sub.next_billing_date || '',
      category: sub.category || '',
      payment_account_id: sub.payment_account_id || '',
      notes: sub.notes || '',
    });
    setIsEditDialogOpen(true);
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

  const SubscriptionForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pe-2">
      <div>
        <Label>{language === 'ar' ? 'اسم الاشتراك' : 'Subscription Name'} *</Label>
        <Input
          dir="auto"
          placeholder={t('finance.subscriptionName')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'المزود' : 'Provider'}</Label>
        <Input
          dir="auto"
          placeholder={t('finance.provider')}
          value={formData.provider}
          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{language === 'ar' ? 'المبلغ' : 'Amount'} *</Label>
          <Input
            type="number"
            placeholder={t('finance.amount')}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>{language === 'ar' ? 'العملة' : 'Currency'}</Label>
          <Select 
            value={formData.currency} 
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SAR">SAR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
              <SelectItem value="SDG">SDG</SelectItem>
              <SelectItem value="EGP">EGP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>{language === 'ar' ? 'دورة الفوترة' : 'Billing Cycle'}</Label>
        <Select 
          value={formData.billing_cycle} 
          onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">{t('finance.weekly')}</SelectItem>
            <SelectItem value="monthly">{t('finance.monthly')}</SelectItem>
            <SelectItem value="quarterly">{t('finance.quarterly')}</SelectItem>
            <SelectItem value="annual">{t('finance.annual')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{language === 'ar' ? 'تاريخ الفوترة القادم' : 'Next Billing Date'} *</Label>
        <Input
          type="date"
          value={formData.next_billing_date}
          onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'التصنيف' : 'Category'}</Label>
        <Input
          dir="auto"
          placeholder={t('finance.category')}
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'حساب الدفع' : 'Payment Account'}</Label>
        <Select 
          value={formData.payment_account_id || 'none'} 
          onValueChange={(value) => setFormData({ ...formData, payment_account_id: value === 'none' ? '' : value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={t('finance.selectAccount')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('common.none')}</SelectItem>
            {accounts?.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
        <Textarea
          dir="auto"
          placeholder={t('finance.notes')}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1"
        />
      </div>
      <Button 
        onClick={isEdit ? handleUpdateSubscription : handleCreateSubscription} 
        className="w-full" 
        disabled={createSubscription.isPending || updateSubscription.isPending}
      >
        {(createSubscription.isPending || updateSubscription.isPending) ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isEdit ? t('common.update') : t('common.add')}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header — wraps on mobile */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold">{t('finance.subscriptions')}</h2>
          <p className="text-sm text-muted-foreground">
            {subscriptions?.filter(s => s.is_active).length || 0} {t('finance.activeSubscriptions')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <Button variant="gold" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 me-2" />
            <span className="hidden sm:inline">{t('finance.addSubscription')}</span>
            <span className="sm:hidden">{language === 'ar' ? 'إضافة' : 'Add'}</span>
          </Button>
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

      {/* Overdue Alerts — highest priority */}
      {overdueSubs.length > 0 && (
        <div className="glass-card p-4 border-destructive/60 border bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="font-semibold text-destructive">
              {language === 'ar' ? 'اشتراكات متأخرة' : 'Overdue Subscriptions'}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {overdueSubs.map((sub) => {
              const daysLate = Math.abs(differenceInDays(new Date(sub.next_billing_date), new Date()));
              return (
                <Badge key={sub.id} variant="destructive" className="py-1.5">
                  {sub.name} · {language === 'ar' ? `متأخر ${daysLate} يوم` : `${daysLate}d late`} ({sub.amount} {sub.currency})
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Alerts */}
      {upcomingRenewals.length > 0 && (
        <div className="glass-card p-4 border-warning/50 border">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="font-semibold">{t('finance.upcomingRenewals')}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcomingRenewals.map((sub) => (
              <Badge key={sub.id} variant="secondary" className="py-1.5">
                {sub.name} - {format(new Date(sub.next_billing_date), 'MMM d', { locale })} ({sub.amount} {sub.currency})
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
            const isOverdue = sub.is_active && daysUntil < 0;

            return (
              <div 
                key={sub.id} 
                className={cn(
                  'glass-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
                  !sub.is_active && 'opacity-60',
                  isOverdue && 'border-destructive/60 border'
                )}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold truncate">{sub.name}</h4>
                      {!sub.is_active && (
                        <Badge variant="secondary">{t('finance.paused')}</Badge>
                      )}
                      {isOverdue && (
                        <Badge variant="destructive">
                          {language === 'ar' ? `متأخر ${Math.abs(daysUntil)} يوم` : `${Math.abs(daysUntil)}d overdue`}
                        </Badge>
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

                <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
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
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => openEditDialog(sub)}>
                        <Edit className="w-4 h-4 me-2" />
                        {t('common.edit')}
                      </DropdownMenuItem>
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

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('finance.addSubscription')}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'أضف اشتراكًا جديدًا لتتبعه' : 'Add a new subscription to track'}
            </DialogDescription>
          </DialogHeader>
          <SubscriptionForm />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingSub(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل الاشتراك' : 'Edit Subscription'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'عدّل تفاصيل الاشتراك' : 'Update subscription details'}
            </DialogDescription>
          </DialogHeader>
          <SubscriptionForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
}
