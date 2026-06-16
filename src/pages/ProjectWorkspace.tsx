import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProjects, useUpdateProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowRight, FolderKanban, Pencil, Check, X,
  ListTodo, Target, Database, Users, TrendingUp,
  LayoutGrid, Eye, StickyNote, Archive, Play, Pause,
  CheckCircle, Calendar, Share2, Loader2, Network,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

import { ProjectTasksTab }    from '@/components/projects/ProjectTasksTab';
import { ProjectGoalsTab }    from '@/components/projects/ProjectGoalsTab';
import { ProjectResourcesTab } from '@/components/projects/ProjectResourcesTab';
import { ProjectCRMTab }      from '@/components/projects/ProjectCRMTab';
import { ProjectOkrsView }    from '@/components/projects/ProjectOkrsView';
import { KanbanBoard }        from '@/components/projects/KanbanBoard';
import { ProjectNotesTab }    from '@/components/projects/ProjectNotesTab';
import { ShareDialog }        from '@/components/ui/ShareDialog';
import { useEntityRelations } from '@/hooks/useEntityRelations';
import { RelationGraph }      from '@/components/graph/RelationGraph';
import { RelationEditor }     from '@/components/graph/RelationEditor';

type WorkspaceTab = 'overview' | 'tasks' | 'kanban' | 'goals' | 'resources' | 'crm' | 'okrs' | 'notes' | 'graph';

const PHASE_STEPS = ['initiation', 'planning', 'execution', 'monitoring', 'closing'] as const;
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  on_hold: 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-muted text-muted-foreground border-border',
  archived: 'bg-muted text-muted-foreground border-border',
};
const STATUS_ICONS: Record<string, typeof Play> = {
  active: Play, on_hold: Pause, completed: CheckCircle, archived: Archive,
};

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const TABS: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
    { id: 'overview',   label: isAr ? 'نظرة عامة' : 'Overview',   icon: Eye },
    { id: 'tasks',      label: isAr ? 'مهام'       : 'Tasks',      icon: ListTodo },
    { id: 'kanban',     label: isAr ? 'كانبان'     : 'Kanban',     icon: LayoutGrid },
    { id: 'goals',      label: isAr ? 'أهداف'      : 'Goals',      icon: Target },
    { id: 'resources',  label: isAr ? 'موارد'      : 'Resources',  icon: Database },
    { id: 'crm',        label: 'CRM',                               icon: Users },
    { id: 'okrs',       label: 'OKRs',                              icon: TrendingUp },
    { id: 'notes',      label: isAr ? 'ملاحظات'    : 'Notes',      icon: StickyNote },
    { id: 'graph',      label: isAr ? 'العلاقات'   : 'Relations',  icon: Network },
  ];

  const PHASE_LABELS: Record<string, string> = isAr
    ? { initiation: 'تأسيس', planning: 'تخطيط', execution: 'تنفيذ', monitoring: 'مراقبة', closing: 'إغلاق' }
    : { initiation: 'Initiation', planning: 'Planning', execution: 'Execution', monitoring: 'Monitoring', closing: 'Closing' };

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [shareOpen,    setShareOpen]    = useState(false);
  const [relationOpen, setRelationOpen] = useState(false);

  const { data: projects } = useProjects();
  const { data: allTasks } = useTasks();
  const { data: relations = [] } = useEntityRelations(id ?? '');
  const updateProject = useUpdateProject();

  const project = projects?.find(p => p.id === id);
  const projectColor = project?.color || '#2563EB';
  const projectTasks = allTasks?.filter(t => t.project_id === id) ?? [];
  const completedTasks = projectTasks.filter(t => t.status === 'done').length;
  const currentPhaseIndex = PHASE_STEPS.indexOf((project?.phase as typeof PHASE_STEPS[number]) ?? 'initiation');
  const StatusIcon = STATUS_ICONS[project?.status ?? 'active'] ?? Play;

  if (!project && projects) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <FolderKanban className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{isAr ? 'المشروع غير موجود' : 'Project not found'}</p>
          <Button variant="outline" onClick={() => navigate('/projects')}>{isAr ? 'العودة للمشاريع' : 'Back to Projects'}</Button>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) return;
    try {
      await updateProject.mutateAsync({ id: project.id, title: editTitle.trim() });
      setIsEditingTitle(false);
      toast.success(isAr ? 'تم تحديث اسم المشروع' : 'Project name updated');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error occurred'); }
  };

  const handleSaveDesc = async () => {
    try {
      await updateProject.mutateAsync({ id: project.id, description: editDesc });
      setIsEditingDesc(false);
      toast.success(isAr ? 'تم تحديث الوصف' : 'Description updated');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error occurred'); }
  };

  const handlePhaseChange = async (phase: string) => {
    try {
      await updateProject.mutateAsync({
        id: project.id,
        phase: phase as 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing',
        status: phase === 'closing' ? 'completed' : project.status,
      });
      toast.success(isAr ? 'تم تحديث المرحلة' : 'Phase updated');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error occurred'); }
  };

  const handleArchive = async () => {
    try {
      await updateProject.mutateAsync({ id: project.id, status: 'archived', para_category: 'archive' });
      toast.success(isAr ? 'تم نقل المشروع للأرشيف' : 'Project archived');
      navigate('/projects');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error occurred'); }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate('/projects')} className="hover:text-foreground transition-colors">
            {isAr ? 'المشاريع' : 'Projects'}
          </button>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[220px]">{project.title}</span>
        </div>

        {/* ── Project Header ── */}
        <div
          className="glass-card p-5 relative overflow-hidden"
          style={{ borderTop: `3px solid ${projectColor}` }}
        >
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ background: `radial-gradient(60% 60% at 80% 20%, ${projectColor}, transparent)` }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${projectColor}20` }}
              >
                <FolderKanban className="w-6 h-6" style={{ color: projectColor }} />
              </div>
              <div className="min-w-0 flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                      className="h-8 text-lg font-bold bg-muted/50"
                      dir="auto" autoFocus
                    />
                    <button onClick={handleSaveTitle} className="text-success"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditingTitle(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditTitle(project.title); setIsEditingTitle(true); }}
                    className="group flex items-center gap-2 text-start"
                  >
                    <h1 className="text-xl font-bold text-foreground leading-tight">{project.title}</h1>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity shrink-0" />
                  </button>
                )}

                {/* Status + Phase badges */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1', STATUS_COLORS[project.status ?? 'active'])}>
                    <StatusIcon className="w-3 h-3" />
                    {project.status ?? 'active'}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {PHASE_LABELS[project.phase ?? 'initiation']}
                  </Badge>
                  {project.due_date && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(project.due_date), 'dd MMM yyyy', { locale: ar })}
                    </span>
                  )}
                </div>

                {/* Description */}
                {isEditingDesc ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2} className="text-sm bg-muted/50 resize-none" dir="auto" autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDesc}>{isAr ? 'حفظ' : 'Save'}</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditDesc(project.description ?? ''); setIsEditingDesc(true); }}
                    className="group flex items-start gap-1.5 mt-1.5 text-start w-full"
                  >
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description || (isAr ? 'أضف وصفاً للمشروع...' : 'Add a project description...')}
                    </p>
                    <Pencil className="w-3 h-3 mt-0.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 shrink-0 transition-opacity" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'مشاركة' : 'Share'}</span>
              </Button>
              {project.status !== 'archived' && (
                <Button variant="outline" size="sm" onClick={handleArchive} className="gap-1.5">
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'أرشفة' : 'Archive'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress + KPI strip */}
          <div className="relative mt-4 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{isAr ? 'التقدم الكلي' : 'Overall Progress'}</span>
                <span className="font-semibold text-primary">{project.progress ?? 0}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${project.progress ?? 0}%`, backgroundColor: projectColor }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: isAr ? 'المهام' : 'Tasks', value: projectTasks.length, sub: isAr ? `${completedTasks} مكتملة` : `${completedTasks} done`, color: 'text-primary' },
                { label: isAr ? 'التقدم' : 'Progress', value: `${project.progress ?? 0}%`, sub: isAr ? 'نسبة الإنجاز' : 'Completion rate', color: 'text-success' },
                { label: isAr ? 'الموعد' : 'Due', value: project.due_date ? format(new Date(project.due_date), 'dd MMM', { locale: ar }) : '—', sub: isAr ? 'تاريخ التسليم' : 'Delivery date', color: 'text-amber-500' },
              ].map((kpi) => (
                <div key={kpi.label} className="text-center p-2.5 rounded-xl bg-background/40">
                  <p className={cn('text-lg font-bold', kpi.color)}>{kpi.value}</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{kpi.label}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Phase Stepper ── */}
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-3 font-medium">{isAr ? 'مراحل المشروع (PMBOK)' : 'Project Phases (PMBOK)'}</p>
          <div className="flex items-center gap-1.5">
            {PHASE_STEPS.map((phase, index) => (
              <div key={phase} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => handlePhaseChange(phase)}
                  className={cn(
                    'flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all text-center truncate',
                    index <= currentPhaseIndex
                      ? 'text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                  style={index <= currentPhaseIndex ? { backgroundColor: projectColor } : {}}
                >
                  {PHASE_LABELS[phase]}
                </button>
                {index < PHASE_STEPS.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground mx-0.5 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Selector ── */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {TABS.map(({ id: tabId, label, icon: Icon }) => {
            const active = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl border transition-all duration-200 active:scale-95',
                  active
                    ? 'bg-card/80 border-border/50 shadow-sm'
                    : 'border-transparent bg-muted/30 hover:bg-muted/50',
                )}
              >
                <Icon
                  className={cn('w-5 h-5', active ? 'text-primary' : 'text-muted-foreground')}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span className={cn('text-[10px] font-semibold leading-none', active ? 'text-foreground' : 'text-foreground/60')}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div className="pb-8">

          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Description card */}
              <div className="glass-card p-4">
                <h3 className="font-semibold text-sm mb-2">{isAr ? 'الوصف' : 'Description'}</h3>
                {project.description ? (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                ) : (
                  <button
                    onClick={() => { setEditDesc(''); setIsEditingDesc(true); }}
                    className="text-sm text-muted-foreground/60 hover:text-muted-foreground italic"
                  >
                    {isAr ? 'أضف وصفاً للمشروع...' : 'Add a project description...'}
                  </button>
                )}
              </div>

              {/* Recent tasks preview */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-primary" />
                    {isAr ? 'آخر المهام' : 'Recent Tasks'}
                  </h3>
                  <button onClick={() => setActiveTab('tasks')} className="text-xs text-primary hover:underline">{isAr ? 'الكل' : 'All'}</button>
                </div>
                {projectTasks.slice(0, 5).map((t) => {
                  const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !['done', 'completed'].includes(t.status ?? '');
                  return (
                    <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/20 transition-colors">
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0',
                        t.priority === 'urgent' ? 'bg-destructive' :
                        t.priority === 'high' ? 'bg-warning' : 'bg-muted-foreground/40',
                      )} />
                      <span className="text-sm flex-1 truncate">{t.title}</span>
                      {t.due_date && (
                        <span className={cn('text-[10px] shrink-0', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                          {format(new Date(t.due_date), 'dd MMM', { locale: ar })}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs shrink-0">{t.status}</Badge>
                    </div>
                  );
                })}
                {projectTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">{isAr ? 'لا توجد مهام لهذا المشروع' : 'No tasks for this project'}</p>
                )}
              </div>

              {/* Archive CTA */}
              {project.status !== 'archived' && (
                <Button variant="outline" className="w-full gap-2" onClick={handleArchive}>
                  <Archive className="w-4 h-4" />
                  {isAr ? 'نقل المشروع للأرشيف' : 'Archive Project'}
                </Button>
              )}
            </div>
          )}

          {activeTab === 'tasks' && <ProjectTasksTab projectId={project.id} />}
          {activeTab === 'kanban' && <KanbanBoard projectId={project.id} tasks={projectTasks} />}
          {activeTab === 'goals' && <ProjectGoalsTab projectId={project.id} />}
          {activeTab === 'resources' && <ProjectResourcesTab projectId={project.id} />}
          {activeTab === 'crm' && <ProjectCRMTab projectId={project.id} />}
          {activeTab === 'okrs' && <ProjectOkrsView projectId={project.id} />}
          {activeTab === 'notes' && <ProjectNotesTab projectId={project.id} />}

          {activeTab === 'graph' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{isAr ? 'خريطة العلاقات' : 'Relations Map'}</p>
                  <p className="text-xs text-muted-foreground">{relations.length} {isAr ? 'علاقة مرتبطة بهذا المشروع' : 'relations linked to this project'}</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRelationOpen(true)}>
                  <Network className="w-3.5 h-3.5" />
                  {isAr ? 'إدارة العلاقات' : 'Manage Relations'}
                </Button>
              </div>
              <RelationGraph
                entityId={project.id}
                entityType="project"
                entityLabel={project.title}
                relations={relations}
                height={420}
                onAddRelation={() => setRelationOpen(true)}
              />
              <RelationEditor
                open={relationOpen}
                onOpenChange={setRelationOpen}
                entityId={project.id}
                entityType="project"
                entityLabel={project.title}
                relations={relations}
                isAr
              />
            </div>
          )}

        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectId={project.id}
        projectName={project.title}
      />
    </MainLayout>
  );
}
