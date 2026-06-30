import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/hooks/useLanguage';
import { useMediaItems, useUpdateMediaItem } from '@/hooks/useMedia';
import { useGoals } from '@/hooks/useGoals';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowRight, Pencil, Check, X, Star, BookOpen, Film, Tv, Headphones,
  FileText, Target, FolderKanban, Loader2, Calendar, Activity,
} from 'lucide-react';

function getTypeConfig(isAr: boolean): Record<string, { label: string; icon: typeof BookOpen; color: string }> {
  return {
    book:    { label: isAr ? 'كتاب'    : 'Book',     icon: BookOpen,   color: 'text-amber-500' },
    movie:   { label: isAr ? 'فيلم'    : 'Movie',    icon: Film,       color: 'text-blue-500' },
    series:  { label: isAr ? 'مسلسل'   : 'Series',   icon: Tv,         color: 'text-purple-500' },
    podcast: { label: isAr ? 'بودكاست' : 'Podcast',  icon: Headphones, color: 'text-green-500' },
    article: { label: isAr ? 'مقال'    : 'Article',  icon: FileText,   color: 'text-primary' },
  };
}

function getStatusConfig(isAr: boolean): Record<string, { label: string; color: string }> {
  return {
    want:        { label: isAr ? 'أريد'   : 'Want to',       color: 'text-muted-foreground' },
    in_progress: { label: isAr ? 'جارٍ'   : 'In Progress',   color: 'text-primary' },
    completed:   { label: isAr ? 'مكتمل'  : 'Completed',     color: 'text-success' },
    abandoned:   { label: isAr ? 'متوقف'  : 'Abandoned',     color: 'text-destructive' },
  };
}

export default function MediaItemWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const TYPE_CONFIG = getTypeConfig(isAr);
  const STATUS_CONFIG = getStatusConfig(isAr);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const { data: items } = useMediaItems();
  const { data: goals } = useGoals();
  const { data: projects } = useProjects();
  const updateItem = useUpdateMediaItem();

  const item = items?.find(m => m.id === id);
  const linkedGoal = goals?.find(g => g.id === item?.goal_id);
  const linkedProject = projects?.find(p => p.id === item?.project_id);

  const typeConf = TYPE_CONFIG[item?.type ?? 'book'] ?? TYPE_CONFIG.book;
  const statusConf = STATUS_CONFIG[item?.status ?? 'want'] ?? STATUS_CONFIG.want;
  const TypeIcon = typeConf.icon;

  const readProgress = item?.progress && item?.total_pages
    ? Math.round((item.progress / item.total_pages) * 100)
    : item?.progress ?? 0;

  if (!item && items) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <BookOpen className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{isAr ? 'العنصر غير موجود' : 'Item not found'}</p>
          <Button variant="outline" onClick={() => navigate('/studio')}>{isAr ? 'العودة للاستديو' : 'Back to Studio'}</Button>
        </div>
      </MainLayout>
    );
  }

  if (!item) return <MainLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></MainLayout>;

  const handleSaveNotes = async () => {
    try { await updateItem.mutateAsync({ id: item.id, notes: editNotes }); setIsEditingNotes(false); toast.success(isAr ? 'تم حفظ الملاحظات' : 'Notes saved'); }
    catch { toast.error(isAr ? 'حدث خطأ' : 'Error occurred'); }
  };

  const handleStatusChange = async (status: string) => {
    try { await updateItem.mutateAsync({ id: item.id, status: status as 'want' | 'in_progress' | 'completed' | 'abandoned' }); toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated'); }
    catch { toast.error(isAr ? 'حدث خطأ' : 'Error occurred'); }
  };

  const handleProgressChange = async (val: number) => {
    try { await updateItem.mutateAsync({ id: item.id, progress: val }); }
    catch { toast.error('حدث خطأ'); }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate('/studio')} className="hover:text-foreground transition-colors">{isAr ? 'الاستديو' : 'Studio'}</button>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[220px]">{item.title}</span>
        </div>

        {/* Header card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-20 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border">
              {item.cover_url ? (
                <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <TypeIcon className={cn('w-7 h-7', typeConf.color)} />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <h1 className="text-lg font-bold text-foreground leading-snug">{item.title}</h1>
              {item.author && <p className="text-sm text-muted-foreground">{item.author}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn('text-xs', typeConf.color)}>{typeConf.label}</Badge>
                <Badge variant="outline" className={cn('text-xs', statusConf.color)}>{statusConf.label}</Badge>
                {item.genre && <Badge variant="secondary" className="text-xs">{item.genre}</Badge>}
              </div>
              {/* Rating */}
              {item.rating !== null && item.rating !== undefined && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn('w-4 h-4', i < (item.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {(item.total_pages || item.progress) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{isAr ? 'التقدم' : 'Progress'}</span>
                <span className="font-medium">{item.progress ?? 0} {item.total_pages ? `/ ${item.total_pages} ${isAr ? 'صفحة' : 'pages'}` : '%'}</span>
              </div>
              <Progress value={readProgress} className="h-2" />
            </div>
          )}

          {/* Dates */}
          {(item.start_date || item.end_date) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {item.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{isAr ? 'بدأ:' : 'Started:'} {format(new Date(item.start_date), 'dd MMM yyyy', { locale: ar })}</span>}
              {item.end_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{isAr ? 'انتهى:' : 'Ended:'} {format(new Date(item.end_date), 'dd MMM yyyy', { locale: ar })}</span>}
            </div>
          )}

          {/* Status switcher */}
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  item.status === key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50',
                )}
              >
                {conf.label}
              </button>
            ))}
          </div>

          {/* Progress quick-update for books */}
          {item.type === 'book' && item.total_pages && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">{isAr ? 'الصفحة:' : 'Page:'}</span>
              <input
                type="number" min={0} max={item.total_pages}
                defaultValue={item.progress ?? 0}
                className="h-8 px-2 text-sm border rounded-lg bg-muted/30 w-20"
                onBlur={e => { const v = parseInt(e.target.value); if (!isNaN(v)) handleProgressChange(v); }}
              />
              <span className="text-xs text-muted-foreground">/ {item.total_pages}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> {isAr ? 'ملاحظات' : 'Notes'}
            </h3>
            {!isEditingNotes && (
              <button onClick={() => { setEditNotes(item.notes ?? ''); setIsEditingNotes(true); }} className="text-muted-foreground hover:text-primary transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={5} dir="auto" className="text-sm bg-muted/50 resize-none" placeholder={isAr ? 'أضف ملاحظاتك...' : 'Add your notes...'} autoFocus />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNotes}><Check className="w-3.5 h-3.5 me-1.5" />{isAr ? 'حفظ' : 'Save'}</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(false)}><X className="w-3.5 h-3.5 me-1.5" />{isAr ? 'إلغاء' : 'Cancel'}</Button>
              </div>
            </div>
          ) : (
            <div>
              {item.notes ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.notes}</p>
              ) : (
                <button onClick={() => { setEditNotes(''); setIsEditingNotes(true); }} className="text-sm text-muted-foreground/60 hover:text-muted-foreground italic">
                  {isAr ? `أضف ملاحظاتك حول هذا ${typeConf.label}...` : `Add your notes about this ${typeConf.label}...`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Connections */}
        {(linkedGoal || linkedProject) && (
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold text-sm">{isAr ? 'الارتباطات' : 'Connections'}</h3>
            {linkedGoal && (
              <button onClick={() => navigate(`/goals/${linkedGoal.id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start">
                <Target className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">{linkedGoal.title}</span>
                <Badge variant="outline" className="text-xs shrink-0">{isAr ? 'هدف' : 'Goal'}</Badge>
              </button>
            )}
            {linkedProject && (
              <button onClick={() => navigate(`/projects/${linkedProject.id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start">
                <FolderKanban className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">{linkedProject.title}</span>
                <Badge variant="outline" className="text-xs shrink-0">{isAr ? 'مشروع' : 'Project'}</Badge>
              </button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
