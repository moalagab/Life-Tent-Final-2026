import { useState, useEffect } from 'react';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Loader2, Calendar as CalendarIcon, Target, FolderKanban,
  Sparkles, User, Flag, Clock, X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjects } from '@/hooks/useProjects';
import { useGoals } from '@/hooks/useGoals';
import { useHabits } from '@/hooks/useHabits';

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: Date | null;
  due_time: string;
  project_id: string | null;
  is_focus: boolean;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  // UI-only fields for display
  linkedTo: 'none' | 'project' | 'goal' | 'habit' | 'personal';
  goalId?: string;
  habitId?: string;
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialStatus?: TaskStatus;
  isLoading?: boolean;
}

export function TaskFormDialog({
  open, onOpenChange, onSubmit, initialStatus = 'todo', isLoading = false
}: TaskFormDialogProps) {
  const { t, currentLanguage } = useLanguage();
  const { data: projects } = useProjects();
  const { data: goals } = useGoals();
  const { data: habits } = useHabits();
  const ar = currentLanguage === 'ar';

  const [formData, setFormData] = useState<TaskFormData>({
    title: '', description: '', priority: 'medium', status: initialStatus,
    due_date: null, due_time: '', project_id: null, is_focus: false,
    recurrence: 'none', linkedTo: 'none', goalId: undefined, habitId: undefined,
  });

  useEffect(() => {
    if (open) setFormData(prev => ({ ...prev, status: initialStatus }));
  }, [open, initialStatus]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    await onSubmit(formData);
    setFormData({
      title: '', description: '', priority: 'medium', status: initialStatus,
      due_date: null, due_time: '', project_id: null, is_focus: false,
      recurrence: 'none', linkedTo: 'none', goalId: undefined, habitId: undefined,
    });
  };

  const set = (patch: Partial<TaskFormData>) => setFormData(prev => ({ ...prev, ...patch }));

  const priorityOptions = [
    { value: 'low',    label: t('tasks.priority.low'),    color: 'bg-muted text-muted-foreground' },
    { value: 'medium', label: t('tasks.priority.medium'), color: 'bg-primary/20 text-primary' },
    { value: 'high',   label: t('tasks.priority.high'),   color: 'bg-destructive/20 text-destructive' },
    { value: 'urgent', label: ar ? 'عاجل' : 'Urgent',    color: 'bg-destructive text-destructive-foreground' },
  ];

  const linkOptions = [
    { value: 'none',     label: ar ? 'بدون ربط' : 'No Link', icon: X },
    { value: 'project',  label: ar ? 'مشروع' : 'Project',   icon: FolderKanban },
    { value: 'goal',     label: ar ? 'هدف' : 'Goal',         icon: Target },
    { value: 'habit',    label: ar ? 'عادة' : 'Habit',       icon: Sparkles },
    { value: 'personal', label: ar ? 'شخصي' : 'Personal',   icon: User },
  ];

  const recurrenceOptions = [
    { value: 'none',    label: ar ? 'مرة واحدة' : 'Once' },
    { value: 'daily',   label: ar ? 'يومياً'    : 'Daily' },
    { value: 'weekly',  label: ar ? 'أسبوعياً'  : 'Weekly' },
    { value: 'monthly', label: ar ? 'شهرياً'    : 'Monthly' },
    { value: 'yearly',  label: ar ? 'سنوياً'    : 'Yearly' },
  ];

  const titleNode = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <div>
        <span className="block font-bold">{t('tasks.newTask')}</span>
        <span className="text-xs font-normal text-muted-foreground">
          {ar ? 'أنشئ مهمة جديدة وربطها' : 'Create and link a new task'}
        </span>
      </div>
    </div>
  );

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title={titleNode}>
      <div className="space-y-4 pb-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {ar ? 'عنوان المهمة' : 'Task Title'}
          </Label>
          <Input
            value={formData.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder={ar ? 'اكتب عنوان المهمة...' : 'Enter task title...'}
            className="bg-muted/50 border-border/50 focus:border-primary"
            dir="auto"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {ar ? 'الوصف' : 'Description'}
          </Label>
          <Textarea
            value={formData.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder={ar ? 'وصف المهمة (اختياري)...' : 'Task description (optional)...'}
            className="bg-muted/50 border-border/50 focus:border-primary min-h-[70px] resize-none"
            dir="auto"
          />
        </div>

        {/* Link type */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {ar ? 'ربط المهمة بـ' : 'Link Task To'}
          </Label>
          <div className="flex flex-wrap gap-2">
            {linkOptions.map((opt) => {
              const Icon = opt.icon;
              const sel = formData.linkedTo === opt.value;
              return (
                <button key={opt.value} type="button"
                  onClick={() => set({
                    linkedTo: opt.value as TaskFormData['linkedTo'],
                    project_id: opt.value === 'project' ? formData.project_id : null,
                    goalId: opt.value === 'goal' ? formData.goalId : undefined,
                    habitId: opt.value === 'habit' ? formData.habitId : undefined,
                  })}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95',
                    sel ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />{opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional linked select */}
        {formData.linkedTo === 'project' && (
          <Select value={formData.project_id || ''} onValueChange={(v) => set({ project_id: v || null })}>
            <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder={ar ? 'اختر مشروع...' : 'Select project...'} /></SelectTrigger>
            <SelectContent>
              {projects?.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || '#6366f1' }} />{p.title}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {formData.linkedTo === 'goal' && (
          <Select value={formData.goalId || ''} onValueChange={(v) => set({ goalId: v })}>
            <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder={ar ? 'اختر هدف...' : 'Select goal...'} /></SelectTrigger>
            <SelectContent>
              {goals?.map(g => (
                <SelectItem key={g.id} value={g.id}><div className="flex items-center gap-2"><Target className="w-3 h-3 text-primary" />{g.title}</div></SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {formData.linkedTo === 'habit' && (
          <Select value={formData.habitId || ''} onValueChange={(v) => set({ habitId: v })}>
            <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder={ar ? 'اختر عادة...' : 'Select habit...'} /></SelectTrigger>
            <SelectContent>
              {habits?.map(h => (
                <SelectItem key={h.id} value={h.id}><div className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-primary" />{h.name}</div></SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Priority & Recurrence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" />{ar ? 'الأولوية' : 'Priority'}
            </Label>
            <Select value={formData.priority} onValueChange={(v: TaskPriority) => set({ priority: v })}>
              <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {priorityOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    <Badge className={cn('text-xs', o.color)}>{o.label}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />{ar ? 'التكرار' : 'Recurrence'}
            </Label>
            <Select value={formData.recurrence} onValueChange={(v) => set({ recurrence: v as TaskFormData['recurrence'] })}>
              <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {recurrenceOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />{ar ? 'تاريخ الاستحقاق' : 'Due Date'}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-start font-normal bg-muted/50 border-border/50 text-sm', !formData.due_date && 'text-muted-foreground')}>
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {formData.due_date ? format(formData.due_date, 'PP') : (ar ? 'اختر تاريخ' : 'Pick date')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={formData.due_date || undefined} onSelect={(d) => set({ due_date: d || null })} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {ar ? 'الوقت' : 'Time'}
            </Label>
            <Input type="time" value={formData.due_time} onChange={(e) => set({ due_time: e.target.value })} className="bg-muted/50 border-border/50" />
          </div>
        </div>

        {/* Focus toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{ar ? 'مهمة تركيز' : 'Focus Task'}</p>
              <p className="text-xs text-muted-foreground">{ar ? 'ستظهر في لوحة التحكم' : 'Will appear on dashboard'}</p>
            </div>
          </div>
          <Switch checked={formData.is_focus} onCheckedChange={(v) => set({ is_focus: v })} />
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} className="w-full h-11 text-sm font-semibold" disabled={isLoading || !formData.title.trim()}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 me-2" />{ar ? 'إنشاء المهمة' : 'Create Task'}</>}
        </Button>
      </div>
    </ResponsiveSheet>
  );
}
