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
import { 
  Loader2, Calendar as CalendarIcon, Target, User, Briefcase, 
  GraduationCap, Users, Cog, TrendingUp, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjects } from '@/hooks/useProjects';
import { useHabits } from '@/hooks/useHabits';

type GoalPerspective = 'financial' | 'customer' | 'processes' | 'learning' | 'personal';

export interface GoalFormData {
  title: string;
  description: string;
  perspective: GoalPerspective;
  target_value: string;
  current_value: string;
  unit: string;
  start_date: Date | null;
  end_date: Date | null;
  project_id?: string;
  habit_id?: string;
}

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GoalFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<GoalFormData>;
  isEditing?: boolean;
}

export function GoalFormDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading = false,
  initialData,
  isEditing = false
}: GoalFormDialogProps) {
  const { t, currentLanguage } = useLanguage();
  const { data: projects } = useProjects();
  const { data: habits } = useHabits();

  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    perspective: 'personal',
    target_value: '',
    current_value: '0',
    unit: '',
    start_date: null,
    end_date: null,
    project_id: undefined,
    habit_id: undefined,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  useEffect(() => {
    if (!open) {
      setFormData({
        title: '',
        description: '',
        perspective: 'personal',
        target_value: '',
        current_value: '0',
        unit: '',
        start_date: null,
        end_date: null,
        project_id: undefined,
        habit_id: undefined,
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    await onSubmit(formData);
  };

  const perspectiveOptions = [
    { value: 'personal', label: t('goals.category.personal'), icon: User, color: 'bg-primary/80' },
    { value: 'financial', label: t('goals.category.financial'), icon: TrendingUp, color: 'bg-primary' },
    { value: 'customer', label: t('goals.category.customer'), icon: Users, color: 'bg-blue-500' },
    { value: 'processes', label: t('goals.category.processes'), icon: Cog, color: 'bg-success' },
    { value: 'learning', label: t('goals.category.learning'), icon: GraduationCap, color: 'bg-purple-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="block">{isEditing ? t('goals.editGoal') : t('goals.newObjective')}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {currentLanguage === 'ar' ? 'حدد هدفك وتتبع تقدمك' : 'Define your goal and track progress'}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('goals.goalTitle')}</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={currentLanguage === 'ar' ? 'مثال: تعلم لغة جديدة' : 'e.g., Learn a new language'}
              className="bg-muted/50 border-border/50 focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('goals.goalDescription')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={currentLanguage === 'ar' ? 'وصف مختصر للهدف...' : 'Brief description of the goal...'}
              className="bg-muted/50 border-border/50 focus:border-primary min-h-[80px] resize-none"
            />
          </div>

          {/* Category/Perspective Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{currentLanguage === 'ar' ? 'فئة الهدف' : 'Goal Category'}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {perspectiveOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.perspective === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, perspective: option.value as GoalPerspective })}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isSelected 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center',
                      isSelected ? 'bg-primary-foreground/20' : 'bg-background'
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target & Current Value */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('goals.targetValue')}</Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                placeholder="100"
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('goals.currentValue')}</Label>
              <Input
                type="number"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                placeholder="0"
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('goals.unit')}</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'ساعة' : 'hours'}
                className="bg-muted/50 border-border/50"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {t('goals.startDate')}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-start font-normal bg-muted/50 border-border/50',
                      !formData.start_date && 'text-muted-foreground'
                    )}
                  >
                    {formData.start_date 
                      ? format(formData.start_date, 'PPP') 
                      : (currentLanguage === 'ar' ? 'اختر تاريخ' : 'Pick a date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, start_date: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {t('goals.endDate')}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-start font-normal bg-muted/50 border-border/50',
                      !formData.end_date && 'text-muted-foreground'
                    )}
                  >
                    {formData.end_date 
                      ? format(formData.end_date, 'PPP') 
                      : (currentLanguage === 'ar' ? 'اختر تاريخ' : 'Pick a date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Link to Project */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('goals.linkToProject')}</Label>
            <Select
              value={formData.project_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, project_id: value === 'none' ? undefined : value })}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue placeholder={currentLanguage === 'ar' ? 'اختياري - ربط بمشروع' : 'Optional - Link to project'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {currentLanguage === 'ar' ? 'بدون ربط' : 'No link'}
                </SelectItem>
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

          {/* Link to Habit */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('goals.linkToHabit')}</Label>
            <Select
              value={formData.habit_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, habit_id: value === 'none' ? undefined : value })}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue placeholder={currentLanguage === 'ar' ? 'اختياري - ربط بعادة' : 'Optional - Link to habit'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {currentLanguage === 'ar' ? 'بدون ربط' : 'No link'}
                </SelectItem>
                {habits?.map((habit) => (
                  <SelectItem key={habit.id} value={habit.id}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-primary" />
                      {habit.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <Target className="w-5 h-5 me-2" />
                {isEditing 
                  ? (currentLanguage === 'ar' ? 'تحديث الهدف' : 'Update Goal')
                  : (currentLanguage === 'ar' ? 'إنشاء الهدف' : 'Create Goal')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
