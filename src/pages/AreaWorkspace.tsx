import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAreas, useUpdateArea, useArchiveArea } from '@/hooks/useAreas';
import { useProjects } from '@/hooks/useProjects';
import { useResources } from '@/hooks/useResources';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useArchivedItems } from '@/hooks/useArchive';
import { useAreaNotes } from '@/hooks/useKnowledge';
import { NotesTab } from '@/components/notes/NotesTab';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Pencil, Archive, Check, X,
  FolderKanban, CheckSquare, Target, Database,
  Layers, Activity, Plus, ExternalLink, FileText,
  Link2, Film, BookOpen, File, RotateCcw,
  Calendar, AlertTriangle, StickyNote,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type WorkspaceTab = 'overview' | 'projects' | 'tasks' | 'goals' | 'resources' | 'notes' | 'archive';

const TABS: { id: WorkspaceTab; labelAr: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { id: 'overview',   labelAr: 'نظرة عامة', icon: Activity },
  { id: 'projects',   labelAr: 'مشاريع',    icon: FolderKanban },
  { id: 'tasks',      labelAr: 'مهام',       icon: CheckSquare },
  { id: 'goals',      labelAr: 'أهداف',      icon: Target },
  { id: 'resources',  labelAr: 'موارد',      icon: Database },
  { id: 'notes',      labelAr: 'ملاحظات',   icon: StickyNote },
  { id: 'archive',    labelAr: 'أرشيف',      icon: Archive },
];

const STATUS_LABELS: Record<string, string> = {
  active: 'نشط', planning: 'تخطيط', on_hold: 'متوقف', completed: 'مكتمل',
  todo: 'قائمة', in_progress: 'جارٍ', done: 'منتهي', backlog: 'متراكم',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'text-success', planning: 'text-blue-500', on_hold: 'text-warning',
  completed: 'text-muted-foreground', todo: 'text-muted-foreground',
  in_progress: 'text-primary', done: 'text-success', backlog: 'text-muted-foreground',
};

const RESOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  note: FileText, file: File, link: Link2, course: BookOpen, media: Film, document: FileText,
};

export default function AreaWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  const { data: areas } = useAreas(true);
  const { data: allProjects } = useProjects();
  const { data: allTasks } = useTasks();
  const { data: allGoals } = useGoals();
  const { data: resources } = useResources({ area_id: id });
  const { data: archivedItems } = useArchivedItems();
  const { data: areaNotes = [], isLoading: notesLoading } = useAreaNotes(id ?? null);

  const updateArea = useUpdateArea();
  const archiveArea = useArchiveArea();

  const area = areas?.find(a => a.id === id);
  const areaColor = area?.color || '#2563EB';

  // Filter by area
  const areaProjects = useMemo(
    () => (allProjects ?? []).filter((p: { area_id?: string | null }) => p.area_id === id),
    [allProjects, id],
  );
  const projectIds = useMemo(() => new Set(areaProjects.map((p: { id: string }) => p.id)), [areaProjects]);

  const areaTasks = useMemo(
    () => (allTasks ?? []).filter((t: { project_id?: string | null }) => t.project_id && projectIds.has(t.project_id)),
    [allTasks, projectIds],
  );

  const areaGoals = useMemo(
    () => (allGoals ?? []).filter((g: { project_id?: string | null }) => g.project_id && projectIds.has(g.project_id)),
    [allGoals, projectIds],
  );

  const areaArchived = useMemo(
    () => (archivedItems ?? []).filter(
      (item) =>
        item.original_data['area_id'] === id ||
        (item.type === 'project' && projectIds.has(item.id)),
    ),
    [archivedItems, id, projectIds],
  );

  const activeTasks = areaTasks.filter((t: { status?: string }) => !['done', 'completed'].includes(t.status ?? ''));
  const activeProjects = areaProjects.filter((p: { status?: string }) => p.status !== 'completed');

  if (!area && areas) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Layers className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">المجال غير موجود</p>
          <Button variant="outline" onClick={() => navigate('/projects?tab=areas')}>
            العودة للمجالات
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleSaveName = async () => {
    if (!id || !editName.trim()) return;
    try {
      await updateArea.mutateAsync({ id, name: editName.trim() });
      setIsEditingName(false);
      toast.success('تم تحديث الاسم');
    } catch { toast.error('حدث خطأ'); }
  };

  const handleSaveDesc = async () => {
    if (!id) return;
    try {
      await updateArea.mutateAsync({ id, description: editDesc });
      setIsEditingDesc(false);
      toast.success('تم تحديث الوصف');
    } catch { toast.error('حدث خطأ'); }
  };

  const handleArchive = async () => {
    if (!id) return;
    try {
      await archiveArea.mutateAsync(id);
      toast.success('تم أرشفة المجال');
      navigate('/projects?tab=areas');
    } catch { toast.error('حدث خطأ'); }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Back + breadcrumb ── */}
        <div className="flex items-center gap-3">
          <BackButton to="/projects?tab=areas" label="المجالات" />
          <span className="text-muted-foreground/40 text-sm">/</span>
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{area?.name}</span>
        </div>

        {/* ── Area Header ── */}
        <div
          className="glass-card p-5 relative overflow-hidden"
          style={{ borderTop: `3px solid ${areaColor}` }}
        >
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ background: `radial-gradient(60% 60% at 80% 20%, ${areaColor}, transparent)` }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${areaColor}20` }}
              >
                <Layers className="w-6 h-6" style={{ color: areaColor }} />
              </div>
              <div className="min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      className="h-8 text-lg font-bold bg-muted/50"
                      dir="auto"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="text-success"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditingName(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditName(area?.name ?? ''); setIsEditingName(true); }}
                    className="group flex items-center gap-2"
                  >
                    <h1 className="text-xl font-bold text-foreground leading-tight">{area?.name}</h1>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity" />
                  </button>
                )}
                {isEditingDesc ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                      className="text-sm bg-muted/50 resize-none"
                      dir="auto"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDesc}>حفظ</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)}>إلغاء</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditDesc(area?.description ?? ''); setIsEditingDesc(true); }}
                    className="group flex items-start gap-1.5 mt-1 text-start"
                  >
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {area?.description || 'أضف وصفاً للمجال...'}
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
                  <span className="hidden sm:inline">أرشفة</span>
                </Button>
              ) : (
                <Badge variant="secondary">مؤرشف</Badge>
              )}
            </div>
          </div>

          {/* KPI Strip */}
          <div className="relative grid grid-cols-4 gap-3 mt-5">
            {[
              { label: 'مشاريع', value: areaProjects.length, sub: `${activeProjects.length} نشط`, color: 'text-primary' },
              { label: 'مهام',   value: areaTasks.length,    sub: `${activeTasks.length} نشط`,  color: 'text-blue-500' },
              { label: 'أهداف',  value: areaGoals.length,    sub: 'هدف مرتبط',                  color: 'text-amber-500' },
              { label: 'موارد',  value: resources?.length ?? 0, sub: 'ملف ورابط',               color: 'text-success' },
            ].map((kpi) => (
              <div key={kpi.label} className="text-center p-2.5 rounded-xl bg-background/40">
                <p className={cn('text-2xl font-bold', kpi.color)}>{kpi.value}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Selector ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {TABS.map(({ id: tabId, labelAr, icon: Icon }) => {
            const active = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all duration-200 active:scale-95',
                  active
                    ? 'bg-card/80 border-border/50 shadow-sm'
                    : 'border-transparent bg-muted/30 hover:bg-muted/50',
                )}
              >
                <Icon
                  className={cn('w-6 h-6', active ? 'text-primary' : 'text-muted-foreground')}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span className={cn('text-[11px] font-semibold', active ? 'text-foreground' : 'text-foreground/60')}>
                  {labelAr}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div className="space-y-4 pb-8">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent Projects */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-primary" />
                    آخر المشاريع
                  </h3>
                  <button onClick={() => setActiveTab('projects')} className="text-xs text-primary hover:underline">الكل</button>
                </div>
                {areaProjects.slice(0, 3).map((p: { id: string; title: string; status?: string; color?: string }) => (
                  <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || areaColor }} />
                    <span className="text-sm flex-1 truncate">{p.title}</span>
                    <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[p.status ?? ''])}>
                      {STATUS_LABELS[p.status ?? ''] ?? p.status}
                    </Badge>
                  </div>
                ))}
                {areaProjects.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">لا توجد مشاريع مرتبطة</p>
                )}
                <Button
                  variant="outline" size="sm" className="w-full gap-1.5"
                  onClick={() => navigate(`/projects?area=${id}`)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  مشروع جديد في هذا المجال
                </Button>
              </div>

              {/* Recent Tasks */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    آخر المهام
                  </h3>
                  <button onClick={() => setActiveTab('tasks')} className="text-xs text-primary hover:underline">الكل</button>
                </div>
                {activeTasks.slice(0, 5).map((t: { id: string; title: string; status?: string; priority?: string; due_date?: string | null }) => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/20 transition-colors">
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0',
                      t.priority === 'urgent' ? 'bg-destructive' :
                      t.priority === 'high'   ? 'bg-warning' : 'bg-muted-foreground/40',
                    )} />
                    <span className="text-sm flex-1 truncate">{t.title}</span>
                    {t.due_date && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(t.due_date), 'dd MMM', { locale: ar })}
                      </span>
                    )}
                  </div>
                ))}
                {activeTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">لا توجد مهام نشطة</p>
                )}
              </div>

              {/* Recent Resources */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    الموارد
                  </h3>
                  <button onClick={() => setActiveTab('resources')} className="text-xs text-primary hover:underline">الكل</button>
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
                {(resources ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">لا توجد موارد مرتبطة</p>
                )}
              </div>

              {/* Goals */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    الأهداف
                  </h3>
                  <button onClick={() => setActiveTab('goals')} className="text-xs text-primary hover:underline">الكل</button>
                </div>
                {areaGoals.slice(0, 3).map((g: { id: string; title: string; progress?: number | null; perspective?: string }) => (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1">{g.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{g.progress ?? 0}%</span>
                    </div>
                    <Progress value={g.progress ?? 0} className="h-1.5" />
                  </div>
                ))}
                {areaGoals.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">لا توجد أهداف مرتبطة</p>
                )}
              </div>
            </div>
          )}

          {/* PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{areaProjects.length} مشروع</p>
                <Button
                  variant="gold" size="sm" className="gap-1.5"
                  onClick={() => navigate(`/projects?area=${id}`)}
                >
                  <Plus className="w-3.5 h-3.5" /> مشروع جديد
                </Button>
              </div>
              {areaProjects.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد مشاريع مرتبطة بهذا المجال</p>
                  <p className="text-xs mt-1">أنشئ مشروعاً جديداً أو اربط مشاريع موجودة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {areaProjects.map((p: { id: string; title: string; status?: string; color?: string; description?: string | null; progress?: number | null; updated_at?: string }) => (
                    <div
                      key={p.id}
                      className="glass-card p-4 space-y-3 cursor-pointer hover:shadow-md transition-all"
                      style={{ borderRight: `3px solid ${p.color || areaColor}` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-tight">{p.title}</p>
                        <Badge variant="outline" className={cn('text-xs shrink-0', STATUS_COLORS[p.status ?? ''])}>
                          {STATUS_LABELS[p.status ?? ''] ?? p.status}
                        </Badge>
                      </div>
                      {p.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>التقدم</span>
                          <span>{p.progress ?? 0}%</span>
                        </div>
                        <Progress value={p.progress ?? 0} className="h-1.5" />
                      </div>
                      {p.updated_at && (
                        <p className="text-[10px] text-muted-foreground">
                          آخر تحديث: {format(new Date(p.updated_at), 'dd MMM yyyy', { locale: ar })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{areaTasks.length} مهمة من {areaProjects.length} مشروع</p>
              {areaTasks.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد مهام مرتبطة</p>
                  <p className="text-xs mt-1">المهام تظهر هنا عبر المشاريع المرتبطة بهذا المجال</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {areaTasks.map((t: {
                    id: string; title: string; status?: string; priority?: string;
                    due_date?: string | null; 'projects'?: { title: string } | null
                  }) => {
                    const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !['done', 'completed'].includes(t.status ?? '');
                    return (
                      <div
                        key={t.id}
                        className={cn(
                          'glass-card p-3 flex items-center gap-3 transition-all',
                          isOverdue && 'border-destructive/30 bg-destructive/5',
                        )}
                      >
                        <div className={cn('w-2 h-2 rounded-full shrink-0',
                          t.priority === 'urgent' ? 'bg-destructive' :
                          t.priority === 'high'   ? 'bg-warning' :
                          t.priority === 'medium' ? 'bg-primary' : 'bg-muted-foreground/40',
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          {(t as { projects?: { title: string } | null }).projects?.title && (
                            <p className="text-xs text-muted-foreground truncate">
                              {(t as { projects?: { title: string } | null }).projects?.title}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                          {t.due_date && (
                            <span className={cn('text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                              {format(new Date(t.due_date), 'dd MMM', { locale: ar })}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {STATUS_LABELS[t.status ?? ''] ?? t.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* GOALS */}
          {activeTab === 'goals' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{areaGoals.length} هدف</p>
              {areaGoals.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد أهداف مرتبطة</p>
                  <p className="text-xs mt-1">الأهداف تظهر هنا عبر مشاريع المجال</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {areaGoals.map((g: { id: string; title: string; description?: string | null; progress?: number | null; perspective?: string; target_date?: string | null }) => (
                    <div key={g.id} className="glass-card p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">{g.title}</p>
                        {g.perspective && (
                          <Badge variant="secondary" className="text-xs shrink-0">{g.perspective}</Badge>
                        )}
                      </div>
                      {g.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{g.description}</p>
                      )}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">التقدم</span>
                          <span className="font-semibold text-primary">{g.progress ?? 0}%</span>
                        </div>
                        <Progress value={g.progress ?? 0} className="h-2" />
                      </div>
                      {g.target_date && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(g.target_date), 'dd MMM yyyy', { locale: ar })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RESOURCES */}
          {activeTab === 'resources' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{resources?.length ?? 0} مورد</p>
                <Button
                  variant="gold" size="sm" className="gap-1.5"
                  onClick={() => navigate(`/projects?tab=resources&area=${id}`)}
                >
                  <Plus className="w-3.5 h-3.5" /> مورد جديد
                </Button>
              </div>
              {(resources ?? []).length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد موارد مرتبطة بهذا المجال</p>
                  <p className="text-xs mt-1">أضف ملفات، ملاحظات، روابط أو دورات</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(resources ?? []).map((r) => {
                    const Icon = RESOURCE_ICONS[r.type] ?? File;
                    return (
                      <div key={r.id} className="glass-card p-4 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{r.title}</p>
                            <Badge variant="outline" className="text-xs mt-0.5">{r.type}</Badge>
                          </div>
                        </div>
                        {r.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                        )}
                        {r.source_url && (
                          <a
                            href={r.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            فتح الرابط
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* NOTES */}
          {activeTab === 'notes' && (
            <NotesTab
              notes={areaNotes}
              isLoading={notesLoading}
              linkField="folder"
              linkValue={id ?? ''}
            />
          )}

          {/* ARCHIVE */}
          {activeTab === 'archive' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{areaArchived.length} عنصر مؤرشف</p>
              {areaArchived.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Archive className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد عناصر مؤرشفة في هذا المجال</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {areaArchived.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="glass-card p-3 flex items-center gap-3 opacity-70">
                      <Archive className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.archived_at), 'dd MMM yyyy', { locale: ar })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{item.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2">
                <Button
                  variant="outline" size="sm" className="gap-1.5"
                  onClick={() => navigate('/archive')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  الأرشيف الكامل
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
