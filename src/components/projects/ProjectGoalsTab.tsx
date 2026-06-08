/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useGoals, useKeyResults, useCreateKeyResult, useUpdateKeyResult, useDeleteKeyResult } from '@/hooks/useGoals';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Target, MoreVertical, Trash2, CheckSquare, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectGoalsTabProps {
  projectId: string;
}

export function ProjectGoalsTab({ projectId }: ProjectGoalsTabProps) {
  const { data: allGoals, isLoading: goalsLoading } = useGoals();
  const { data: allKeyResults } = useKeyResults();
  const { data: allTasks } = useTasks();
  const createKeyResult = useCreateKeyResult();
  const updateKeyResult = useUpdateKeyResult();
  const deleteKeyResult = useDeleteKeyResult();

  const [isCreateKrOpen, setIsCreateKrOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [newKr, setNewKr] = useState({ title: '', target_value: 100, unit: '%' });

  // Filter goals for this project
   
  const projectGoals = allGoals?.filter((g: any) => g.project_id === projectId) || [];
   
  const projectKeyResults = allKeyResults?.filter((kr: any) => 
     
    projectGoals.some((g: any) => g.id === kr.goal_id)
  ) || [];

  // Get tasks linked to a KR
  const getKrTasks = (krId: string) => {
     
    return allTasks?.filter((t: any) => t.kr_id === krId) || [];
  };

  // Calculate KR progress
   
  const calculateKrProgress = (kr: any) => {
    if (kr.target_value === 0) return 0;
    return Math.min(100, Math.round((kr.current_value / kr.target_value) * 100));
  };

  // Calculate goal progress
  const calculateGoalProgress = (goalId: string) => {
     
    const goalKrs = projectKeyResults.filter((kr: any) => kr.goal_id === goalId);
    if (goalKrs.length === 0) return 0;
     
    const totalProgress = goalKrs.reduce((sum: number, kr: any) => sum + calculateKrProgress(kr), 0);
    return Math.round(totalProgress / goalKrs.length);
  };

  const handleCreateKr = async () => {
    if (!newKr.title.trim() || !selectedGoalId) {
      toast.error('العنوان مطلوب');
      return;
    }

    try {
      await createKeyResult.mutateAsync({
        goal_id: selectedGoalId,
        title: newKr.title,
        target_value: newKr.target_value,
        current_value: 0,
        unit: newKr.unit,
      });
      toast.success('تم إنشاء النتيجة الرئيسية');
      setIsCreateKrOpen(false);
      setNewKr({ title: '', target_value: 100, unit: '%' });
      setSelectedGoalId(null);
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleUpdateKrValue = async (krId: string, currentValue: number) => {
    try {
      await updateKeyResult.mutateAsync({ id: krId, current_value: currentValue });
      toast.success('تم تحديث القيمة');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleDeleteKr = async (krId: string) => {
    try {
      await deleteKeyResult.mutateAsync(krId);
      toast.success('تم حذف النتيجة الرئيسية');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const openCreateKr = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsCreateKrOpen(true);
  };

  if (goalsLoading) {
    return <div className="flex items-center justify-center p-8">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Goals List */}
      {projectGoals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد أهداف مرتبطة بهذا المشروع</p>
          <p className="text-sm mt-2">يمكنك ربط الأهداف بالمشروع من صفحة الأهداف</p>
        </div>
      ) : (
         
        projectGoals.map((goal: any) => {
           
          const goalKrs = projectKeyResults.filter((kr: any) => kr.goal_id === goal.id);
          const progress = calculateGoalProgress(goal.id);

          return (
            <Card key={goal.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{progress}%</Badge>
                    <Button size="sm" variant="outline" onClick={() => openCreateKr(goal.id)}>
                      <Plus className="w-4 h-4 ml-1" />
                      KR
                    </Button>
                  </div>
                </div>
                <Progress value={progress} className="mt-3 h-2" />
              </CardHeader>
              <CardContent className="pt-2">
                {/* Key Results */}
                <div className="space-y-3">
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  {goalKrs.map((kr: any) => {
                    const krProgress = calculateKrProgress(kr);
                    const linkedTasks = getKrTasks(kr.id);
                     
                    const nextTask = linkedTasks.find((t: any) => t.status !== 'done');

                    return (
                      <div key={kr.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">KR</Badge>
                            <span className="font-medium">{kr.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {kr.current_value}/{kr.target_value} {kr.unit}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDeleteKr(kr.id)}>
                                  <Trash2 className="w-4 h-4 ml-2" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <Progress value={krProgress} className="h-1.5 mb-2" />
                        
                        {/* Update Value */}
                        <div className="flex items-center gap-2 mb-2">
                          <Input
                            type="number"
                            value={kr.current_value}
                            onChange={(e) => handleUpdateKrValue(kr.id, Number(e.target.value))}
                            className="w-24 h-7 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">/ {kr.target_value} {kr.unit}</span>
                        </div>

                        {/* Linked Tasks */}
                        {linkedTasks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <CheckSquare className="w-3 h-3" />
                              <span>{linkedTasks.length} مهام مرتبطة</span>
                            </div>
                            {nextTask && (
                              <div className="flex items-center gap-2 p-2 bg-background rounded text-sm">
                                <ArrowRight className="w-3 h-3 text-primary" />
                                <span className="font-medium">التالي:</span>
                                <span>{nextTask.title}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {goalKrs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      لا توجد نتائج رئيسية - أضف KR لقياس التقدم
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Create KR Dialog */}
      <Dialog open={isCreateKrOpen} onOpenChange={setIsCreateKrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>نتيجة رئيسية جديدة (Key Result)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>العنوان</Label>
              <Input
                dir="auto"
                value={newKr.title}
                onChange={(e) => setNewKr({ ...newKr, title: e.target.value })}
                placeholder="مثال: زيادة المبيعات بنسبة 20%"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>القيمة المستهدفة</Label>
                <Input
                  type="number"
                  value={newKr.target_value}
                  onChange={(e) => setNewKr({ ...newKr, target_value: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>الوحدة</Label>
                <Input
                  value={newKr.unit}
                  onChange={(e) => setNewKr({ ...newKr, unit: e.target.value })}
                  placeholder="%, عدد, ريال..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateKrOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreateKr} disabled={createKeyResult.isPending}>إنشاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
