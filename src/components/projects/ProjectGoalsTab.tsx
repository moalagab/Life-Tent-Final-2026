import { useState } from 'react';
import { useGoals, useKeyResults, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useCreateKeyResult, useUpdateKeyResult, useDeleteKeyResult } from '@/hooks/useGoals';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Target, MoreVertical, Trash2, CheckSquare, ArrowRight, Link2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

interface ProjectGoalsTabProps {
  projectId: string;
}

export function ProjectGoalsTab({ projectId }: ProjectGoalsTabProps) {
  const { currentLanguage } = useLanguage();
  const { data: allGoals, isLoading: goalsLoading } = useGoals();
  const { data: allKeyResults } = useKeyResults();
  const { data: allTasks } = useTasks();

  const createGoal    = useCreateGoal();
  const updateGoal    = useUpdateGoal();
  const deleteGoal    = useDeleteGoal();
  const createKr      = useCreateKeyResult();
  const updateKr      = useUpdateKeyResult();
  const deleteKr      = useDeleteKeyResult();

  // Create goal dialog
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', perspective: '' });

  // Link existing goal dialog
  const [isLinkOpen, setIsLinkOpen] = useState(false);

  // Edit goal inline
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');

  // KR dialog
  const [isCreateKrOpen, setIsCreateKrOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [newKr, setNewKr] = useState({ title: '', target_value: 100, unit: '%' });

  const projectGoals     = allGoals?.filter((g) => g.project_id === projectId) || [];
  const projectKeyResults = allKeyResults?.filter((kr) => projectGoals.some((g) => g.id === kr.goal_id)) || [];

  // Goals not yet linked to this project (available for linking)
  const unlinkableGoals = allGoals?.filter(
    (g) => g.project_id !== projectId,
  ) || [];

  const getKrTasks = (krId: string) => allTasks?.filter((t) => t.kr_id === krId) || [];

  const calcKrProgress = (kr: { target_value: number; current_value: number }) =>
    kr.target_value === 0 ? 0 : Math.min(100, Math.round((kr.current_value / kr.target_value) * 100));

  const calcGoalProgress = (goalId: string) => {
    const krs = projectKeyResults.filter((kr) => kr.goal_id === goalId);
    if (!krs.length) return 0;
    return Math.round(krs.reduce((s, kr) => s + calcKrProgress(kr), 0) / krs.length);
  };

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) {
      toast.error(currentLanguage === 'ar' ? 'العنوان مطلوب' : 'Title is required');
      return;
    }
    try {
      await createGoal.mutateAsync({
        title: newGoal.title.trim(),
        description: newGoal.description || null,
        perspective: (newGoal.perspective || 'personal') as 'personal' | 'work' | 'health' | 'finance' | 'relationships' | 'learning',
        project_id: projectId,
        is_active: true,
        progress: 0,
      });
      toast.success(currentLanguage === 'ar' ? 'تم إنشاء الهدف' : 'Goal created');
      setIsCreateGoalOpen(false);
      setNewGoal({ title: '', description: '', perspective: '' });
    } catch {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleLinkGoal = async (goalId: string) => {
    try {
      await updateGoal.mutateAsync({ id: goalId, project_id: projectId });
      toast.success(currentLanguage === 'ar' ? 'تم ربط الهدف بالمشروع' : 'Goal linked to project');
      setIsLinkOpen(false);
    } catch {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleUnlinkGoal = async (goalId: string) => {
    try {
      await updateGoal.mutateAsync({ id: goalId, project_id: null });
      toast.success(currentLanguage === 'ar' ? 'تم إلغاء ربط الهدف' : 'Goal unlinked');
    } catch {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleSaveGoalTitle = async (goalId: string) => {
    if (!editGoalTitle.trim()) return;
    try {
      await updateGoal.mutateAsync({ id: goalId, title: editGoalTitle.trim() });
      setEditingGoalId(null);
      toast.success(currentLanguage === 'ar' ? 'تم تحديث الهدف' : 'Goal updated');
    } catch {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal.mutateAsync(goalId);
      toast.success(currentLanguage === 'ar' ? 'تم حذف الهدف' : 'Goal deleted');
    } catch {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleCreateKr = async () => {
    if (!newKr.title.trim() || !selectedGoalId) {
      toast.error(currentLanguage === 'ar' ? 'العنوان مطلوب' : 'Title is required');
      return;
    }
    try {
      await createKr.mutateAsync({
        goal_id: selectedGoalId,
        title: newKr.title,
        target_value: newKr.target_value,
        current_value: 0,
        unit: newKr.unit,
      });
      toast.success(currentLanguage === 'ar' ? 'تم إنشاء النتيجة الرئيسية' : 'Key result created');
      setIsCreateKrOpen(false);
      setNewKr({ title: '', target_value: 100, unit: '%' });
      setSelectedGoalId(null);
    } catch {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleUpdateKrValue = async (krId: string, val: number) => {
    try {
      await updateKr.mutateAsync({ id: krId, current_value: val });
    } catch {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleDeleteKr = async (krId: string) => {
    try {
      await deleteKr.mutateAsync(krId);
      toast.success(currentLanguage === 'ar' ? 'تم حذف النتيجة' : 'Key result deleted');
    } catch {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  if (goalsLoading) {
    return <div className="flex items-center justify-center p-8">{currentLanguage === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {projectGoals.length} {currentLanguage === 'ar' ? 'أهداف' : 'goals'}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsLinkOpen(true)}>
            <Link2 className="w-3.5 h-3.5" />
            {currentLanguage === 'ar' ? 'ربط هدف موجود' : 'Link Goal'}
          </Button>
          <Button size="sm" className="bg-gradient-gold text-primary-foreground gap-1.5" onClick={() => setIsCreateGoalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            {currentLanguage === 'ar' ? 'هدف جديد' : 'New Goal'}
          </Button>
        </div>
      </div>

      {/* Goals List */}
      {projectGoals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{currentLanguage === 'ar' ? 'لا توجد أهداف مرتبطة بهذا المشروع' : 'No goals linked to this project'}</p>
          <p className="text-sm mt-2 text-muted-foreground/70">
            {currentLanguage === 'ar' ? 'أنشئ هدفاً جديداً أو اربط هدفاً موجوداً' : 'Create a new goal or link an existing one'}
          </p>
        </div>
      ) : (
        projectGoals.map((goal) => {
          const goalKrs  = projectKeyResults.filter((kr) => kr.goal_id === goal.id);
          const progress = calcGoalProgress(goal.id);

          return (
            <Card key={goal.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingGoalId === goal.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editGoalTitle}
                            onChange={(e) => setEditGoalTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveGoalTitle(goal.id)}
                            className="h-7 text-sm"
                            dir="auto"
                            autoFocus
                          />
                          <button onClick={() => handleSaveGoalTitle(goal.id)} className="text-success"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingGoalId(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <CardTitle className="text-base truncate">{goal.title}</CardTitle>
                      )}
                      {goal.description && <p className="text-sm text-muted-foreground truncate mt-0.5">{goal.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{progress}%</Badge>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                      onClick={() => { setSelectedGoalId(goal.id); setIsCreateKrOpen(true); }}>
                      <Plus className="w-3 h-3" /> KR
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditGoalTitle(goal.title); setEditingGoalId(goal.id); }}>
                          <Pencil className="w-4 h-4 me-2" />
                          {currentLanguage === 'ar' ? 'تعديل' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUnlinkGoal(goal.id)}>
                          <Link2 className="w-4 h-4 me-2" />
                          {currentLanguage === 'ar' ? 'إلغاء الربط' : 'Unlink'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteGoal(goal.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 me-2" />
                          {currentLanguage === 'ar' ? 'حذف' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <Progress value={progress} className="mt-3 h-2" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {goalKrs.map((kr) => {
                    const krProgress = calcKrProgress(kr);
                    const linkedTasks = getKrTasks(kr.id);
                    const nextTask    = linkedTasks.find((t) => t.status !== 'done');

                    return (
                      <div key={kr.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Badge variant="secondary" className="text-xs shrink-0">KR</Badge>
                            <span className="font-medium text-sm truncate">{kr.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm text-muted-foreground">{kr.current_value}/{kr.target_value} {kr.unit}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDeleteKr(kr.id)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 me-2" />
                                  {currentLanguage === 'ar' ? 'حذف' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <Progress value={krProgress} className="h-1.5 mb-2" />
                        <div className="flex items-center gap-2 mb-2">
                          <Input
                            type="number"
                            value={kr.current_value}
                            onChange={(e) => handleUpdateKrValue(kr.id, Number(e.target.value))}
                            className="w-24 h-7 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">/ {kr.target_value} {kr.unit}</span>
                        </div>
                        {linkedTasks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <CheckSquare className="w-3 h-3" />
                              <span>{currentLanguage === 'ar' ? `${linkedTasks.length} مهام مرتبطة` : `${linkedTasks.length} linked tasks`}</span>
                            </div>
                            {nextTask && (
                              <div className="flex items-center gap-2 p-2 bg-background rounded text-sm">
                                <ArrowRight className="w-3 h-3 text-primary" />
                                <span className="font-medium">{currentLanguage === 'ar' ? 'التالي:' : 'Next:'}</span>
                                <span className="truncate">{nextTask.title}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {goalKrs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {currentLanguage === 'ar' ? 'أضف KR لقياس التقدم' : 'Add a KR to measure progress'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* ── Create Goal Dialog ──────────────────────────────────────────── */}
      <Dialog open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentLanguage === 'ar' ? 'هدف جديد' : 'New Goal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{currentLanguage === 'ar' ? 'العنوان' : 'Title'}</Label>
              <Input dir="auto" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'عنوان الهدف...' : 'Goal title...'} />
            </div>
            <div>
              <Label>{currentLanguage === 'ar' ? 'الوصف' : 'Description'}</Label>
              <Textarea dir="auto" value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateGoalOpen(false)}>{currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleCreateGoal} disabled={createGoal.isPending}>{currentLanguage === 'ar' ? 'إنشاء' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Link Existing Goal Dialog ────────────────────────────────────── */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentLanguage === 'ar' ? 'ربط هدف موجود' : 'Link Existing Goal'}</DialogTitle>
          </DialogHeader>
          {unlinkableGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {currentLanguage === 'ar' ? 'لا توجد أهداف أخرى متاحة' : 'No other goals available'}
            </p>
          ) : (
            <ScrollArea className="max-h-72">
              <div className="space-y-2 p-1">
                {unlinkableGoals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleLinkGoal(g.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 text-start transition-colors"
                    disabled={updateGoal.isPending}
                  >
                    <Target className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{g.title}</p>
                      {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{g.progress ?? 0}%</Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create KR Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isCreateKrOpen} onOpenChange={setIsCreateKrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentLanguage === 'ar' ? 'نتيجة رئيسية جديدة (KR)' : 'New Key Result'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{currentLanguage === 'ar' ? 'العنوان' : 'Title'}</Label>
              <Input dir="auto" value={newKr.title} onChange={(e) => setNewKr({ ...newKr, title: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'مثال: زيادة المبيعات 20%' : 'e.g. Increase sales by 20%'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{currentLanguage === 'ar' ? 'القيمة المستهدفة' : 'Target'}</Label>
                <Input type="number" value={newKr.target_value} onChange={(e) => setNewKr({ ...newKr, target_value: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{currentLanguage === 'ar' ? 'الوحدة' : 'Unit'}</Label>
                <Input value={newKr.unit} onChange={(e) => setNewKr({ ...newKr, unit: e.target.value })} placeholder="%, count..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateKrOpen(false)}>{currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleCreateKr} disabled={createKr.isPending}>{currentLanguage === 'ar' ? 'إنشاء' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
