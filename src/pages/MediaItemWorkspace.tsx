import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
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

const TYPE_CONFIG: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  book:     { label: 'كتاب',     icon: BookOpen,   color: 'text-amber-500' },
  movie:    { label: 'فيلم',     icon: Film,       color: 'text-blue-500' },
  series:   { label: 'مسلسل',    icon: Tv,         color: 'text-purple-500' },
  podcast:  { label: 'بودكاست',  icon: Headphones, color: 'text-green-500' },
  article:  { label: 'مقال',     icon: FileText,   color: 'text-primary' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  want:        { label: 'أريد',        color: 'text-muted-foreground' },
  in_progress: { label: 'جارٍ',        color: 'text-primary' },
  completed:   { label: 'مكتمل',       color: 'text-success' },
  abandoned:   { label: 'متوقف',       color: 'text-destructive' },
};

export default function MediaItemWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
          <p className="text-muted-foreground">العنصر غير موجود</p>
          <Button variant="outline" onClick={() => navigate('/studio')}>العودة للاستديو</Button>
        </div>
      </MainLayout>
    );
  }

  if (!item) return <MainLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></MainLayout>;

  const handleSaveNotes = async () => {
    try { await updateItem.mutateAsync({ id: item.id, notes: editNotes }); setIsEditingNotes(false); toast.success('تم حفظ الملاحظات'); }
    catch { toast.error('حدث خطأ'); }
  };

  const handleStatusChange = async (status: string) => {
    try { await updateItem.mutateAsync({ id: item.id, status: status as 'want' | 'in_progress' | 'completed' | 'abandoned' }); toast.success('تم تحديث الحالة'); }
    catch { toast.error('حدث خطأ'); }
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
          <button onClick={() => navigate('/studio')} className="hover:text-foreground transition-colors">الاستديو</button>
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
                <span className="text-muted-foreground">التقدم</span>
                <span className="font-medium">{item.progress ?? 0} {item.total_pages ? `/ ${item.total_pages} صفحة` : '%'}</span>
              </div>
              <Progress value={readProgress} className="h-2" />
            </div>
          )}

          {/* Dates */}
          {(item.start_date || item.end_date) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {item.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />بدأ: {format(new Date(item.start_date), 'dd MMM yyyy', { locale: ar })}</span>}
              {item.end_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />انتهى: {format(new Date(item.end_date), 'dd MMM yyyy', { locale: ar })}</span>}
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
              <span className="text-xs text-muted-foreground shrink-0">الصفحة:</span>
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
              <Activity className="w-4 h-4 text-primary" /> ملاحظات
            </h3>
            {!isEditingNotes && (
              <button onClick={() => { setEditNotes(item.notes ?? ''); setIsEditingNotes(true); }} className="text-muted-foreground hover:text-primary transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={5} dir="auto" className="text-sm bg-muted/50 resize-none" placeholder="أضف ملاحظاتك..." autoFocus />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNotes}><Check className="w-3.5 h-3.5 me-1.5" />حفظ</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(false)}><X className="w-3.5 h-3.5 me-1.5" />إلغاء</Button>
              </div>
            </div>
          ) : (
            <div>
              {item.notes ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.notes}</p>
              ) : (
                <button onClick={() => { setEditNotes(''); setIsEditingNotes(true); }} className="text-sm text-muted-foreground/60 hover:text-muted-foreground italic">
                  أضف ملاحظاتك حول هذا {typeConf.label}...
                </button>
              )}
            </div>
          )}
        </div>

        {/* Connections */}
        {(linkedGoal || linkedProject) && (
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold text-sm">الارتباطات</h3>
            {linkedGoal && (
              <button onClick={() => navigate(`/goals/${linkedGoal.id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start">
                <Target className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">{linkedGoal.title}</span>
                <Badge variant="outline" className="text-xs shrink-0">هدف</Badge>
              </button>
            )}
            {linkedProject && (
              <button onClick={() => navigate(`/projects/${linkedProject.id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start">
                <FolderKanban className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">{linkedProject.title}</span>
                <Badge variant="outline" className="text-xs shrink-0">مشروع</Badge>
              </button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
