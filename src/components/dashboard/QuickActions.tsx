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
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  
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
    { 
      id: 'task', 
      icon: Plus, 
      label: t('quickActions.newTask'),
      description: t('quickActions.newTaskDesc') || 'Create a new task',
      gradient: 'from-primary/20 to-primary/5',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary'
    },
    { 
      id: 'note', 
      icon: FileText, 
      label: t('quickActions.quickNote'),
      description: t('quickActions.quickNoteDesc') || 'Write a quick note',
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-500'
    },
    { 
      id: 'goal', 
      icon: Target, 
      label: t('quickActions.addGoal'),
      description: t('quickActions.addGoalDesc') || 'Set a new goal',
      gradient: 'from-success/20 to-success/5',
      iconBg: 'bg-success/20',
      iconColor: 'text-success'
    },
    { 
      id: 'expense', 
      icon: Wallet, 
      label: t('quickActions.logExpense'),
      description: t('quickActions.logExpenseDesc') || 'Log an expense',
      gradient: 'from-destructive/20 to-destructive/5',
      iconBg: 'bg-destructive/20',
      iconColor: 'text-destructive'
    },
    { 
      id: 'schedule', 
      icon: Calendar, 
      label: t('quickActions.schedule'),
      description: t('quickActions.scheduleDesc') || 'Schedule an event',
      gradient: 'from-purple-500/20 to-purple-500/5',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-500'
    },
    { 
      id: 'pomodoro', 
      icon: Timer, 
      label: t('quickActions.pomodoro'),
      description: t('quickActions.pomodoroDesc') || 'Start focus timer',
      gradient: 'from-primary to-gold-600',
      iconBg: 'bg-primary-foreground/20',
      iconColor: 'text-primary-foreground',
      special: true
    },
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
            onMouseEnter={() => setHoveredAction(action.id)}
            onMouseLeave={() => setHoveredAction(null)}
            className={cn(
              "group relative overflow-hidden rounded-2xl p-4 transition-all duration-300",
              "border border-border/50 hover:border-primary/30",
              "hover:shadow-lg hover:-translate-y-1",
              action.special 
                ? "bg-gradient-to-br from-primary to-gold-600 text-primary-foreground" 
                : "bg-card/50 backdrop-blur-sm hover:bg-card/80"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Background Gradient on Hover */}
            {!action.special && (
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                action.gradient
              )} />
            )}
            
            {/* Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="relative flex flex-col items-center gap-3 text-center">
              {/* Icon Container */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                action.special ? "bg-primary-foreground/20" : action.iconBg
              )}>
                <action.icon className={cn(
                  "w-6 h-6 transition-transform duration-300",
                  action.special ? "text-primary-foreground" : action.iconColor,
                  hoveredAction === action.id && "scale-110"
                )} />
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-sm font-medium transition-colors",
                action.special ? "text-primary-foreground" : "text-foreground"
              )}>
                {action.label}
              </span>
              
              {/* Arrow on Hover */}
              <ArrowRight className={cn(
                "w-4 h-4 absolute bottom-2 right-2 opacity-0 translate-x-2 transition-all duration-300",
                "group-hover:opacity-100 group-hover:translate-x-0",
                action.special ? "text-primary-foreground/70" : "text-muted-foreground"
              )} />
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
              className="bg-muted/50 min-h-[100px]"
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
              className="bg-muted/50 min-h-[100px]"
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
