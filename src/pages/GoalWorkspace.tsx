import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  useGoals, useUpdateGoal, useArchiveGoal,
  useKeyResults, useUpdateKeyResult, useCreateKeyResult, useDeleteKeyResult,
} from '@/hooks/useGoals';
import { useHabits } from '@/hooks/useHabits';
import { useGoalNotes } from '@/hooks/useKnowledge';
import { useEntityRelations } from '@/hooks/useEntityRelations';
import { RelationGraph } from '@/components/graph/RelationGraph';
import { RelationEditor } from '@/components/graph/RelationEditor';
import { NotesTab } from '@/components/notes/NotesTab';
import { BackButton } from '@/components/ui/BackButton';
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
  Target, Pencil, Check, X, Archive, Plus, Trash2,
  Network, Flame, Calendar, TrendingUp, Activity, RotateCcw,
  Loader2, User, Users, Cog, GraduationCap, StickyNote,
} from 'lucide-react';

type Tab = 'overview' | 'keyresults' | 'notes' | 'connections';

const TABS = [
  { id: 'overview' as Tab,     labelAr: 'نظرة عامة',       icon: Activity },
  { id: 'keyresults' as Tab,   labelAr: 'النتائج الرئيسية', icon: TrendingUp },
  { id: 'notes' as Tab,        labelAr: 'ملاحظات',          icon: StickyNote },
  { id: 'connections' as Tab,  labelAr: 'خريطة العلاقات',  icon: Network },
];

const PERSPECTIVE_CONFIG: Record<string, { label: string; color: string; icon: typeof User }> = {
  personal:  { label: 'شخصي',   color: 'text-primary',     icon: User },
  financial: { label: 'مالي',   color: 'text-success',     icon: TrendingUp },
  customer:  { label: 'عملاء',  color: 'text-blue-500',    icon: Users },
  processes: { label: 'عمليات', color: 'text-amber-500',   icon: Cog },
  learning:  { label: 'تعلم',   color: 'text-purple-500',  icon: GraduationCap },
};

export default function GoalWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [newKrTitle, setNewKrTitle] = useState('');
  const [newKrTarget, setNewKrTarget] = useState('');
  const [newKrUnit, setNewKrUnit] = useState('');
  const [addingKr,     setAddingKr]     = useState(false);
  const [relationOpen, setRelationOpen] = useState(false);

  const { data: goals } = useGoals(true);
  const { data: allKrs } = useKeyResults();
  const { data: habits } = useHabits();
  const { data: goalNotes = [], isLoading: notesLoading } = useGoalNotes(id ?? null);
  const { data: relations = [] } = useEntityRelations(id ?? '');
  const updateGoal = useUpdateGoal();
  const archiveGoal = useArchiveGoal();
  const updateKr = useUpdateKeyResult();
  const createKr = useCreateKeyResult();
  const deleteKr = useDeleteKeyResult();

  const goal = goals?.find(g => g.id === id);
  const krs = useMemo(() => (allKrs ?? []).filter(k => k.goal_id === id), [allKrs, id]);
  const linkedHabit = habits?.find(h => h.id === goal?.habit_id);

  const progress = useMemo(() => {
    if (krs.length > 0) {
      return Math.round(
        krs.reduce((sum, kr) => sum + ((kr.current_value ?? 0) / (kr.target_value || 1)) * 100, 0) / krs.length,
      );
    }
    if (goal?.target_value && goal.target_value > 0) {
      return Math.round(((goal.current_value ?? 0) / goal.target_value) * 100);
    }
    return 0;
  }, [krs, goal]);

  const perspectiveConf = PERSPECTIVE_CONFIG[goal?.perspective ?? 'personal'] ?? PERSPECTIVE_CONFIG.personal;
  const PerspIcon = perspectiveConf.icon;

  if (!goal && goals) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Target className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">الهدف غير موجود</p>
          <Button variant="outline" onClick={() => navigate('/goals')}>العودة للأهداف</Button>
        </div>
      </MainLayout>
    );
  }

  if (!goal) {
    return <MainLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></MainLayout>;
  }

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) return;
    try { await updateGoal.mutateAsync({ id: goal.id, title: editTitle.trim() }); setIsEditingTitle(false); toast.success('تم التحديث'); }
    catch { toast.error('حدث خطأ'); }
  };
  const handleSaveDesc = async () => {
    try { await updateGoal.mutateAsync({ id: goal.id, description: editDesc }); setIsEditingDesc(false); toast.success('تم التحديث'); }
    catch { toast.error('حدث خطأ'); }
  };
  const handleArchive = async () => {
    try { await archiveGoal.mutateAsync(goal.id); toast.success('تم أرشفة الهدف'); navigate('/goals'); }
    catch { toast.error('حدث خطأ'); }
  };
  const handleUpdateKr = async (krId: string, newValue: number) => {
    try { await updateKr.mutateAsync({ id: krId, current_value: newValue }); }
    catch { toast.error('حدث خطأ'); }
  };
  const handleAddKr = async () => {
    if (!newKrTitle.trim() || !newKrTarget) return;
    try {
      await createKr.mutateAsync({ goal_id: goal.id, title: newKrTitle.trim(), target_value: parseFloat(newKrTarget), unit: newKrUnit || null });
      setNewKrTitle(''); setNewKrTarget(''); setNewKrUnit(''); setAddingKr(false);
      toast.success('تم إضافة النتيجة');
    } catch { toast.error('حدث خطأ'); }
  };
  const handleDeleteKr = async (krId: string) => {
    try { await deleteKr.mutateAsync(krId); }
    catch { toast.error('حدث خطأ'); }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Back + breadcrumb */}
        <div className="flex items-center gap-3">
          <BackButton to="/goals" label="الأهداف" />
          <span className="text-muted-foreground/40 text-sm">/</span>
          <span className="text-sm font-medium text-foreground truncate max-w-[220px]">{goal.title}</span>
        </div>

        {/* Header */}
        <div className="glass-card p-5 relative overflow-hidden" style={{ borderTop: `3px solid hsl(var(--primary))` }}>
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(60% 60% at 80% 20%, hsl(var(--primary)), transparent)' }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveTitle()} className="h-8 text-lg font-bold bg-muted/50" dir="auto" autoFocus />
                    <button onClick={handleSaveTitle} className="text-success"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditingTitle(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => { setEditTitle(goal.title); setIsEditingTitle(true); }} className="group flex items-center gap-2 text-start">
                    <h1 className="text-xl font-bold text-foreground">{goal.title}</h1>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity shrink-0" />
                  </button>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={cn('flex items-center gap-1 text-xs font-medium', perspectiveConf.color)}>
                    <PerspIcon className="w-3 h-3" />
                    {perspectiveConf.label}
                  </span>
                  {goal.end_date && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(goal.end_date), 'dd MMM yyyy', { locale: ar })}
                    </span>
                  )}
                  {!goal.is_active && <Badge variant="secondary">مؤرشف</Badge>}
                </div>
                {isEditingDesc ? (
                  <div className="mt-2 space-y-2">
                    <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} className="text-sm bg-muted/50 resize-none" dir="auto" autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDesc}>حفظ</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)}>إلغاء</Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setEditDesc(goal.description ?? ''); setIsEditingDesc(true); }} className="group flex items-start gap-1.5 mt-1.5 text-start w-full">
                    <p className="text-sm text-muted-foreground line-clamp-2">{goal.description || 'أضف وصفاً للهدف...'}</p>
                    <Pencil className="w-3 h-3 mt-0.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 shrink-0 transition-opacity" />
                  </button>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {goal.is_active ? (
                <Button variant="outline" size="sm" onClick={handleArchive} className="gap-1.5">
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">أرشفة</span>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => updateGoal.mutateAsync({ id: goal.id, is_active: true }).then(() => toast.success('تم الاستعادة'))} className="gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">استعادة</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="relative mt-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">التقدم الكلي</span>
              <span className={cn('font-bold', progress >= 80 ? 'text-success' : progress >= 50 ? 'text-primary' : 'text-destructive')}>
                {progress}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-700', progress >= 80 ? 'bg-success' : progress >= 50 ? 'bg-primary' : 'bg-destructive')} style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            {goal.target_value && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>الحالي: {goal.current_value ?? 0} {goal.unit ?? ''}</span>
                <span>الهدف: {goal.target_value} {goal.unit ?? ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {TABS.map(({ id: tabId, labelAr, icon: Icon }) => {
            const active = activeTab === tabId;
            return (
              <button key={tabId} onClick={() => setActiveTab(tabId)}
                className={cn('flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all active:scale-95',
                  active ? 'bg-card/80 border-border/50 shadow-sm' : 'border-transparent bg-muted/30 hover:bg-muted/50')}>
                <Icon className={cn('w-5 h-5', active ? 'text-primary' : 'text-muted-foreground')} strokeWidth={active ? 2 : 1.75} />
                <span className={cn('text-xs font-semibold', active ? 'text-foreground' : 'text-foreground/60')}>{labelAr}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="pb-8">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'التقدم', value: `${progress}%`, color: progress >= 80 ? 'text-success' : 'text-primary' },
                  { label: 'النتائج', value: krs.length, color: 'text-blue-500' },
                  { label: 'نتائج مكتملة', value: krs.filter(k => (k.current_value ?? 0) >= k.target_value).length, color: 'text-success' },
                ].map(s => (
                  <div key={s.label} className="glass-card p-4 text-center">
                    <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Top KRs preview */}
              {krs.length > 0 && (
                <div className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">النتائج الرئيسية</h3>
                    <button onClick={() => setActiveTab('keyresults')} className="text-xs text-primary hover:underline">الكل</button>
                  </div>
                  {krs.slice(0, 3).map(kr => {
                    const pct = Math.min(100, Math.round(((kr.current_value ?? 0) / (kr.target_value || 1)) * 100));
                    return (
                      <div key={kr.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate">{kr.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">{kr.current_value ?? 0} / {kr.target_value} {kr.unit ?? ''}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Connections preview */}
              {((goal as { projects?: { title: string } | null }).projects || linkedHabit) && (
                <div className="glass-card p-4 space-y-2">
                  <h3 className="font-semibold text-sm">الارتباطات</h3>
                  {(goal as { projects?: { title: string; color?: string | null } | null }).projects && (
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30">
                      <FolderKanban className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm">{(goal as { projects?: { title: string } | null }).projects?.title}</span>
                      <Badge variant="outline" className="text-xs ms-auto">مشروع</Badge>
                    </div>
                  )}
                  {linkedHabit && (
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30">
                      <Flame className="w-4 h-4 text-warning shrink-0" />
                      <span className="text-sm">{linkedHabit.name}</span>
                      <Badge variant="outline" className="text-xs ms-auto">عادة</Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* KEY RESULTS */}
          {activeTab === 'keyresults' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{krs.length} نتيجة رئيسية</p>
                <Button variant="gold" size="sm" onClick={() => setAddingKr(true)} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> إضافة نتيجة
                </Button>
              </div>

              {addingKr && (
                <div className="glass-card p-4 space-y-3">
                  <h3 className="font-semibold text-sm">نتيجة رئيسية جديدة</h3>
                  <Input placeholder="عنوان النتيجة..." value={newKrTitle} onChange={e => setNewKrTitle(e.target.value)} dir="auto" />
                  <div className="flex gap-2">
                    <Input placeholder="القيمة المستهدفة" type="number" value={newKrTarget} onChange={e => setNewKrTarget(e.target.value)} className="flex-1" />
                    <Input placeholder="الوحدة (اختياري)" value={newKrUnit} onChange={e => setNewKrUnit(e.target.value)} className="flex-1" dir="auto" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddKr} disabled={createKr.isPending}>حفظ</Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingKr(false)}>إلغاء</Button>
                  </div>
                </div>
              )}

              {krs.map(kr => {
                const pct = Math.min(100, Math.round(((kr.current_value ?? 0) / (kr.target_value || 1)) * 100));
                const done = (kr.current_value ?? 0) >= kr.target_value;
                return (
                  <div key={kr.id} className={cn('glass-card p-4 space-y-3', done && 'border-success/30 bg-success/5')}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {done && <Check className="w-4 h-4 text-success shrink-0" />}
                        <p className="font-medium text-sm truncate">{kr.title}</p>
                      </div>
                      <button onClick={() => handleDeleteKr(kr.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <Progress value={pct} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{pct}%</span>
                        <span>{kr.current_value ?? 0} / {kr.target_value} {kr.unit ?? ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue={kr.current_value ?? 0}
                        className="h-8 text-sm"
                        onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v !== (kr.current_value ?? 0)) handleUpdateKr(kr.id, v); }}
                        onKeyDown={e => { if (e.key === 'Enter') { const v = parseFloat((e.target as HTMLInputElement).value); if (!isNaN(v)) handleUpdateKr(kr.id, v); } }}
                      />
                      <span className="text-xs text-muted-foreground shrink-0">من {kr.target_value} {kr.unit ?? ''}</span>
                    </div>
                  </div>
                );
              })}
              {krs.length === 0 && !addingKr && (
                <div className="text-center py-16 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد نتائج رئيسية</p>
                  <p className="text-xs mt-1">أضف نتائج قابلة للقياس لتتبع تقدمك</p>
                </div>
              )}
            </div>
          )}

          {/* NOTES */}
          {activeTab === 'notes' && id && (
            <NotesTab
              notes={goalNotes}
              isLoading={notesLoading}
              linkField="goal_id"
              linkValue={id}
            />
          )}

          {/* CONNECTIONS */}
          {activeTab === 'connections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">خريطة العلاقات</p>
                  <p className="text-xs text-muted-foreground">{relations.length} علاقة مرتبطة بهذا الهدف</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRelationOpen(true)}>
                  <Network className="w-3.5 h-3.5" />
                  إدارة العلاقات
                </Button>
              </div>

              <RelationGraph
                entityId={id}
                entityType="goal"
                entityLabel={goal.title}
                relations={relations}
                height={380}
                onAddRelation={() => setRelationOpen(true)}
              />

              {/* Legacy static links (quick nav) */}
              {(goal as { projects?: { id: string; title: string; color?: string | null } | null }).projects && (
                <div className="glass-card p-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">مشروع مرتبط (قاعدة البيانات)</p>
                  <button onClick={() => navigate(`/projects/${goal.project_id}`)} className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${(goal as { projects?: { color?: string | null } | null }).projects?.color || '#2563EB'}20` }}>
                      <Network className="w-3.5 h-3.5" style={{ color: (goal as { projects?: { color?: string | null } | null }).projects?.color || '#2563EB' }} />
                    </div>
                    <span className="font-medium text-sm">{(goal as { projects?: { title: string } | null }).projects?.title}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ms-auto" />
                  </button>
                </div>
              )}

              {id && goal && (
                <RelationEditor
                  open={relationOpen}
                  onOpenChange={setRelationOpen}
                  entityId={id}
                  entityType="goal"
                  entityLabel={goal.title}
                  relations={relations}
                  isAr
                />
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
