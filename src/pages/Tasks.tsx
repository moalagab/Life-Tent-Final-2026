import { MainLayout } from '@/components/layout/MainLayout';
import {
  Plus, Filter, Search, MoreHorizontal, Flag, Calendar, Loader2,
  FolderKanban, Target, Sparkles, User, Clock, Trash2, Edit3, GripVertical,
  Layers, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, Task } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isToday, isPast, parseISO, startOfDay } from 'date-fns';
import { TaskFormDialog, TaskFormData } from '@/components/tasks/TaskFormDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

const ALLOWED_CATEGORIES = ['all', 'work', 'personal'] as const;
const ALLOWED_DUE_FILTERS = ['overdue', 'today'] as const;

export default function Tasks() {
  const { t, currentLanguage } = useLanguage();
  const { data: tasks, isLoading } = useTasks();
  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const isMobile = useIsMobile();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>('todo');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  // Mobile: active column tab
  const [mobileActiveColumn, setMobileActiveColumn] = useState<TaskStatus>('todo');
  // Validate URL params with safe fallbacks; ignore unknown values.
  const rawCategory = searchParams.get('category');
  const rawDue = searchParams.get('filter');
  const initialCategory = (ALLOWED_CATEGORIES as readonly string[]).includes(rawCategory ?? '')
    ? (rawCategory as 'all' | 'work' | 'personal')
    : 'all';
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'work' | 'personal'>(initialCategory);
  const dueFilter: 'overdue' | 'today' | null = (ALLOWED_DUE_FILTERS as readonly string[]).includes(rawDue ?? '')
    ? (rawDue as 'overdue' | 'today')
    : null;

  // Clean unknown params from URL silently
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (rawCategory && !(ALLOWED_CATEGORIES as readonly string[]).includes(rawCategory)) {
      next.delete('category');
      changed = true;
    }
    if (rawDue && !(ALLOWED_DUE_FILTERS as readonly string[]).includes(rawDue)) {
      next.delete('filter');
      changed = true;
    }
    if (changed) setSearchParams(next, { replace: true });
  // rawCategory and rawDue are derived from searchParams; setSearchParams is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawCategory, rawDue]);

  // Open the create-task dialog when ?new=1 is present
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsDialogOpen(true);
      setDialogStatus('todo');
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // WIP limits per column
  const WIP_LIMITS: Record<TaskStatus, number> = {
    backlog: 999,
    todo: 10,
    in_progress: 3,
    review: 5,
    done: 999,
  };

  const columns = [
    { id: 'backlog' as const, title: t('tasks.backlog'), color: 'bg-muted-foreground', gradient: 'from-muted-foreground/20 to-muted-foreground/5' },
    { id: 'todo' as const, title: t('tasks.todo'), color: 'bg-blue-500', gradient: 'from-blue-500/20 to-blue-500/5' },
    { id: 'in_progress' as const, title: t('tasks.inProgress'), color: 'bg-primary', gradient: 'from-primary/20 to-primary/5' },
    { id: 'review' as const, title: t('tasks.review'), color: 'bg-purple-500', gradient: 'from-purple-500/20 to-purple-500/5' },
    { id: 'done' as const, title: t('tasks.done'), color: 'bg-success', gradient: 'from-success/20 to-success/5' },
  ];

  const priorityConfig: Record<string, { class: string; label: string; dotColor: string }> = {
    urgent: { class: 'bg-destructive text-destructive-foreground', label: t('tasks.priority.urgent'), dotColor: 'bg-destructive' },
    high: { class: 'bg-destructive/20 text-destructive', label: t('tasks.priority.high'), dotColor: 'bg-destructive' },
    medium: { class: 'bg-primary/20 text-primary', label: t('tasks.priority.medium'), dotColor: 'bg-primary' },
    low: { class: 'bg-muted text-muted-foreground', label: t('tasks.priority.low'), dotColor: 'bg-muted-foreground' },
  };

  const getTasksByStatus = (status: TaskStatus) => {
    let filtered = tasks?.filter(task => task.status === status) || [];
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => 
        (task as Record<string, unknown>).category === categoryFilter ||
        (categoryFilter === 'personal' && !(task as Record<string, unknown>).category)
      );
    }
    if (dueFilter) {
      const dayStart = startOfDay(new Date());
      filtered = filtered.filter((task) => {
        if (!task.due_date) return false;
        const d = parseISO(task.due_date);
        if (dueFilter === 'overdue') return isPast(d) && d < dayStart && task.status !== 'done';
        if (dueFilter === 'today') return isToday(d);
        return true;
      });
    }
    return filtered;
  };

  const clearDueFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('filter');
    setSearchParams(next, { replace: true });
  };

  const isWipLimitReached = (status: TaskStatus) => {
    const count = getTasksByStatus(status).length;
    return count >= WIP_LIMITS[status];
  };

  const getProjectById = (projectId: string | null) => {
    if (!projectId) return null;
    return projects?.find(p => p.id === projectId);
  };

  const handleCreateTask = async (formData: TaskFormData) => {
    try {
      await createTask.mutateAsync({
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
        due_time: formData.due_time || null,
        project_id: formData.project_id,
        is_focus: formData.is_focus,
        recurrence: formData.recurrence,
      });
      toast.success(t('tasks.taskAdded'));
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      });
      toast.success(t('tasks.taskUpdated'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success(t('tasks.taskDeleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: TaskStatus) => {
    if (draggedTask) {
      handleStatusChange(draggedTask, status);
      setDraggedTask(null);
    }
  };

  const openDialogForStatus = (status: TaskStatus) => {
    setDialogStatus(status);
    setIsDialogOpen(true);
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
      <div className="mb-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <FolderKanban className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">{t('tasks.title')}</h1>
              <p className="text-[11px] text-muted-foreground">
                {tasks?.filter(t => t.status !== 'done').length || 0} {currentLanguage === 'ar' ? 'مهمة نشطة' : 'active tasks'}
              </p>
            </div>
          </div>
          <button
            onClick={() => openDialogForStatus('todo')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('tasks.newTask')}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('tasks.searchTasks')}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Category Filter — Goals-style 3-column card grid */}
        {(() => {
          const CATS = [
            { id: 'all'      as const, label: currentLanguage === 'ar' ? 'الكل'   : 'All',      icon: Layers,    from: 'from-slate-500',   to: 'to-gray-600',   activeBorder: 'border-slate-400/40'   },
            { id: 'work'     as const, label: currentLanguage === 'ar' ? 'عمل'    : 'Work',     icon: Briefcase, from: 'from-blue-500',    to: 'to-indigo-600', activeBorder: 'border-blue-400/40'    },
            { id: 'personal' as const, label: currentLanguage === 'ar' ? 'شخصي'   : 'Personal', icon: User,      from: 'from-emerald-500', to: 'to-green-600',  activeBorder: 'border-emerald-400/40' },
          ] as const;
          return (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {CATS.map(cat => {
                const isActive = categoryFilter === cat.id;
                const Icon = cat.icon;
                const count = cat.id === 'all'
                  ? (tasks?.filter(tk => tk.status !== 'done').length ?? 0)
                  : (tasks?.filter(tk => tk.status !== 'done' && (
                      cat.id === 'personal'
                        ? !(tk as Record<string, unknown>).category
                        : (tk as Record<string, unknown>).category === cat.id
                    )).length ?? 0);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl transition-all duration-200 active:scale-95 border',
                      isActive
                        ? cn('bg-card/80 border-border/50 shadow-sm', cat.activeBorder)
                        : 'border-transparent bg-muted/30 hover:bg-muted/50',
                    )}
                  >
                    <div className="relative">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm', cat.from, cat.to)}>
                        <Icon className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
                      </div>
                      {count > 0 && (
                        <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1 shadow">
                          {count}
                        </span>
                      )}
                    </div>
                    <p className={cn('text-[10px] font-semibold text-center leading-tight', isActive ? 'text-foreground' : 'text-foreground/60')}>
                      {cat.label}
                    </p>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Active deep-link filter banner */}
        {dueFilter && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-sm">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground">
              {dueFilter === 'overdue'
                ? (currentLanguage === 'ar' ? 'يعرض المتأخر فقط' : 'Showing overdue only')
                : (currentLanguage === 'ar' ? 'يعرض مهام اليوم فقط' : 'Showing today only')}
            </span>
            <button
              onClick={clearDueFilter}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline ms-1"
            >
              {currentLanguage === 'ar' ? 'مسح' : 'Clear'}
            </button>
          </div>
        )}
      </div>

      {/* Empty state for deep-linked filters with zero results */}
      {dueFilter && columns.every((c) => getTasksByStatus(c.id).length === 0) && (
        <div className="mb-6 p-8 rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {dueFilter === 'overdue'
              ? (currentLanguage === 'ar' ? 'لا توجد مهام متأخرة 🎉' : 'No overdue tasks 🎉')
              : (currentLanguage === 'ar' ? 'لا توجد مهام مستحقة اليوم' : 'No tasks due today')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {currentLanguage === 'ar'
              ? 'أنت على المسار الصحيح. أزل الفلتر لعرض كل المهام.'
              : 'You\u2019re on track. Clear the filter to see all tasks.'}
          </p>
          <Button onClick={clearDueFilter} size="sm" variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            {currentLanguage === 'ar' ? 'مسح الفلتر' : 'Clear filter'}
          </Button>
        </div>
      )}

      {/* ── MOBILE VIEW (< md) ─────────────────────────────────────────── */}
      {isMobile && (
        <>
          {/* Sticky column tab bar */}
          <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-border/50">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {columns.map((column) => {
                const count = getTasksByStatus(column.id).length;
                const isActive = mobileActiveColumn === column.id;
                return (
                  <button
                    key={column.id}
                    onClick={() => setMobileActiveColumn(column.id)}
                    className={cn(
                      'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      isActive ? 'bg-primary-foreground/70' : column.color
                    )} />
                    {column.title}
                    <span className={cn(
                      'text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                      isActive ? 'bg-primary-foreground/20' : 'bg-background/70'
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile task list for the active column */}
          <div className="mt-4 space-y-3 pb-28">
            {(() => {
              const colTasks = getTasksByStatus(mobileActiveColumn);

              if (colTasks.length === 0) {
                return (
                  <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border/50">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">{t('tasks.noTasks')}</p>
                  </div>
                );
              }

              return colTasks.map((task) => {
                const project = getProjectById(task.project_id);
                const priority = priorityConfig[task.priority || 'medium'];

                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/50 active:scale-[0.98] transition-transform"
                  >
                    {/* Priority dot */}
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', priority.dotColor)} />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {project ? (
                          <span className="flex items-center gap-1 truncate max-w-[120px]">
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: project.color || '#6366f1' }}
                            />
                            {project.title}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {currentLanguage === 'ar' ? 'شخصي' : 'Personal'}
                          </span>
                        )}
                        {task.due_date && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(task.due_date), 'MMM d')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Priority badge */}
                    <Badge className={cn('text-[11px] shrink-0 hidden xs:flex gap-1', priority.class)}>
                      <Flag className="w-2.5 h-2.5" />
                      {priority.label}
                    </Badge>

                    {/* Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        {/* Move to other columns */}
                        {columns
                          .filter(c => c.id !== mobileActiveColumn)
                          .map(c => (
                            <DropdownMenuItem
                              key={c.id}
                              className="gap-2"
                              onClick={() => handleStatusChange(task.id, c.id)}
                            >
                              <div className={cn('w-2 h-2 rounded-full', c.color)} />
                              {currentLanguage === 'ar' ? 'نقل إلى' : 'Move to'} {c.title}
                            </DropdownMenuItem>
                          ))}
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive mt-1"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              });
            })()}
          </div>

          {/* FAB */}
          <button
            onClick={() => openDialogForStatus(mobileActiveColumn)}
            className="fixed bottom-20 end-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
            aria-label={t('tasks.newTask')}
          >
            <Plus className="w-6 h-6" />
          </button>
        </>
      )}

      {/* ── DESKTOP KANBAN (md+) ────────────────────────────────────────── */}
      {!isMobile && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {columns.map((column, colIndex) => {
            const columnTasks = getTasksByStatus(column.id);

            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 animate-fade-in"
                style={{ animationDelay: `${colIndex * 50}ms` }}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <div className={cn(
                  'flex items-center justify-between mb-4 p-3 rounded-xl bg-gradient-to-r',
                  column.gradient,
                  isWipLimitReached(column.id) && column.id !== 'backlog' && column.id !== 'done' && 'ring-2 ring-destructive/50'
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full shadow-lg', column.color)} />
                    <span className="font-semibold text-foreground">{column.title}</span>
                    <Badge
                      variant={isWipLimitReached(column.id) && column.id !== 'backlog' && column.id !== 'done' ? 'destructive' : 'secondary'}
                      className="text-xs px-2 py-0.5 rounded-full"
                    >
                      {columnTasks.length}
                      {WIP_LIMITS[column.id] < 999 && `/${WIP_LIMITS[column.id]}`}
                    </Badge>
                  </div>
                  <button
                    className={cn(
                      'p-1.5 rounded-lg hover:bg-background/50 transition-colors',
                      isWipLimitReached(column.id) && column.id !== 'backlog' && column.id !== 'done' && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => !isWipLimitReached(column.id) && openDialogForStatus(column.id)}
                    disabled={isWipLimitReached(column.id) && column.id !== 'backlog' && column.id !== 'done'}
                  >
                    <Plus className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </div>

                {/* Tasks Container */}
                <div className="space-y-3 min-h-[200px]">
                  {columnTasks.map((task, taskIndex) => {
                    const project = getProjectById(task.project_id);
                    const priority = priorityConfig[task.priority || 'medium'];

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        className={cn(
                          'group relative p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50',
                          'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                          'transition-all duration-200 cursor-grab active:cursor-grabbing',
                          draggedTask === task.id && 'opacity-50 scale-95'
                        )}
                        style={{ animationDelay: `${taskIndex * 30}ms` }}
                      >
                        {/* Drag Handle */}
                        <div className="absolute top-2 start-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>

                        {/* Action Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="absolute top-2 end-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Edit3 className="w-4 h-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive focus:text-destructive"
                              onClick={() => handleDelete(task.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Task Content */}
                        <div className="pt-1">
                          <h4 className="text-sm font-medium text-foreground mb-2 pe-6 group-hover:text-primary transition-colors">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Task Meta */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {/* Priority Badge */}
                            <Badge className={cn('text-xs gap-1 font-medium', priority.class)}>
                              <Flag className="w-3 h-3" />
                              {priority.label}
                            </Badge>

                            {/* Focus Badge */}
                            {task.is_focus && (
                              <Badge className="text-xs gap-1 bg-primary/15 text-primary/80">
                                <Target className="w-3 h-3" />
                                {currentLanguage === 'ar' ? 'تركيز' : 'Focus'}
                              </Badge>
                            )}
                          </div>

                          {/* Project & Date */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {project ? (
                              <span className="flex items-center gap-1.5">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: project.color || '#6366f1' }}
                                />
                                <FolderKanban className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{project.title}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                {currentLanguage === 'ar' ? 'شخصي' : 'Personal'}
                              </span>
                            )}

                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(task.due_date), 'MMM d')}
                              </span>
                            )}
                          </div>

                          {/* Recurrence Indicator */}
                          {task.recurrence && task.recurrence !== 'none' && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {task.recurrence === 'daily' && (currentLanguage === 'ar' ? 'يومياً' : 'Daily')}
                                {task.recurrence === 'weekly' && (currentLanguage === 'ar' ? 'أسبوعياً' : 'Weekly')}
                                {task.recurrence === 'monthly' && (currentLanguage === 'ar' ? 'شهرياً' : 'Monthly')}
                                {task.recurrence === 'yearly' && (currentLanguage === 'ar' ? 'سنوياً' : 'Yearly')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div className="text-center py-12 rounded-xl border-2 border-dashed border-border/50">
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">{t('tasks.noTasks')}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-primary"
                        onClick={() => openDialogForStatus(column.id)}
                      >
                        <Plus className="w-4 h-4 me-1" />
                        {t('common.add')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateTask}
        initialStatus={dialogStatus}
        isLoading={createTask.isPending}
      />
    </MainLayout>
  );
}
