import { Plus, FileText, Target, Wallet, Calendar, Timer, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCreateTask } from '@/hooks/useTasks';
import { useCreateGoal } from '@/hooks/useGoals';
import { useCreateTransaction, useAccounts } from '@/hooks/useFinance';
import { useCreateEvent } from '@/hooks/useEvents';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function QuickActions() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  
  const createTask = useCreateTask();
  const createGoal = useCreateGoal();
  const createTransaction = useCreateTransaction();
  const createEvent = useCreateEvent();
  const { data: accounts } = useAccounts();
  
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium' });
  const [goalForm, setGoalForm] = useState({ title: '', description: '', perspective: 'financial' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: '', account_id: '' });
  const [eventForm, setEventForm] = useState({ title: '', start_time: '', end_time: '' });

  const actions = [
    { id: 'task',     icon: Plus,     label: t('quickActions.newTask'),    hue: 'var(--lt-hue-task)'   },
    { id: 'note',     icon: FileText, label: t('quickActions.quickNote'),  hue: 'var(--lt-hue-know)'   },
    { id: 'goal',     icon: Target,   label: t('quickActions.addGoal'),    hue: 'var(--lt-hue-goal)'   },
    { id: 'expense',  icon: Wallet,   label: t('quickActions.logExpense'), hue: 'var(--lt-hue-money)'  },
    { id: 'schedule', icon: Calendar, label: t('quickActions.schedule'),   hue: 'var(--lt-hue-cal)'    },
    { id: 'pomodoro', icon: Timer,    label: t('quickActions.pomodoro'),   hue: 'var(--lt-hue-pomo)',   special: true },
  ];

  const handleAction = (actionId: string) => {
    if (actionId === 'note') {
      navigate('/knowledge');
    } else if (actionId === 'pomodoro') {
      navigate('/pomodoro');
    } else {
      setActiveDialog(actionId);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title) {
      toast.error(t('common.fillAllFields'));
      return;
    }
    try {
      await createTask.mutateAsync({
        title: taskForm.title,
        description: taskForm.description || null,
        priority: taskForm.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: 'todo',
      });
      toast.success(t('tasks.taskAdded'));
      setActiveDialog(null);
      setTaskForm({ title: '', description: '', priority: 'medium' });
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleCreateGoal = async () => {
    if (!goalForm.title) {
      toast.error(t('common.fillAllFields'));
      return;
    }
    try {
      await createGoal.mutateAsync({
        title: goalForm.title,
        description: goalForm.description || null,
        perspective: goalForm.perspective as 'financial' | 'customer' | 'processes' | 'learning',
      });
      toast.success(t('goals.goalAdded'));
      setActiveDialog(null);
      setGoalForm({ title: '', description: '', perspective: 'financial' });
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleCreateExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.account_id) {
      toast.error(t('common.fillAllFields'));
      return;
    }
    try {
      await createTransaction.mutateAsync({
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        type: 'expense',
        category: expenseForm.category || null,
        account_id: expenseForm.account_id,
        date: new Date().toISOString().split('T')[0],
      });
      toast.success(t('finance.transactionAdded'));
      setActiveDialog(null);
      setExpenseForm({ description: '', amount: '', category: '', account_id: '' });
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.start_time) {
      toast.error(t('common.fillAllFields'));
      return;
    }
    try {
      await createEvent.mutateAsync({
        title: eventForm.title,
        start_time: eventForm.start_time,
        end_time: eventForm.end_time || null,
      });
      toast.success(t('calendar.eventAdded'));
      setActiveDialog(null);
      setEventForm({ title: '', start_time: '', end_time: '' });
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <>
      {/* ── Mobile: horizontal pill row ── */}
      <div className="md:hidden -mx-4 px-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className="flex flex-col items-center gap-2 shrink-0 group active:scale-95 transition-transform"
            >
              <action.icon
                className="w-8 h-8 text-primary"
                strokeWidth={1.8}
              />
              <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight max-w-[56px]">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop: card grid ── */}
      <div className="hidden md:grid grid-cols-6 gap-2 lg:gap-3">
        {actions.map((action, idx) => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
            style={{
              animationDelay: `${idx * 40}ms`,
              ...(action.special
                ? { background: `linear-gradient(135deg, ${action.hue}, var(--lt-primary))` }
                : {}),
            }}
            className={cn(
              "group relative overflow-hidden rounded-2xl p-3.5 transition-all duration-300 slide-up",
              "border backdrop-blur-xl hover:-translate-y-1 active:scale-[0.97]",
              action.special
                ? "text-white border-transparent shadow-lg"
                : "bg-card/50 border-border/40",
            )}
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            <div className="relative flex flex-col items-center gap-2 text-center">
              <action.icon
                className={cn("w-7 h-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3", action.special ? "text-white" : "text-primary")}
              />
              <span className={cn("text-[11px] font-semibold leading-tight", action.special ? "text-white" : "text-foreground")}>
                {action.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Task Dialog */}
      <Dialog open={activeDialog === 'task'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              {t('quickActions.newTask')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder={t('tasks.title')}
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="bg-muted/50"
            />
            <Textarea
              placeholder={t('finance.description')}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="bg-muted/50 min-h-[80px]"
            />
            <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('tasks.priority.low')}</SelectItem>
                <SelectItem value="medium">{t('tasks.priority.medium')}</SelectItem>
                <SelectItem value="high">{t('tasks.priority.high')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateTask} className="w-full" disabled={createTask.isPending}>
              {t('common.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={activeDialog === 'goal'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-success" />
              </div>
              {t('quickActions.addGoal')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder={t('goals.title')}
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              className="bg-muted/50"
            />
            <Textarea
              placeholder={t('finance.description')}
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
              className="bg-muted/50 min-h-[80px]"
            />
            <Select value={goalForm.perspective} onValueChange={(v) => setGoalForm({ ...goalForm, perspective: v })}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">{t('goals.category.financial')}</SelectItem>
                <SelectItem value="customer">{t('goals.category.customer')}</SelectItem>
                <SelectItem value="processes">{t('goals.category.processes')}</SelectItem>
                <SelectItem value="learning">{t('goals.category.learning')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateGoal} className="w-full bg-success hover:bg-success/90" disabled={createGoal.isPending}>
              {t('common.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={activeDialog === 'expense'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-destructive" />
              </div>
              {t('quickActions.logExpense')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder={t('finance.description')}
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className="bg-muted/50"
            />
            <Input
              type="number"
              placeholder={t('finance.amount')}
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              className="bg-muted/50"
            />
            <Select value={expenseForm.account_id} onValueChange={(v) => setExpenseForm({ ...expenseForm, account_id: v })}>
              <SelectTrigger className="bg-muted/50">
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
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              className="bg-muted/50"
            />
            <Button onClick={handleCreateExpense} className="w-full bg-destructive hover:bg-destructive/90" disabled={createTransaction.isPending}>
              {t('common.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={activeDialog === 'schedule'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              {t('quickActions.schedule')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder={t('calendar.title')}
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              className="bg-muted/50"
            />
            <Input
              type="datetime-local"
              value={eventForm.start_time}
              onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
              className="bg-muted/50"
            />
            <Input
              type="datetime-local"
              value={eventForm.end_time}
              onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
              className="bg-muted/50"
            />
            <Button onClick={handleCreateEvent} className="w-full bg-purple-500 hover:bg-purple-600" disabled={createEvent.isPending}>
              {t('common.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}