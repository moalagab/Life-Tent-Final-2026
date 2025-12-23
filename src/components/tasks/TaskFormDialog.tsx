import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface TaskFormData {
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
  open, 
  onOpenChange, 
  onSubmit, 
  initialStatus = 'todo',
  isLoading = false 
}: TaskFormDialogProps) {
  const { t, currentLanguage } = useLanguage();
  const { data: projects } = useProjects();
  const { data: goals } = useGoals();
  const { data: habits } = useHabits();

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: initialStatus,
    due_date: null,
    due_time: '',
    project_id: null,
    is_focus: false,
    recurrence: 'none',
    linkedTo: 'none',
    goalId: undefined,
    habitId: undefined,
  });

  useEffect(() => {
    if (open) {
      setFormData(prev => ({ ...prev, status: initialStatus }));
    }
  }, [open, initialStatus]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    await onSubmit(formData);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      due_date: null,
      due_time: '',
      project_id: null,
      is_focus: false,
      recurrence: 'none',
      linkedTo: 'none',
      goalId: undefined,
      habitId: undefined,
    });
  };

  const priorityOptions = [
    { value: 'low', label: t('tasks.priority.low'), color: 'bg-muted text-muted-foreground' },
    { value: 'medium', label: t('tasks.priority.medium'), color: 'bg-primary/20 text-primary' },
    { value: 'high', label: t('tasks.priority.high'), color: 'bg-destructive/20 text-destructive' },
    { value: 'urgent', label: currentLanguage === 'ar' ? 'عاجل' : 'Urgent', color: 'bg-destructive text-destructive-foreground' },
  ];

  const linkOptions = [
    { value: 'none', label: currentLanguage === 'ar' ? 'بدون ربط' : 'No Link', icon: X },
    { value: 'project', label: currentLanguage === 'ar' ? 'مشروع' : 'Project', icon: FolderKanban },
    { value: 'goal', label: currentLanguage === 'ar' ? 'هدف' : 'Goal', icon: Target },
    { value: 'habit', label: currentLanguage === 'ar' ? 'عادة' : 'Habit', icon: Sparkles },
    { value: 'personal', label: currentLanguage === 'ar' ? 'شخصي' : 'Personal', icon: User },
  ];

  const recurrenceOptions = [
    { value: 'none', label: currentLanguage === 'ar' ? 'مرة واحدة' : 'Once' },
    { value: 'daily', label: currentLanguage === 'ar' ? 'يومياً' : 'Daily' },
    { value: 'weekly', label: currentLanguage === 'ar' ? 'أسبوعياً' : 'Weekly' },
    { value: 'monthly', label: currentLanguage === 'ar' ? 'شهرياً' : 'Monthly' },
    { value: 'yearly', label: currentLanguage === 'ar' ? 'سنوياً' : 'Yearly' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="block">{t('tasks.newTask')}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {currentLanguage === 'ar' ? 'أنشئ مهمة جديدة وربطها' : 'Create and link a new task'}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{currentLanguage === 'ar' ? 'عنوان المهمة' : 'Task Title'}</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={currentLanguage === 'ar' ? 'اكتب عنوان المهمة...' : 'Enter task title...'}
              className="bg-muted/50 border-border/50 focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{currentLanguage === 'ar' ? 'الوصف' : 'Description'}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={currentLanguage === 'ar' ? 'وصف المهمة (اختياري)...' : 'Task description (optional)...'}
              className="bg-muted/50 border-border/50 focus:border-primary min-h-[80px] resize-none"
            />
          </div>

          {/* Link Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{currentLanguage === 'ar' ? 'ربط المهمة بـ' : 'Link Task To'}</Label>
            <div className="flex flex-wrap gap-2">
              {linkOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.linkedTo === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      linkedTo: option.value as any,
                      project_id: option.value === 'project' ? formData.project_id : null,
                      goalId: option.value === 'goal' ? formData.goalId : undefined,
                      habitId: option.value === 'habit' ? formData.habitId : undefined,
                    })}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isSelected 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Select based on Link Type */}
          {formData.linkedTo === 'project' && (
            <div className="space-y-2 animate-fade-in">
              <Label className="text-sm font-medium">{currentLanguage === 'ar' ? 'اختر المشروع' : 'Select Project'}</Label>
              <Select
                value={formData.project_id || ''}
                onValueChange={(value) => setFormData({ ...formData, project_id: value || null })}
              >
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر مشروع...' : 'Select a project...'} />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color || '#6366f1' }} 
                        />
                        {project.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.linkedTo === 'goal' && (
            <div className="space-y-2 animate-fade-in">
              <Label className="text-sm font-medium">{currentLanguage === 'ar' ? 'اختر الهدف' : 'Select Goal'}</Label>
              <Select
                value={formData.goalId || ''}
                onValueChange={(value) => setFormData({ ...formData, goalId: value })}
              >
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر هدف...' : 'Select a goal...'} />
                </SelectTrigger>
                <SelectContent>
                  {goals?.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-primary" />
                        {goal.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.linkedTo === 'habit' && (
            <div className="space-y-2 animate-fade-in">
              <Label className="text-sm font-medium">{currentLanguage === 'ar' ? 'اختر العادة' : 'Select Habit'}</Label>
              <Select
                value={formData.habitId || ''}
                onValueChange={(value) => setFormData({ ...formData, habitId: value })}
              >
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر عادة...' : 'Select a habit...'} />
                </SelectTrigger>
                <SelectContent>
                  {habits?.map((habit) => (
                    <SelectItem key={habit.id} value={habit.id}>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {habit.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Flag className="w-4 h-4" />
                {currentLanguage === 'ar' ? 'الأولوية' : 'Priority'}
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-xs', option.color)}>{option.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {currentLanguage === 'ar' ? 'التكرار' : 'Recurrence'}
              </Label>
              <Select
                value={formData.recurrence}
                onValueChange={(value: any) => setFormData({ ...formData, recurrence: value })}
              >
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {currentLanguage === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-start font-normal bg-muted/50 border-border/50',
                      !formData.due_date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="me-2 h-4 w-4" />
                    {formData.due_date 
                      ? format(formData.due_date, 'PPP') 
                      : (currentLanguage === 'ar' ? 'اختر تاريخ' : 'Pick a date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, due_date: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{currentLanguage === 'ar' ? 'الوقت' : 'Time'}</Label>
              <Input
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                className="bg-muted/50 border-border/50"
              />
            </div>
          </div>

          {/* Focus Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <Label className="text-sm font-medium">{currentLanguage === 'ar' ? 'مهمة تركيز' : 'Focus Task'}</Label>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' ? 'ستظهر في لوحة التحكم' : 'Will appear on dashboard'}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.is_focus}
              onCheckedChange={(checked) => setFormData({ ...formData, is_focus: checked })}
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full h-12 text-base font-medium" 
            disabled={isLoading || !formData.title.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 me-2" />
                {currentLanguage === 'ar' ? 'إنشاء المهمة' : 'Create Task'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
