import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/hooks/useLanguage';
import { useAreas, useUpdateArea, useArchiveArea } from '@/hooks/useAreas';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useResources, useCreateResource, useUpdateResource, useDeleteResource, ResourceType } from '@/hooks/useResources';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals';
import { useArchivedItems } from '@/hooks/useArchive';
import { useAreaNotes } from '@/hooks/useKnowledge';
import { NotesTab } from '@/components/notes/NotesTab';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Pencil, Archive, Check, X,
  FolderKanban, CheckSquare, Target, Database,
  Layers, Activity, Plus, ExternalLink, FileText,
  Link2, Film, BookOpen, File, RotateCcw,
  Calendar, AlertTriangle, StickyNote, MoreVertical, Trash2, ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type WorkspaceTab = 'overview' | 'projects' | 'tasks' | 'goals' | 'resources' | 'notes' | 'archive';

const RESOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  note: FileText, file: File, link: Link2, course: BookOpen, media: Film, document: FileText,
};

export default function AreaWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const dateLocale = isAr ? ar : undefined;

  const TABS: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
    { id: 'overview',  label: isAr ? 'نظرة عامة' : 'Overview',  icon: Activity },
    { id: 'projects',  label: isAr ? 'مشاريع'    : 'Projects',  icon: FolderKanban },
    { id: 'tasks',     label: isAr ? 'مهام'       : 'Tasks',     icon: CheckSquare },
    { id: 'goals',     label: isAr ? 'أهداف'      : 'Goals',     icon: Target },
    { id: 'resources', label: isAr ? 'موارد'      : 'Resources', icon: Database },
    { id: 'notes',     label: isAr ? 'ملاحظات'   : 'Notes',     icon: StickyNote },
    { id: 'archive',   label: isAr ? 'أرشيف'      : 'Archive',   icon: Archive },
  ];

  const STATUS_LABELS: Record<string, string> = {
    active:      isAr ? 'نشط'    : 'Active',
    planning:    isAr ? 'تخطيط'  : 'Planning',
    on_hold:     isAr ? 'متوقف'  : 'On Hold',
    completed:   isAr ? 'مكتمل'  : 'Completed',
    todo:        isAr ? 'قائمة'  : 'To Do',
    in_progress: isAr ? 'جارٍ'   : 'In Progress',
    done:        isAr ? 'منتهي'  : 'Done',
    backlog:     isAr ? 'متراكم' : 'Backlog',
  };

  const STATUS_COLORS: Record<string, string> = {
    active: 'text-success', planning: 'text-blue-500', on_hold: 'text-warning',
    completed: 'text-muted-foreground', todo: 'text-muted-foreground',
    in_progress: 'text-primary', done: 'text-success', backlog: 'text-muted-foreground',
  };

  // ── UI state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  // Projects
  const [showNewProject, setShowNewProject]   = useState(false);
  const [showLinkProject, setShowLinkProject] = useState(false);
  const [newProject, setNewProject]           = useState({ title: '', description: '', status: 'active' });
  const [editingProjectId, setEditingProjectId]     = useState<string | null>(null);
  const [editProjectTitle, setEditProjectTitle]     = useState('');
  const [deleteProjectId, setDeleteProjectId]       = useState<string | null>(null);

  // Tasks
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask]         = useState({ title: '', description: '', priority: 'medium', project_id: '' });
  const [editingTaskId, setEditingTaskId]   = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle]   = useState('');
  const [deleteTaskId, setDeleteTaskId]     = useState<string | null>(null);

  // Goals
  const [showNewGoal, setShowNewGoal]   = useState(false);
  const [showLinkGoal, setShowLinkGoal] = useState(false);
  const [newGoal, setNewGoal]           = useState({ title: '', description: '' });
  const [editingGoalId, setEditingGoalId]   = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle]   = useState('');
  const [deleteGoalId, setDeleteGoalId]     = useState<string | null>(null);

  // Resources
  const [showNewResource, setShowNewResource]   = useState(false);
  const [showEditResource, setShowEditResource] = useState(false);
  const [editingResource, setEditingResource]   = useState<{ id: string; title: string; description: string; source_url: string; type: ResourceType } | null>(null);
  const [newResource, setNewResource]           = useState({ type: 'link' as ResourceType, title: '', description: '', source_url: '', content: '' });
  const [deleteResourceId, setDeleteResourceId] = useState<string | null>(null);

  // ── Data hooks ──────────────────────────────────────────────────────────
  const { data: areas }         = useAreas(true);
  const { data: allProjects }   = useProjects();
  const { data: allTasks }      = useTasks();
  const { data: allGoals }      = useGoals();
  const { data: resources }     = useResources({ area_id: id });
  const { data: archivedItems } = useArchivedItems();
  const { data: areaNotes = [], isLoading: notesLoading } = useAreaNotes(id ?? null);

  const updateArea  = useUpdateArea();
  const archiveArea = useArchiveArea();

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();

  // ── Derived data ────────────────────────────────────────────────────────
  const area      = areas?.find(a => a.id === id);
  const areaColor = area?.color || '#2563EB';

  const areaProjects = useMemo(
    () => (allProjects ?? []).filter((p) => p.area_id === id),
    [allProjects, id],
  );
  const projectIds = useMemo(() => new Set(areaProjects.map((p) => p.id)), [areaProjects]);

  // Tasks linked directly (area_id) OR via project
  const areaTasks = useMemo(
    () => (allTasks ?? []).filter((t) =>
      t.area_id === id || (t.project_id && projectIds.has(t.project_id)),
    ),
    [allTasks, id, projectIds],
  );

  // Goals linked directly (area_id) OR via project
  const areaGoals = useMemo(
    () => (allGoals ?? []).filter((g) =>
      g.area_id === id || (g.project_id && projectIds.has(g.project_id)),
    ),
    [allGoals, id, projectIds],
  );

  const areaArchived = useMemo(
    () => (archivedItems ?? []).filter(
      (item) => item.original_data['area_id'] === id || (item.type === 'project' && projectIds.has(item.id)),
    ),
    [archivedItems, id, projectIds],
  );

  const activeTasks    = areaTasks.filter((t) => !['done', 'completed'].includes(t.status ?? ''));
  const activeProjects = areaProjects.filter((p) => p.status !== 'completed');

  // Projects not yet in this area (for linking)
  const linkableProjects = useMemo(
    () => (allProjects ?? []).filter((p) => p.area_id !== id && p.status !== 'archived'),
    [allProjects, id],
  );

  // Goals not yet in this area (for linking)
  const linkableGoals = useMemo(
    () => (allGoals ?? []).filter((g) => g.area_id !== id && g.project_id === null),
    [allGoals, id],
  );

  // ── Area header handlers ────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!id || !editName.trim()) return;
    try {
      await updateArea.mutateAsync({ id, name: editName.trim() });
      setIsEditingName(false);
      toast.success(isAr ? 'تم تحديث الاسم' : 'Name updated');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleSaveDesc = async () => {
    if (!id) return;
    try {
      await updateArea.mutateAsync({ id, description: editDesc });
      setIsEditingDesc(false);
      toast.success(isAr ? 'تم تحديث الوصف' : 'Description updated');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleArchive = async () => {
    if (!id) return;
    try {
      await archiveArea.mutateAsync(id);
      toast.success(isAr ? 'تم أرشفة المجال' : 'Area archived');
      navigate('/projects?tab=areas');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  // ── Project handlers ────────────────────────────────────────────────────
  const handleCreateProject = async () => {
    if (!newProject.title.trim() || !id) return;
    try {
      await createProject.mutateAsync({
        title: newProject.title.trim(),
        description: newProject.description || null,
        status: newProject.status as 'active' | 'on_hold' | 'completed',
        area_id: id,
        para_category: 'project',
        color: areaColor,
      });
      toast.success(isAr ? 'تم إنشاء المشروع' : 'Project created');
      setShowNewProject(false);
      setNewProject({ title: '', description: '', status: 'active' });
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleLinkProject = async (projectId: string) => {
    try {
      await updateProject.mutateAsync({ id: projectId, area_id: id });
      toast.success(isAr ? 'تم ربط المشروع بالمجال' : 'Project linked to area');
      setShowLinkProject(false);
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleUnlinkProject = async (projectId: string) => {
    try {
      await updateProject.mutateAsync({ id: projectId, area_id: null });
      toast.success(isAr ? 'تم إلغاء ربط المشروع' : 'Project unlinked');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleSaveProjectTitle = async (projectId: string) => {
    if (!editProjectTitle.trim()) return;
    try {
      await updateProject.mutateAsync({ id: projectId, title: editProjectTitle.trim() });
      setEditingProjectId(null);
      toast.success(isAr ? 'تم تحديث المشروع' : 'Project updated');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject.mutateAsync(projectId);
      setDeleteProjectId(null);
      toast.success(isAr ? 'تم حذف المشروع' : 'Project deleted');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  // ── Task handlers ───────────────────────────────────────────────────────
  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !id) return;
    try {
      await createTask.mutateAsync({
        title: newTask.title.trim(),
        description: newTask.description || null,
        priority: newTask.priority as 'low' | 'medium' | 'high' | 'urgent',
        project_id: newTask.project_id || null,
        area_id: id,
        status: 'todo',
      });
      toast.success(isAr ? 'تم إنشاء المهمة' : 'Task created');
      setShowNewTask(false);
      setNewTask({ title: '', description: '', priority: 'medium', project_id: '' });
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleSaveTaskTitle = async (taskId: string) => {
    if (!editTaskTitle.trim()) return;
    try {
      await updateTask.mutateAsync({ id: taskId, title: editTaskTitle.trim() });
      setEditingTaskId(null);
      toast.success(isAr ? 'تم تحديث المهمة' : 'Task updated');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleTaskStatus = async (taskId: string, status: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, status: status as 'todo' | 'in_progress' | 'done' | 'backlog' });
      toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      setDeleteTaskId(null);
      toast.success(isAr ? 'تم حذف المهمة' : 'Task deleted');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  // ── Goal handlers ───────────────────────────────────────────────────────
  const handleCreateGoal = async () => {
    if (!newGoal.title.trim() || !id) return;
    try {
      await createGoal.mutateAsync({
        title: newGoal.title.trim(),
        description: newGoal.description || null,
        area_id: id,
        is_active: true,
        progress: 0,
        perspective: 'personal',
      });
      toast.success(isAr ? 'تم إنشاء الهدف' : 'Goal created');
      setShowNewGoal(false);
      setNewGoal({ title: '', description: '' });
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleLinkGoal = async (goalId: string) => {
    try {
      await updateGoal.mutateAsync({ id: goalId, area_id: id });
      toast.success(isAr ? 'تم ربط الهدف بالمجال' : 'Goal linked to area');
      setShowLinkGoal(false);
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleUnlinkGoal = async (goalId: string) => {
    try {
      await updateGoal.mutateAsync({ id: goalId, area_id: null, project_id: null });
      toast.success(isAr ? 'تم إلغاء ربط الهدف' : 'Goal unlinked');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleSaveGoalTitle = async (goalId: string) => {
    if (!editGoalTitle.trim()) return;
    try {
      await updateGoal.mutateAsync({ id: goalId, title: editGoalTitle.trim() });
      setEditingGoalId(null);
      toast.success(isAr ? 'تم تحديث الهدف' : 'Goal updated');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal.mutateAsync(goalId);
      setDeleteGoalId(null);
      toast.success(isAr ? 'تم حذف الهدف' : 'Goal deleted');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  // ── Resource handlers ───────────────────────────────────────────────────
  const handleCreateResource = async () => {
    if (!newResource.title.trim() || !id) return;
    try {
      await createResource.mutateAsync({
        type: newResource.type,
        title: newResource.title.trim(),
        description: newResource.description || null,
        source_url: newResource.source_url || null,
        content: newResource.content || null,
        area_id: id,
      });
      toast.success(isAr ? 'تم إنشاء المورد' : 'Resource created');
      setShowNewResource(false);
      setNewResource({ type: 'link', title: '', description: '', source_url: '', content: '' });
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleSaveResource = async () => {
    if (!editingResource || !editingResource.title.trim()) return;
    try {
      await updateResource.mutateAsync({
        id: editingResource.id,
        title: editingResource.title.trim(),
        description: editingResource.description || null,
        source_url: editingResource.source_url || null,
      });
      toast.success(isAr ? 'تم تحديث المورد' : 'Resource updated');
      setShowEditResource(false);
      setEditingResource(null);
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await deleteResource.mutateAsync(resourceId);
      setDeleteResourceId(null);
      toast.success(isAr ? 'تم حذف المورد' : 'Resource deleted');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  // ── Not found ────────────────────────────────────────────────────────────
  if (!area && areas) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Layers className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{isAr ? 'المجال غير موجود' : 'Area not found'}</p>
          <Button variant="outline" onClick={() => navigate('/projects?tab=areas')}>
            {isAr ? 'العودة للمجالات' : 'Back to Areas'}
          </Button>
        </div>
      </MainLayout>
    );
  }

  // ── Reusable delete confirm row ─────────────────────────────────────────
  const DeleteConfirmRow = ({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) => (
    <div className="flex items-center gap-1.5 p-1.5 bg-destructive/10 rounded-lg border border-destructive/30">
      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
      <span className="text-xs text-destructive">{label}</span>
      <Button size="sm" variant="destructive" className="h-6 text-xs px-2" onClick={onConfirm}>
        {isAr ? 'نعم' : 'Yes'}
      </Button>
      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={onCancel}>
        {isAr ? 'لا' : 'No'}
      </Button>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3">
          <BackButton to="/projects?tab=areas" label={isAr ? 'المجالات' : 'Areas'} />
          <span className="text-muted-foreground/40 text-sm">/</span>
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{area?.name}</span>
        </div>

        {/* Area Header */}
        <div className="glass-card p-5 relative overflow-hidden" style={{ borderTop: `3px solid ${areaColor}` }}>
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ background: `radial-gradient(60% 60% at 80% 20%, ${areaColor}, transparent)` }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${areaColor}20` }}>
                <Layers className="w-6 h-6" style={{ color: areaColor }} />
              </div>
              <div className="min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      className="h-8 text-lg font-bold bg-muted/50" dir="auto" autoFocus />
                    <button onClick={handleSaveName} className="text-success"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditingName(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => { setEditName(area?.name ?? ''); setIsEditingName(true); }}
                    className="group flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground leading-tight">{area?.name}</h1>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity" />
                  </button>
                )}
                {isEditingDesc ? (
                  <div className="mt-2 space-y-2">
                    <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                      rows={2} className="text-sm bg-muted/50 resize-none" dir="auto" autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDesc}>{isAr ? 'حفظ' : 'Save'}</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setEditDesc(area?.description ?? ''); setIsEditingDesc(true); }}
                    className="group flex items-start gap-1.5 mt-1 text-start">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {area?.description || (isAr ? 'أضف وصفاً للمجال...' : 'Add a description...')}
                    </p>
                    <Pencil className="w-3 h-3 mt-0.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 shrink-0 transition-opacity" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {area?.status === 'active' ? (
                <Button variant="outline" size="sm" onClick={handleArchive} className="gap-1.5">
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'أرشفة' : 'Archive'}</span>
                </Button>
              ) : (
                <Badge variant="secondary">{isAr ? 'مؤرشف' : 'Archived'}</Badge>
              )}
            </div>
          </div>

          {/* KPI Strip */}
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { label: isAr ? 'مشاريع' : 'Projects', value: areaProjects.length, sub: `${activeProjects.length} ${isAr ? 'نشط' : 'active'}`, color: 'text-primary' },
              { label: isAr ? 'مهام' : 'Tasks',     value: areaTasks.length,    sub: `${activeTasks.length} ${isAr ? 'نشط' : 'active'}`, color: 'text-blue-500' },
              { label: isAr ? 'أهداف' : 'Goals',    value: areaGoals.length,    sub: isAr ? 'مرتبط' : 'linked',   color: 'text-amber-500' },
              { label: isAr ? 'موارد' : 'Resources', value: resources?.length ?? 0, sub: isAr ? 'ملف ورابط' : 'files & links', color: 'text-success' },
            ].map((kpi) => (
              <div key={kpi.label} className="text-center p-2.5 rounded-xl bg-background/40">
                <p className={cn('text-2xl font-bold', kpi.color)}>{kpi.value}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {TABS.map(({ id: tabId, label, icon: Icon }) => {
            const active = activeTab === tabId;
            return (
              <button key={tabId} onClick={() => setActiveTab(tabId)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all duration-200 active:scale-95',
                  active ? 'bg-card/80 border-border/50 shadow-sm' : 'border-transparent bg-muted/30 hover:bg-muted/50',
                )}>
                <Icon className={cn('w-6 h-6', active ? 'text-primary' : 'text-muted-foreground')} strokeWidth={active ? 2 : 1.75} />
                <span className={cn('text-[11px] font-semibold', active ? 'text-foreground' : 'text-foreground/60')}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ══ Tab Content ═══════════════════════════════════════════════════ */}
        <div className="space-y-4 pb-8">

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent Projects */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-primary" />
                    {isAr ? 'آخر المشاريع' : 'Recent Projects'}
                  </h3>
                  <button onClick={() => setActiveTab('projects')} className="text-xs text-primary hover:underline">{isAr ? 'الكل' : 'All'}</button>
                </div>
                {areaProjects.slice(0, 3).map((p) => (
                  <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || areaColor }} />
                    <span className="text-sm flex-1 truncate">{p.title}</span>
                    <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[p.status ?? ''])}>{STATUS_LABELS[p.status ?? ''] ?? p.status}</Badge>
                  </div>
                ))}
                {areaProjects.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{isAr ? 'لا توجد مشاريع مرتبطة' : 'No linked projects'}</p>}
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => { setActiveTab('projects'); setShowNewProject(true); }}>
                  <Plus className="w-3.5 h-3.5" />
                  {isAr ? 'مشروع جديد' : 'New project'}
                </Button>
              </div>

              {/* Recent Tasks */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    {isAr ? 'آخر المهام' : 'Recent Tasks'}
                  </h3>
                  <button onClick={() => setActiveTab('tasks')} className="text-xs text-primary hover:underline">{isAr ? 'الكل' : 'All'}</button>
                </div>
                {activeTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/20 transition-colors">
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0',
                      t.priority === 'urgent' ? 'bg-destructive' : t.priority === 'high' ? 'bg-warning' : 'bg-muted-foreground/40')} />
                    <span className="text-sm flex-1 truncate">{t.title}</span>
                    {t.due_date && <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(t.due_date), 'dd MMM', { locale: dateLocale })}</span>}
                  </div>
                ))}
                {activeTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{isAr ? 'لا توجد مهام نشطة' : 'No active tasks'}</p>}
              </div>

              {/* Resources */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    {isAr ? 'الموارد' : 'Resources'}
                  </h3>
                  <button onClick={() => setActiveTab('resources')} className="text-xs text-primary hover:underline">{isAr ? 'الكل' : 'All'}</button>
                </div>
                {(resources ?? []).slice(0, 4).map((r) => {
                  const Icon = RESOURCE_ICONS[r.type] ?? File;
                  return (
                    <div key={r.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/20 transition-colors">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1 truncate">{r.title}</span>
                      {r.source_url && (
                        <a href={r.source_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-primary" />
                        </a>
                      )}
                    </div>
                  );
                })}
                {(resources ?? []).length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{isAr ? 'لا توجد موارد' : 'No resources'}</p>}
              </div>

              {/* Goals */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    {isAr ? 'الأهداف' : 'Goals'}
                  </h3>
                  <button onClick={() => setActiveTab('goals')} className="text-xs text-primary hover:underline">{isAr ? 'الكل' : 'All'}</button>
                </div>
                {areaGoals.slice(0, 3).map((g) => (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1">{g.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{g.progress ?? 0}%</span>
                    </div>
                    <Progress value={g.progress ?? 0} className="h-1.5" />
                  </div>
                ))}
                {areaGoals.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{isAr ? 'لا توجد أهداف مرتبطة' : 'No linked goals'}</p>}
              </div>
            </div>
          )}

          {/* ── PROJECTS ─────────────────────────────────────────────────── */}
          {activeTab === 'projects' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{areaProjects.length} {isAr ? 'مشروع' : 'projects'}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowLinkProject(true)}>
                    <Link2 className="w-3.5 h-3.5" />{isAr ? 'ربط مشروع' : 'Link Project'}
                  </Button>
                  <Button variant="gold" size="sm" className="gap-1.5" onClick={() => setShowNewProject(true)}>
                    <Plus className="w-3.5 h-3.5" />{isAr ? 'مشروع جديد' : 'New Project'}
                  </Button>
                </div>
              </div>
              {areaProjects.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{isAr ? 'لا توجد مشاريع مرتبطة' : 'No linked projects'}</p>
                  <p className="text-xs mt-1">{isAr ? 'أنشئ مشروعاً جديداً أو اربط مشاريع موجودة' : 'Create a new project or link existing ones'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {areaProjects.map((p) => (
                    <div key={p.id} className="glass-card p-4 space-y-3" style={{ borderRight: `3px solid ${p.color || areaColor}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {editingProjectId === p.id ? (
                            <div className="flex items-center gap-2">
                              <Input value={editProjectTitle} onChange={(e) => setEditProjectTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveProjectTitle(p.id)}
                                className="h-7 text-sm" dir="auto" autoFocus />
                              <button onClick={() => handleSaveProjectTitle(p.id)} className="text-success"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingProjectId(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <p className="font-semibold text-sm truncate">{p.title}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[p.status ?? ''])}>{STATUS_LABELS[p.status ?? ''] ?? p.status}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/projects/${p.id}`)}>
                                <ArrowUpRight className="w-4 h-4 me-2" />{isAr ? 'فتح المشروع' : 'Open'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditProjectTitle(p.title); setEditingProjectId(p.id); }}>
                                <Pencil className="w-4 h-4 me-2" />{isAr ? 'تعديل' : 'Edit'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUnlinkProject(p.id)}>
                                <Link2 className="w-4 h-4 me-2" />{isAr ? 'إلغاء الربط' : 'Unlink'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteProjectId(p.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 me-2" />{isAr ? 'حذف' : 'Delete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {deleteProjectId === p.id && (
                        <DeleteConfirmRow
                          label={isAr ? 'حذف المشروع نهائياً؟' : 'Delete project permanently?'}
                          onConfirm={() => handleDeleteProject(p.id)}
                          onCancel={() => setDeleteProjectId(null)}
                        />
                      )}
                      {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{isAr ? 'التقدم' : 'Progress'}</span>
                          <span>{p.progress ?? 0}%</span>
                        </div>
                        <Progress value={p.progress ?? 0} className="h-1.5" />
                      </div>
                      <Button variant="ghost" size="sm" className="w-full gap-1.5 h-7 text-xs text-muted-foreground" onClick={() => navigate(`/projects/${p.id}`)}>
                        <ArrowUpRight className="w-3.5 h-3.5" />{isAr ? 'فتح المشروع' : 'Open Project'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TASKS ────────────────────────────────────────────────────── */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{areaTasks.length} {isAr ? 'مهمة' : 'tasks'}</p>
                <Button variant="gold" size="sm" className="gap-1.5" onClick={() => setShowNewTask(true)}>
                  <Plus className="w-3.5 h-3.5" />{isAr ? 'مهمة جديدة' : 'New Task'}
                </Button>
              </div>
              {areaTasks.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{isAr ? 'لا توجد مهام مرتبطة' : 'No linked tasks'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {areaTasks.map((t) => {
                    const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !['done', 'completed'].includes(t.status ?? '');
                    return (
                      <div key={t.id} className={cn('glass-card p-3 space-y-2', isOverdue && 'border-destructive/30 bg-destructive/5')}>
                        <div className="flex items-center gap-3">
                          <div className={cn('w-2 h-2 rounded-full shrink-0',
                            t.priority === 'urgent' ? 'bg-destructive' : t.priority === 'high' ? 'bg-warning' : t.priority === 'medium' ? 'bg-primary' : 'bg-muted-foreground/40')} />
                          <div className="flex-1 min-w-0">
                            {editingTaskId === t.id ? (
                              <div className="flex items-center gap-2">
                                <Input value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTaskTitle(t.id)}
                                  className="h-7 text-sm" dir="auto" autoFocus />
                                <button onClick={() => handleSaveTaskTitle(t.id)} className="text-success"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditingTaskId(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <p className={cn('text-sm font-medium truncate', t.status === 'done' && 'line-through text-muted-foreground')}>{t.title}</p>
                            )}
                            {(t as { projects?: { title: string } | null }).projects?.title && (
                              <p className="text-xs text-muted-foreground truncate">{(t as { projects?: { title: string } | null }).projects?.title}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                            {t.due_date && (
                              <span className={cn('text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                                {format(new Date(t.due_date), 'dd MMM', { locale: dateLocale })}
                              </span>
                            )}
                            <Select value={t.status ?? 'todo'} onValueChange={(v) => handleTaskStatus(t.id, v)}>
                              <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todo">{isAr ? 'للعمل' : 'To Do'}</SelectItem>
                                <SelectItem value="in_progress">{isAr ? 'جارٍ' : 'In Progress'}</SelectItem>
                                <SelectItem value="done">{isAr ? 'مكتمل' : 'Done'}</SelectItem>
                              </SelectContent>
                            </Select>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditTaskTitle(t.title); setEditingTaskId(t.id); }}>
                                  <Pencil className="w-4 h-4 me-2" />{isAr ? 'تعديل' : 'Edit'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDeleteTaskId(t.id)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 me-2" />{isAr ? 'حذف' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {deleteTaskId === t.id && (
                          <DeleteConfirmRow
                            label={isAr ? 'حذف المهمة؟' : 'Delete task?'}
                            onConfirm={() => handleDeleteTask(t.id)}
                            onCancel={() => setDeleteTaskId(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── GOALS ────────────────────────────────────────────────────── */}
          {activeTab === 'goals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{areaGoals.length} {isAr ? 'هدف' : 'goals'}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowLinkGoal(true)}>
                    <Link2 className="w-3.5 h-3.5" />{isAr ? 'ربط هدف' : 'Link Goal'}
                  </Button>
                  <Button variant="gold" size="sm" className="gap-1.5" onClick={() => setShowNewGoal(true)}>
                    <Plus className="w-3.5 h-3.5" />{isAr ? 'هدف جديد' : 'New Goal'}
                  </Button>
                </div>
              </div>
              {areaGoals.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{isAr ? 'لا توجد أهداف مرتبطة' : 'No linked goals'}</p>
                  <p className="text-xs mt-1">{isAr ? 'أنشئ هدفاً جديداً أو اربط هدفاً موجوداً' : 'Create a new goal or link an existing one'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {areaGoals.map((g) => (
                    <div key={g.id} className="glass-card p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {editingGoalId === g.id ? (
                            <div className="flex items-center gap-2">
                              <Input value={editGoalTitle} onChange={(e) => setEditGoalTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveGoalTitle(g.id)}
                                className="h-7 text-sm" dir="auto" autoFocus />
                              <button onClick={() => handleSaveGoalTitle(g.id)} className="text-success"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingGoalId(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <p className="font-semibold text-sm truncate">{g.title}</p>
                          )}
                          {g.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{g.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {g.perspective && <Badge variant="secondary" className="text-xs">{g.perspective}</Badge>}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditGoalTitle(g.title); setEditingGoalId(g.id); }}>
                                <Pencil className="w-4 h-4 me-2" />{isAr ? 'تعديل' : 'Edit'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUnlinkGoal(g.id)}>
                                <Link2 className="w-4 h-4 me-2" />{isAr ? 'إلغاء الربط' : 'Unlink'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteGoalId(g.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 me-2" />{isAr ? 'حذف' : 'Delete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {deleteGoalId === g.id && (
                        <DeleteConfirmRow
                          label={isAr ? 'حذف الهدف نهائياً؟' : 'Delete goal permanently?'}
                          onConfirm={() => handleDeleteGoal(g.id)}
                          onCancel={() => setDeleteGoalId(null)}
                        />
                      )}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{isAr ? 'التقدم' : 'Progress'}</span>
                          <span className="font-semibold text-primary">{g.progress ?? 0}%</span>
                        </div>
                        <Progress value={g.progress ?? 0} className="h-2" />
                      </div>
                      {g.target_date && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(g.target_date), 'dd MMM yyyy', { locale: dateLocale })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RESOURCES ────────────────────────────────────────────────── */}
          {activeTab === 'resources' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{resources?.length ?? 0} {isAr ? 'مورد' : 'resources'}</p>
                <Button variant="gold" size="sm" className="gap-1.5" onClick={() => setShowNewResource(true)}>
                  <Plus className="w-3.5 h-3.5" />{isAr ? 'مورد جديد' : 'New Resource'}
                </Button>
              </div>
              {(resources ?? []).length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{isAr ? 'لا توجد موارد' : 'No resources'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(resources ?? []).map((r) => {
                    const Icon = RESOURCE_ICONS[r.type] ?? File;
                    return (
                      <div key={r.id} className="glass-card p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{r.title}</p>
                              <Badge variant="outline" className="text-xs mt-0.5">{r.type}</Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreVertical className="w-3.5 h-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {r.source_url && (
                                <DropdownMenuItem onClick={() => window.open(r.source_url!, '_blank')}>
                                  <ExternalLink className="w-4 h-4 me-2" />{isAr ? 'فتح الرابط' : 'Open Link'}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {
                                setEditingResource({ id: r.id, title: r.title, description: r.description ?? '', source_url: r.source_url ?? '', type: r.type });
                                setShowEditResource(true);
                              }}>
                                <Pencil className="w-4 h-4 me-2" />{isAr ? 'تعديل' : 'Edit'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteResourceId(r.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 me-2" />{isAr ? 'حذف' : 'Delete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {deleteResourceId === r.id && (
                          <DeleteConfirmRow
                            label={isAr ? 'حذف المورد؟' : 'Delete resource?'}
                            onConfirm={() => handleDeleteResource(r.id)}
                            onCancel={() => setDeleteResourceId(null)}
                          />
                        )}
                        {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                        {r.source_url && (
                          <a href={r.source_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <ExternalLink className="w-3 h-3" />{isAr ? 'فتح الرابط' : 'Open link'}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── NOTES ────────────────────────────────────────────────────── */}
          {activeTab === 'notes' && (
            <NotesTab notes={areaNotes} isLoading={notesLoading} linkField="folder" linkValue={id ?? ''} />
          )}

          {/* ── ARCHIVE ──────────────────────────────────────────────────── */}
          {activeTab === 'archive' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{areaArchived.length} {isAr ? 'عنصر مؤرشف' : 'archived items'}</p>
              {areaArchived.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Archive className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{isAr ? 'لا توجد عناصر مؤرشفة' : 'No archived items'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {areaArchived.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="glass-card p-3 flex items-center gap-3 opacity-70">
                      <Archive className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(item.archived_at), 'dd MMM yyyy', { locale: dateLocale })}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{item.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/archive')}>
                <RotateCcw className="w-3.5 h-3.5" />{isAr ? 'الأرشيف الكامل' : 'Full Archive'}
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* ════════════════════ DIALOGS ════════════════════ */}

      {/* New Project */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isAr ? 'مشروع جديد' : 'New Project'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{isAr ? 'العنوان' : 'Title'}</Label>
              <Input dir="auto" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder={isAr ? 'عنوان المشروع...' : 'Project title...'} autoFocus /></div>
            <div><Label>{isAr ? 'الوصف' : 'Description'}</Label>
              <Textarea dir="auto" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} rows={2} /></div>
            <div><Label>{isAr ? 'الحالة' : 'Status'}</Label>
              <Select value={newProject.status} onValueChange={(v) => setNewProject({ ...newProject, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{isAr ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="planning">{isAr ? 'تخطيط' : 'Planning'}</SelectItem>
                  <SelectItem value="on_hold">{isAr ? 'متوقف' : 'On Hold'}</SelectItem>
                </SelectContent>
              </Select></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewProject(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleCreateProject} disabled={createProject.isPending}>{isAr ? 'إنشاء' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Existing Project */}
      <Dialog open={showLinkProject} onOpenChange={setShowLinkProject}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isAr ? 'ربط مشروع موجود' : 'Link Existing Project'}</DialogTitle></DialogHeader>
          {linkableProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{isAr ? 'لا توجد مشاريع أخرى متاحة' : 'No other projects available'}</p>
          ) : (
            <ScrollArea className="max-h-72">
              <div className="space-y-2 p-1">
                {linkableProjects.map((p) => (
                  <button key={p.id} onClick={() => handleLinkProject(p.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 text-start transition-colors"
                    disabled={updateProject.isPending}>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color || '#888' }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                    </div>
                    <Badge variant="outline" className={cn('text-xs shrink-0', STATUS_COLORS[p.status ?? ''])}>{STATUS_LABELS[p.status ?? ''] ?? p.status}</Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* New Task */}
      <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isAr ? 'مهمة جديدة' : 'New Task'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{isAr ? 'العنوان' : 'Title'}</Label>
              <Input dir="auto" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder={isAr ? 'عنوان المهمة...' : 'Task title...'} autoFocus /></div>
            <div><Label>{isAr ? 'الوصف' : 'Description'}</Label>
              <Textarea dir="auto" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{isAr ? 'الأولوية' : 'Priority'}</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">{isAr ? 'عاجل' : 'Urgent'}</SelectItem>
                    <SelectItem value="high">{isAr ? 'عالي' : 'High'}</SelectItem>
                    <SelectItem value="medium">{isAr ? 'متوسط' : 'Medium'}</SelectItem>
                    <SelectItem value="low">{isAr ? 'منخفض' : 'Low'}</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label>{isAr ? 'المشروع (اختياري)' : 'Project (optional)'}</Label>
                <Select value={newTask.project_id || 'none'} onValueChange={(v) => setNewTask({ ...newTask, project_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder={isAr ? 'بدون' : 'None'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{isAr ? 'بدون مشروع' : 'No project'}</SelectItem>
                    {areaProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewTask(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleCreateTask} disabled={createTask.isPending}>{isAr ? 'إنشاء' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Goal */}
      <Dialog open={showNewGoal} onOpenChange={setShowNewGoal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isAr ? 'هدف جديد' : 'New Goal'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{isAr ? 'العنوان' : 'Title'}</Label>
              <Input dir="auto" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder={isAr ? 'عنوان الهدف...' : 'Goal title...'} autoFocus /></div>
            <div><Label>{isAr ? 'الوصف' : 'Description'}</Label>
              <Textarea dir="auto" value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} rows={2} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewGoal(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleCreateGoal} disabled={createGoal.isPending}>{isAr ? 'إنشاء' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Existing Goal */}
      <Dialog open={showLinkGoal} onOpenChange={setShowLinkGoal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isAr ? 'ربط هدف موجود' : 'Link Existing Goal'}</DialogTitle></DialogHeader>
          {linkableGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{isAr ? 'لا توجد أهداف غير مرتبطة' : 'No unlinked goals available'}</p>
          ) : (
            <ScrollArea className="max-h-72">
              <div className="space-y-2 p-1">
                {linkableGoals.map((g) => (
                  <button key={g.id} onClick={() => handleLinkGoal(g.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 text-start transition-colors"
                    disabled={updateGoal.isPending}>
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

      {/* New Resource */}
      <Dialog open={showNewResource} onOpenChange={setShowNewResource}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isAr ? 'مورد جديد' : 'New Resource'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{isAr ? 'النوع' : 'Type'}</Label>
              <Select value={newResource.type} onValueChange={(v) => setNewResource({ ...newResource, type: v as ResourceType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['link', 'note', 'file', 'course', 'media', 'document'] as ResourceType[]).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select></div>
            <div><Label>{isAr ? 'العنوان' : 'Title'}</Label>
              <Input dir="auto" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                placeholder={isAr ? 'عنوان المورد...' : 'Resource title...'} autoFocus /></div>
            <div><Label>{isAr ? 'الوصف' : 'Description'}</Label>
              <Textarea dir="auto" value={newResource.description} onChange={(e) => setNewResource({ ...newResource, description: e.target.value })} rows={2} /></div>
            {(newResource.type === 'link' || newResource.type === 'course') && (
              <div><Label>{isAr ? 'الرابط' : 'URL'}</Label>
                <Input type="url" value={newResource.source_url} onChange={(e) => setNewResource({ ...newResource, source_url: e.target.value })} placeholder="https://..." /></div>
            )}
            {(newResource.type === 'note' || newResource.type === 'document') && (
              <div><Label>{isAr ? 'المحتوى' : 'Content'}</Label>
                <Textarea dir="auto" value={newResource.content} onChange={(e) => setNewResource({ ...newResource, content: e.target.value })} rows={3} /></div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewResource(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleCreateResource} disabled={createResource.isPending}>{isAr ? 'إنشاء' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Resource */}
      <Dialog open={showEditResource} onOpenChange={setShowEditResource}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isAr ? 'تعديل المورد' : 'Edit Resource'}</DialogTitle></DialogHeader>
          {editingResource && (
            <div className="space-y-4">
              <div><Label>{isAr ? 'العنوان' : 'Title'}</Label>
                <Input dir="auto" value={editingResource.title}
                  onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })} autoFocus /></div>
              <div><Label>{isAr ? 'الوصف' : 'Description'}</Label>
                <Textarea dir="auto" value={editingResource.description}
                  onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })} rows={2} /></div>
              {(editingResource.type === 'link' || editingResource.type === 'course') && (
                <div><Label>{isAr ? 'الرابط' : 'URL'}</Label>
                  <Input type="url" value={editingResource.source_url}
                    onChange={(e) => setEditingResource({ ...editingResource, source_url: e.target.value })} /></div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditResource(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
                <Button onClick={handleSaveResource} disabled={updateResource.isPending}>{isAr ? 'حفظ' : 'Save'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
