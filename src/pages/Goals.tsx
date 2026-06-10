import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  Target, Plus, TrendingUp, Loader2, Search, Trash2, Archive,
  User, Users, Cog, GraduationCap, LayoutGrid, List, Sparkles, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  useGoals, useKeyResults, useCreateGoal, useCreateKeyResult, 
  useUpdateGoal, useDeleteGoal, useArchiveGoal, useRestoreGoal,
  useArchivedGoals, useUpdateKeyResult, Goal 
} from '@/hooks/useGoals';
import { GoalFormDialog } from '@/components/goals/GoalFormDialog';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalAnalytics } from '@/components/goals/GoalAnalytics';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CategoryFilter = 'all' | 'personal' | 'financial' | 'customer' | 'processes' | 'learning';

const categoryConfig = {
  all: { icon: LayoutGrid, color: 'bg-foreground text-background' },
  personal: { icon: User, color: 'bg-primary/80 text-white' },
  financial: { icon: TrendingUp, color: 'bg-primary text-primary-foreground' },
  customer: { icon: Users, color: 'bg-blue-500 text-white' },
  processes: { icon: Cog, color: 'bg-success text-white' },
  learning: { icon: GraduationCap, color: 'bg-purple-500 text-white' },
};

export default function Goals() {
  const { t, currentLanguage } = useLanguage();
  const { data: goals, isLoading } = useGoals();
  const { data: archivedGoals } = useArchivedGoals();
  const { data: keyResults } = useKeyResults();
  const createGoal = useCreateGoal();
  const createKeyResult = useCreateKeyResult();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const archiveGoal = useArchiveGoal();
  const restoreGoal = useRestoreGoal();
  const updateKeyResult = useUpdateKeyResult();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'goals' | 'analytics' | 'archive'>('goals');
  
  // Edit state
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  
  // Key Result Dialog
  const [krDialogOpen, setKrDialogOpen] = useState(false);
  const [krGoalId, setKrGoalId] = useState<string | null>(null);
  const [newKeyResult, setNewKeyResult] = useState({
    title: '',
    target_value: '',
    unit: '',
  });

  const tabs = [
    { id: 'all' as const, label: t('goals.category.all'), icon: LayoutGrid },
    { id: 'personal' as const, label: t('goals.category.personal'), icon: User },
    { id: 'financial' as const, label: t('goals.category.financial'), icon: TrendingUp },
    { id: 'customer' as const, label: t('goals.category.customer'), icon: Users },
    { id: 'processes' as const, label: t('goals.category.processes'), icon: Cog },
    { id: 'learning' as const, label: t('goals.category.learning'), icon: GraduationCap },
  ];

  // Stats
  const stats = useMemo(() => {
    if (!goals) return { total: 0, personal: 0, completed: 0 };
    const personal = goals.filter(g => g.perspective === 'personal').length;
    const completed = goals.filter(g => {
      const krs = keyResults?.filter(kr => kr.goal_id === g.id) || [];
      if (krs.length === 0) return false;
      const progress = krs.reduce((sum, kr) => sum + (kr.target_value > 0 ? ((kr.current_value || 0) / kr.target_value * 100) : 0), 0) / krs.length;
      return progress >= 100;
    }).length;
    return { total: goals.length, personal, completed };
  }, [goals, keyResults]);

  const getGoalKeyResults = (goalId: string) => {
    return keyResults?.filter(kr => kr.goal_id === goalId) || [];
  };

  const calculateProgress = (goalId: string) => {
    const krs = getGoalKeyResults(goalId);
    if (krs.length === 0) return 0;
    const totalProgress = krs.reduce((sum, kr) => {
      const progress = kr.target_value > 0 ? ((kr.current_value || 0) / kr.target_value) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    return Math.round(totalProgress / krs.length);
  };

  const filteredGoals = useMemo(() => {
    let filtered = goals || [];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(goal => goal.perspective === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [goals, selectedCategory, searchQuery]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateGoal = async (formData: any) => {
    try {
      await createGoal.mutateAsync({
        title: formData.title,
        description: formData.description || null,
        perspective: formData.perspective,
        target_value: formData.target_value ? parseFloat(formData.target_value) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : 0,
        unit: formData.unit || null,
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
        project_id: formData.project_id || null,
      });
      toast.success(t('goals.goalAdded'));
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateGoal = async (formData: any) => {
    if (!editingGoal) return;
    
    try {
      await updateGoal.mutateAsync({
        id: editingGoal.id,
        title: formData.title,
        description: formData.description || null,
        perspective: formData.perspective,
        target_value: formData.target_value ? parseFloat(formData.target_value) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : 0,
        unit: formData.unit || null,
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
        project_id: formData.project_id || null,
      });
      toast.success(t('goals.goalUpdated'));
      setEditingGoal(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      await deleteGoal.mutateAsync(goalToDelete.id);
      toast.success(t('goals.goalDeleted'));
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
  };

  const handleConfirmDelete = (goal: Goal) => {
    setGoalToDelete(goal);
    setDeleteDialogOpen(true);
  };

  const handleAddKeyResult = (goalId: string) => {
    setKrGoalId(goalId);
    setKrDialogOpen(true);
  };

  const handleArchiveGoal = async (goalId: string) => {
    try {
      await archiveGoal.mutateAsync(goalId);
      toast.success(t('goals.goalArchived'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleRestoreGoal = async (goalId: string) => {
    try {
      await restoreGoal.mutateAsync(goalId);
      toast.success(t('goals.goalRestored'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateKeyResult = async (krId: string, value: number) => {
    try {
      await updateKeyResult.mutateAsync({ id: krId, current_value: value });
      toast.success(t('goals.keyResultUpdated'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleCreateKeyResult = async () => {
    const parsedTarget = parseFloat(newKeyResult.target_value);
    if (!krGoalId || !newKeyResult.title || !newKeyResult.target_value || isNaN(parsedTarget) || parsedTarget <= 0) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createKeyResult.mutateAsync({
        goal_id: krGoalId,
        title: newKeyResult.title,
        target_value: parsedTarget,
        unit: newKeyResult.unit || null,
      });
      toast.success(t('goals.keyResultAdded'));
      setKrDialogOpen(false);
      setNewKeyResult({ title: '', target_value: '', unit: '' });
      setKrGoalId(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('goals.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('goals.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={activeTab === 'archive' ? 'default' : 'outline'}
              onClick={() => setActiveTab(activeTab === 'archive' ? 'goals' : 'archive')}
              className="gap-2"
            >
              <Archive className="w-4 h-4" />
              {t('goals.archive')}
              {archivedGoals && archivedGoals.length > 0 && (
                <Badge variant="secondary" className="ms-1">{archivedGoals.length}</Badge>
              )}
            </Button>
            <Button 
              variant={activeTab === 'analytics' ? 'default' : 'outline'}
              onClick={() => setActiveTab(activeTab === 'analytics' ? 'goals' : 'analytics')}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'التحليلات' : 'Analytics'}
            </Button>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
            >
              <Plus className="w-5 h-5 me-2" />
              {t('goals.newObjective')}
            </Button>
          </div>
        </div>

        {activeTab === 'analytics' ? (
          <GoalAnalytics goals={goals || []} keyResults={keyResults || []} />
        ) : activeTab === 'archive' ? (
          // Archived Goals Section
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Archive className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t('goals.archivedGoals')}</h2>
                <p className="text-sm text-muted-foreground">
                  {currentLanguage === 'ar' ? 'الأهداف المكتملة والمؤرشفة' : 'Completed and archived goals'}
                </p>
              </div>
            </div>

            {archivedGoals && archivedGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {archivedGoals.map((goal, index) => (
                  <div 
                    key={goal.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <GoalCard
                      goal={goal}
                      keyResults={getGoalKeyResults(goal.id)}
                      progress={calculateProgress(goal.id)}
                      onDelete={() => handleConfirmDelete(goal)}
                      onRestore={() => handleRestoreGoal(goal.id)}
                      isArchived
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border/50 bg-muted/20">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Archive className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {currentLanguage === 'ar' ? 'لا توجد أهداف مؤرشفة' : 'No archived goals'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {currentLanguage === 'ar' 
                    ? 'عند اكتمال هدف بنسبة 100%، يمكنك أرشفته من القائمة'
                    : 'When a goal reaches 100%, you can archive it from the menu'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">{t('goals.activeGoals')}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.personal}</p>
                    <p className="text-xs text-muted-foreground">{t('goals.personalGoals')}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">{t('goals.completedGoals')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={currentLanguage === 'ar' ? 'البحث في الأهداف...' : 'Search goals...'}
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'outline'} 
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-xl"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'outline'} 
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-xl"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = selectedCategory === tab.id;
                const config = categoryConfig[tab.id];
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                      isSelected 
                        ? config.color + ' shadow-lg'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Goals Grid/List */}
            {filteredGoals.length > 0 ? (
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
                  : 'space-y-4'
              )}>
                {filteredGoals.map((goal, index) => (
                  <div 
                    key={goal.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <GoalCard
                      goal={goal}
                      keyResults={getGoalKeyResults(goal.id)}
                      progress={calculateProgress(goal.id)}
                      onEdit={() => handleEditGoal(goal)}
                      onDelete={() => handleConfirmDelete(goal)}
                      onAddKeyResult={() => handleAddKeyResult(goal.id)}
                      onUpdateKeyResult={handleUpdateKeyResult}
                      onArchive={calculateProgress(goal.id) >= 100 ? () => handleArchiveGoal(goal.id) : undefined}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border/50 bg-muted/20">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('goals.noGoals')}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('goals.noGoalsDescription')}</p>
                <Button onClick={() => setIsDialogOpen(true)} className="shadow-lg">
                  <Plus className="w-5 h-5 me-2" />
                  {t('goals.newObjective')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Goal Dialog */}
      <GoalFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateGoal}
        isLoading={createGoal.isPending}
      />

      {/* Edit Goal Dialog */}
      <GoalFormDialog
        open={!!editingGoal}
        onOpenChange={(open) => !open && setEditingGoal(null)}
        onSubmit={handleUpdateGoal}
        isLoading={updateGoal.isPending}
        initialData={editingGoal ? {
          title: editingGoal.title,
          description: editingGoal.description || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          perspective: (editingGoal.perspective as any) || 'personal',
          target_value: editingGoal.target_value?.toString() || '',
          current_value: editingGoal.current_value?.toString() || '0',
          unit: editingGoal.unit || '',
          start_date: editingGoal.start_date ? new Date(editingGoal.start_date) : null,
          end_date: editingGoal.end_date ? new Date(editingGoal.end_date) : null,
        } : undefined}
        isEditing
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              {currentLanguage === 'ar' ? 'حذف الهدف' : 'Delete Goal'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentLanguage === 'ar' 
                ? `هل أنت متأكد من حذف "${goalToDelete?.title}"؟ سيتم حذف جميع النتائج الرئيسية المرتبطة به.`
                : `Are you sure you want to delete "${goalToDelete?.title}"? All related key results will also be deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGoal.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Key Result Dialog */}
      <Dialog open={krDialogOpen} onOpenChange={setKrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              {t('goals.addKeyResult')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t('goals.keyResultTitle')}</Label>
              <Input
                value={newKeyResult.title}
                onChange={(e) => setNewKeyResult({ ...newKeyResult, title: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'مثال: قراءة 12 كتاب' : 'e.g., Read 12 books'}
                className="bg-muted/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('goals.targetValue')}</Label>
                <Input
                  type="number"
                  value={newKeyResult.target_value}
                  onChange={(e) => setNewKeyResult({ ...newKeyResult, target_value: e.target.value })}
                  placeholder="12"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('goals.unit')}</Label>
                <Input
                  value={newKeyResult.unit}
                  onChange={(e) => setNewKeyResult({ ...newKeyResult, unit: e.target.value })}
                  placeholder={currentLanguage === 'ar' ? 'كتاب' : 'books'}
                  className="bg-muted/50"
                />
              </div>
            </div>
            <Button 
              onClick={handleCreateKeyResult} 
              className="w-full" 
              disabled={createKeyResult.isPending}
            >
              {createKeyResult.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 me-2" />
                  {t('common.add')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}