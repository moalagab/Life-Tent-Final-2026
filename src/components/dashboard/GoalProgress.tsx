import { useState } from 'react';
import { Target, Loader2, TrendingUp, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useGoals, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals';
import { GoalFormDialog, type GoalFormData } from '@/components/goals/GoalFormDialog';
import { useCreateGoal } from '@/hooks/useGoals';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardWidgetShell, DashboardEmptyState } from './DashboardWidgetShell';

export function GoalProgress() {
  const { t, currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const { data: goals, isLoading } = useGoals();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const createGoal = useCreateGoal();

  const [createOpen, setCreateOpen]   = useState(false);
  const [editingGoal, setEditingGoal] = useState<{ id: string; title: string; current_value: number; target_value: number } | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  const activeGoals = goals?.filter(g => g.is_active) || [];

  const calcProgress = (goal: typeof activeGoals[0]) =>
    Math.min(100, Math.round(((goal.current_value || 0) / (goal.target_value || 1)) * 100));

  const goalsWithProgress = activeGoals.map(calcProgress);
  const overallProgress   = goalsWithProgress.length
    ? Math.round(goalsWithProgress.reduce((a, b) => a + b, 0) / goalsWithProgress.length)
    : 0;
  const completedGoals    = goalsWithProgress.filter(p => p >= 100).length;
  const inProgressGoals   = goalsWithProgress.filter(p => p > 0 && p < 100).length;

  const topGoals = activeGoals
    .map(g => ({ ...g, progress: calcProgress(g) }))
    .filter(g => g.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  const handleCreate = async (data: GoalFormData) => {
    await createGoal.mutateAsync({
      title:         data.title,
      description:   data.description,
      perspective:   data.perspective,
      target_value:  data.target_value  ? Number(data.target_value)  : null,
      current_value: data.current_value ? Number(data.current_value) : 0,
      unit:          data.unit || null,
      start_date:    data.start_date?.toISOString() ?? null,
      end_date:      data.end_date?.toISOString()   ?? null,
    });
    toast.success(isAr ? 'تم إنشاء الهدف' : 'Goal created');
    setCreateOpen(false);
  };

  const handleEdit = async () => {
    if (!editingGoal) return;
    try {
      await updateGoal.mutateAsync({
        id:            editingGoal.id,
        title:         editingGoal.title,
        current_value: Number(editingGoal.current_value),
        target_value:  Number(editingGoal.target_value),
      });
      toast.success(isAr ? 'تم التحديث' : 'Updated');
      setEditingGoal(null);
    } catch { toast.error(t('common.error')); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal.mutateAsync(id);
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
    } catch { toast.error(t('common.error')); }
    setDeletingId(null);
  };

  const addButton = (
    <button
      onClick={() => setCreateOpen(true)}
      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
      title={isAr ? 'إضافة هدف' : 'Add goal'}
    >
      <Plus className="w-4 h-4" />
    </button>
  );

  if (isLoading) {
    return (
      <DashboardWidgetShell
        title={t('goals.title')}
        subtitle={`0 ${isAr ? 'أهداف نشطة' : 'active'}`}
        icon={Target}
        linkTo="/goals"
        linkText={t('common.viewAll')}
        headerAction={addButton}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </DashboardWidgetShell>
    );
  }

  return (
    <>
      <DashboardWidgetShell
        title={t('goals.title')}
        subtitle={`${activeGoals.length} ${isAr ? 'نشط' : 'active'}`}
        icon={Target}
        iconColor="text-accent"
        iconBg="bg-accent/10"
        accentColor="bg-accent/10"
        linkTo="/goals"
        linkText={t('common.viewAll')}
        headerAction={addButton}
      >
        {activeGoals.length > 0 ? (
          <>
            {/* Overall Progress Ring */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" className="stroke-muted" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    className="stroke-accent"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${overallProgress}, 100`}
                    style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">{overallProgress}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1.5">
                  {isAr ? 'التقدم الكلي' : 'Overall'}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {completedGoals} {isAr ? 'مكتمل' : 'done'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {inProgressGoals} {isAr ? 'جاري' : 'active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Goals list with edit/delete */}
            {topGoals.length > 0 && (
              <div className="space-y-2">
                {topGoals.map(goal => (
                  <div
                    key={goal.id}
                    className="group/goal relative p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-xs font-medium text-foreground truncate flex-1" dir="auto">
                        {goal.title}
                      </p>
                      <span className="text-[11px] font-semibold text-accent tabular-nums shrink-0">{goal.progress}%</span>

                      {/* hover actions */}
                      <div className="hidden group-hover/goal:flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => setEditingGoal({ id: goal.id, title: goal.title, current_value: goal.current_value ?? 0, target_value: goal.target_value ?? 1 })}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        {deletingId === goal.id ? (
                          <>
                            <button onClick={() => handleDelete(goal.id)} className="p-1 rounded hover:bg-destructive/10">
                              <Check className="w-3 h-3 text-destructive" />
                            </button>
                            <button onClick={() => setDeletingId(null)} className="p-1 rounded">
                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setDeletingId(goal.id)} className="p-1 rounded hover:bg-destructive/10">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                    <Progress value={goal.progress} className="h-1" />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <DashboardEmptyState
            icon={TrendingUp}
            message={isAr ? 'لا توجد أهداف' : 'No goals yet'}
            action={
              <Link to="/goals" className="text-xs text-primary hover:underline">
                {isAr ? 'إضافة هدف' : 'Add goal'}
              </Link>
            }
          />
        )}
      </DashboardWidgetShell>

      {/* Create goal — full form */}
      <GoalFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isLoading={createGoal.isPending}
      />

      {/* Edit goal — quick value update */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-accent" />
              </div>
              {isAr ? 'تحديث الهدف' : 'Update Goal'}
            </DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-3 mt-2">
              <Input
                value={editingGoal.title}
                onChange={e => setEditingGoal(g => g ? { ...g, title: e.target.value } : null)}
                placeholder={isAr ? 'عنوان الهدف' : 'Goal title'}
                className="bg-muted/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'القيمة الحالية' : 'Current'}</label>
                  <Input
                    type="number"
                    value={editingGoal.current_value}
                    onChange={e => setEditingGoal(g => g ? { ...g, current_value: +e.target.value } : null)}
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'القيمة المستهدفة' : 'Target'}</label>
                  <Input
                    type="number"
                    value={editingGoal.target_value}
                    onChange={e => setEditingGoal(g => g ? { ...g, target_value: +e.target.value } : null)}
                    className="bg-muted/50"
                  />
                </div>
              </div>
              <Button onClick={handleEdit} className="w-full" disabled={updateGoal.isPending}>
                {updateGoal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? 'حفظ' : 'Save')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
