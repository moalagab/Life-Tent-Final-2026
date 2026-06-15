import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useResources, useUpdateResource } from '@/hooks/useResources';
import { useAreas } from '@/hooks/useAreas';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowRight, FileText, File, Link2, BookOpen, Film, Database,
  FolderKanban, Layers, Pencil, Check, X, ExternalLink, Tag,
  Loader2, Archive, RotateCcw,
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  note:     { label: 'ملاحظة',  icon: FileText,  color: 'text-amber-500' },
  file:     { label: 'ملف',     icon: File,      color: 'text-blue-500' },
  link:     { label: 'رابط',    icon: Link2,     color: 'text-primary' },
  course:   { label: 'دورة',    icon: BookOpen,  color: 'text-purple-500' },
  media:    { label: 'ميديا',   icon: Film,      color: 'text-green-500' },
  document: { label: 'وثيقة',   icon: Database,  color: 'text-muted-foreground' },
};

export default function ResourceWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  const { data: resources } = useResources({ includeArchived: true });
  const { data: areas } = useAreas();
  const { data: projects } = useProjects();
  const updateResource = useUpdateResource();

  const resource = resources?.find(r => r.id === id);
  const linkedArea = areas?.find(a => a.id === resource?.area_id);
  const linkedProject = projects?.find(p => p.id === resource?.project_id);

  const typeConf = TYPE_CONFIG[resource?.type ?? 'note'] ?? TYPE_CONFIG.note;
  const TypeIcon = typeConf.icon;

  if (!resource && resources) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Database className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">المورد غير موجود</p>
          <Button variant="outline" onClick={() => navigate('/projects?tab=resources')}>العودة للموارد</Button>
        </div>
      </MainLayout>
    );
  }

  if (!resource) return <MainLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></MainLayout>;

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) return;
    try { await updateResource.mutateAsync({ id: resource.id, title: editTitle.trim() }); setIsEditingTitle(false); toast.success('تم التحديث'); }
    catch { toast.error('حدث خطأ'); }
  };
  const handleSaveDesc = async () => {
    try { await updateResource.mutateAsync({ id: resource.id, description: editDesc }); setIsEditingDesc(false); toast.success('تم التحديث'); }
    catch { toast.error('حدث خطأ'); }
  };
  const handleSaveContent = async () => {
    try { await updateResource.mutateAsync({ id: resource.id, content: editContent }); setIsEditingContent(false); toast.success('تم حفظ المحتوى'); }
    catch { toast.error('حدث خطأ'); }
  };
  const handleArchive = async () => {
    try {
      await updateResource.mutateAsync({ id: resource.id, status: 'archived', archived_at: new Date().toISOString() });
      toast.success('تم الأرشفة');
    } catch { toast.error('حدث خطأ'); }
  };
  const handleRestore = async () => {
    try {
      await updateResource.mutateAsync({ id: resource.id, status: 'active', archived_at: null });
      toast.success('تم الاستعادة');
    } catch { toast.error('حدث خطأ'); }
  };

  const backLabel = resource.type === 'note' ? 'الملاحظات' : resource.type === 'course' ? 'الدورات' : 'الموارد';

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate('/projects?tab=resources')} className="hover:text-foreground transition-colors">{backLabel}</button>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[220px]">{resource.title}</span>
        </div>

        {/* Header */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <TypeIcon className={cn('w-5 h-5', typeConf.color)} />
              </div>
              <div className="min-w-0 flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveTitle()} className="h-8 font-bold bg-muted/50" dir="auto" autoFocus />
                    <button onClick={handleSaveTitle} className="text-success"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditingTitle(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => { setEditTitle(resource.title); setIsEditingTitle(true); }} className="group flex items-center gap-2 text-start">
                    <h1 className="text-lg font-bold text-foreground leading-snug">{resource.title}</h1>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity shrink-0" />
                  </button>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="outline" className={cn('text-xs', typeConf.color)}>{typeConf.label}</Badge>
                  {resource.status === 'archived' && <Badge variant="secondary" className="text-xs">مؤرشف</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(resource.created_at), 'dd MMM yyyy', { locale: ar })}
                  </span>
                </div>

                {/* Description */}
                {isEditingDesc ? (
                  <div className="mt-2 space-y-2">
                    <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} className="text-sm bg-muted/50 resize-none" dir="auto" autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDesc}>حفظ</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)}>إلغاء</Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setEditDesc(resource.description ?? ''); setIsEditingDesc(true); }} className="group flex items-start gap-1.5 mt-1.5 text-start w-full">
                    <p className="text-sm text-muted-foreground">{resource.description || 'أضف وصفاً...'}</p>
                    <Pencil className="w-3 h-3 mt-0.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 shrink-0 transition-opacity" />
                  </button>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {resource.status === 'active' ? (
                <Button variant="outline" size="sm" onClick={handleArchive} className="gap-1.5">
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">أرشفة</span>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleRestore} className="gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">استعادة</span>
                </Button>
              )}
            </div>
          </div>

          {/* Source URL */}
          {resource.source_url && (
            <a href={resource.source_url} target="_blank" rel="noreferrer"
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm hover:bg-primary/10 transition-colors">
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span className="truncate">{resource.source_url}</span>
            </a>
          )}

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {resource.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content (for notes) */}
        {(resource.type === 'note' || resource.type === 'document' || resource.content) && (
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">المحتوى</h3>
              {!isEditingContent && (
                <button onClick={() => { setEditContent(resource.content ?? ''); setIsEditingContent(true); }} className="text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            {isEditingContent ? (
              <div className="space-y-2">
                <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={12} dir="auto" className="text-sm bg-muted/50 resize-none font-mono" placeholder="اكتب محتوى الملاحظة هنا..." autoFocus />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveContent}><Check className="w-3.5 h-3.5 me-1.5" />حفظ</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingContent(false)}><X className="w-3.5 h-3.5 me-1.5" />إلغاء</Button>
                </div>
              </div>
            ) : (
              resource.content ? (
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono bg-muted/20 rounded-xl p-3">
                  {resource.content}
                </div>
              ) : (
                <button onClick={() => { setEditContent(''); setIsEditingContent(true); }} className="w-full text-sm text-muted-foreground/60 hover:text-muted-foreground italic p-3 text-start rounded-xl border-2 border-dashed border-border/60">
                  اضغط لإضافة محتوى...
                </button>
              )
            )}
          </div>
        )}

        {/* Course info */}
        {resource.type === 'course' && (
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-500" />
              تفاصيل الدورة
            </h3>
            {resource.source_url && (
              <a href={resource.source_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 text-purple-500 text-sm font-medium hover:bg-purple-500/20 transition-colors">
                <ExternalLink className="w-4 h-4" />
                فتح الدورة
              </a>
            )}
          </div>
        )}

        {/* Connections */}
        {(linkedArea || linkedProject) && (
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold text-sm">الارتباطات</h3>
            {linkedArea && (
              <button onClick={() => navigate(`/areas/${linkedArea.id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start">
                <Layers className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">{linkedArea.name}</span>
                <Badge variant="outline" className="text-xs shrink-0">مجال</Badge>
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
