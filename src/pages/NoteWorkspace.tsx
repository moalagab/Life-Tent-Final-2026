import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/hooks/useLanguage';
import { useNotes, useUpdateNote, useDeleteNote, useArchiveNote } from '@/hooks/useKnowledge';
import { useProjects } from '@/hooks/useProjects';
import { useGoals } from '@/hooks/useGoals';
import { useAreas } from '@/hooks/useAreas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowRight, FileText, FolderKanban, Target, MapPin,
  Tag, Save, Archive, Trash2, Loader2, AlertTriangle,
  Check, X, Pencil, Clock,
} from 'lucide-react';

export default function NoteWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const dateLocale = isAr ? ar : undefined;

  const { data: notes }    = useNotes();
  const { data: projects } = useProjects();
  const { data: goals }    = useGoals();
  const { data: areas }    = useAreas();
  const updateNote  = useUpdateNote();
  const deleteNote  = useDeleteNote();
  const archiveNote = useArchiveNote();

  const note = notes?.find(n => n.id === id);

  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isEditingTitle, setEditingTitle] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when note loads
  useEffect(() => {
    if (note) {
      setEditContent(note.content ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  const linkedProject = projects?.find(p => p.id === note?.project_id);
  const linkedGoal    = goals?.find(g => g.id === note?.goal_id);
  const linkedArea    = areas?.find(a => a.id === note?.folder);

  // Auto-save on content change (debounced via Save button)
  const handleContentChange = (val: string) => {
    setEditContent(val);
    setIsDirty(true);
  };

  const saveContent = useCallback(async () => {
    if (!note) return;
    setIsSaving(true);
    try {
      await updateNote.mutateAsync({ id: note.id, content: editContent });
      setIsDirty(false);
      toast.success(isAr ? 'تم الحفظ' : 'Saved');
    } finally {
      setIsSaving(false);
    }
  }, [note, editContent, isAr, updateNote]);

  // Cmd/Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) saveContent();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty, saveContent]);

  // Title edit handlers
  function startEditTitle() { if (note) { setEditTitle(note.title); setEditingTitle(true); } }
  function cancelEditTitle() { setEditingTitle(false); }
  async function saveTitle() {
    if (!editTitle.trim() || !note) return;
    await updateNote.mutateAsync({ id: note.id, title: editTitle.trim() });
    setEditingTitle(false);
    toast.success(isAr ? 'تم الحفظ' : 'Saved');
  }

  async function handleDelete() {
    if (!note) return;
    if (!confirm(isAr ? 'حذف هذه الملاحظة؟' : 'Delete this note?')) return;
    await deleteNote.mutateAsync(note.id);
    navigate('/knowledge');
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
  }

  async function handleArchive() {
    if (!note) return;
    await archiveNote.mutateAsync(note.id);
    navigate('/knowledge');
    toast.success(isAr ? 'تمت الأرشفة' : 'Archived');
  }

  // ── Loading / not found ─────────────────────────────────────────────────────

  if (!notes) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!note) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertTriangle className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{isAr ? 'الملاحظة غير موجودة' : 'Note not found'}</p>
          <Button variant="outline" onClick={() => navigate('/knowledge')}>
            {isAr ? 'العودة للمعرفة' : 'Back to Knowledge'}
          </Button>
        </div>
      </MainLayout>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-4 pb-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate('/knowledge')} className="hover:text-foreground transition-colors">
            {isAr ? 'المعرفة' : 'Knowledge'}
          </button>
          <ArrowRight className={cn('w-3.5 h-3.5', isAr && 'rotate-180')} />
          <span className="text-foreground font-medium truncate max-w-[240px]">{note.title}</span>
        </div>

        {/* Header */}
        <div className="glass-card p-5 relative overflow-hidden" style={{ borderTop: '3px solid hsl(var(--primary))' }}>
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ background: 'radial-gradient(60% 60% at 80% 20%, var(--primary), transparent)' }}
          />
          <div className="relative space-y-3">
            {/* Title */}
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              {isEditingTitle ? (
                <div className="flex-1 flex items-start gap-2">
                  <input
                    className="flex-1 text-xl font-black bg-transparent border-b border-primary/40 focus:border-primary outline-none text-foreground"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') cancelEditTitle(); }}
                    autoFocus
                  />
                  <button onClick={saveTitle} className="p-1 hover:text-emerald-500 transition-colors"><Check className="w-4 h-4" /></button>
                  <button onClick={cancelEditTitle} className="p-1 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button
                  className="flex-1 text-xl font-black text-foreground text-start hover:text-primary transition-colors"
                  onClick={startEditTitle}
                >
                  {note.title}
                </button>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isAr ? 'آخر تحديث' : 'Updated'}{' '}
                {format(parseISO(note.updated_at), 'dd MMM yyyy', { locale: dateLocale })}
              </span>
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <Tag className="w-3 h-3 text-muted-foreground" />
                {note.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5 rounded-full">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant={isDirty ? 'default' : 'outline'}
                className="gap-1.5 text-xs"
                onClick={saveContent}
                disabled={!isDirty || isSaving}
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isAr ? 'حفظ' : 'Save'}
                {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-primary ms-0.5" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={handleArchive}
              >
                <Archive className="w-3.5 h-3.5" />
                {isAr ? 'أرشفة' : 'Archive'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs text-destructive hover:text-destructive ms-auto"
                onClick={handleDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isAr ? 'حذف' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content editor */}
        <div className="glass-card p-1 overflow-hidden">
          <Textarea
            value={editContent}
            onChange={e => handleContentChange(e.target.value)}
            placeholder={isAr ? 'ابدأ الكتابة هنا...' : 'Start writing here...'}
            className={cn(
              'min-h-[400px] text-sm leading-relaxed resize-none border-0 focus-visible:ring-0',
              'bg-transparent font-mono p-4',
            )}
            dir={isAr ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Relations */}
        {(linkedProject || linkedGoal || linkedArea) && (
          <div className="glass-card p-4 space-y-3">
            <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              {isAr ? 'الروابط' : 'Relations'}
            </div>
            <div className="space-y-2">
              {linkedProject && (
                <button
                  onClick={() => navigate(`/projects/${linkedProject.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${linkedProject.color ?? '#6366f1'}20` }}
                  >
                    <FolderKanban className="w-4 h-4" style={{ color: linkedProject.color ?? '#6366f1' }} />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{isAr ? 'مشروع' : 'Project'}</div>
                    <div className="text-sm font-semibold text-foreground">{linkedProject.title}</div>
                  </div>
                  <ArrowRight className={cn('w-3.5 h-3.5 text-muted-foreground ms-auto', isAr && 'rotate-180')} />
                </button>
              )}
              {linkedGoal && (
                <button
                  onClick={() => navigate(`/goals/${linkedGoal.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{isAr ? 'هدف' : 'Goal'}</div>
                    <div className="text-sm font-semibold text-foreground">{linkedGoal.title}</div>
                  </div>
                  <ArrowRight className={cn('w-3.5 h-3.5 text-muted-foreground ms-auto', isAr && 'rotate-180')} />
                </button>
              )}
              {linkedArea && (
                <button
                  onClick={() => navigate(`/areas/${linkedArea.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{isAr ? 'مجال' : 'Area'}</div>
                    <div className="text-sm font-semibold text-foreground">{linkedArea.name}</div>
                  </div>
                  <ArrowRight className={cn('w-3.5 h-3.5 text-muted-foreground ms-auto', isAr && 'rotate-180')} />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
