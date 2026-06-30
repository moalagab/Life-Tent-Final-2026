/**
 * NotesTab — reusable inline notes panel for workspace pages.
 * No heavy card borders. Notes are plain rows with hover actions.
 * Supports: create · edit inline · delete · archive · navigate to Knowledge page.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCreateNote, useUpdateNote, useDeleteNote, useArchiveNote,
} from '@/hooks/useKnowledge';
import type { Note } from '@/hooks/useKnowledge';
import { cn }    from '@/lib/utils';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Plus, Pencil, Trash2, Archive, Check, X, ExternalLink,
  FileText, StickyNote, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// ── Note type — extra fields injected by query ─────────────────────────────────

interface NotesTabProps {
  notes:     Note[];
  isLoading: boolean;
  // How the new note gets linked back to its parent:
  linkField: 'project_id' | 'goal_id' | 'folder';
  linkValue: string;
}

// ── Inline note form ──────────────────────────────────────────────────────────

function NewNoteForm({
  onSave,
  onCancel,
  isSaving,
}: {
  onSave:   (title: string, content: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="border border-border/60 rounded-xl p-3 space-y-2 bg-muted/30" dir="rtl">
      <Input
        placeholder="عنوان الملاحظة..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="h-8 text-sm bg-transparent border-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
        autoFocus
        dir="auto"
      />
      <Textarea
        placeholder="اكتب ملاحظتك هنا..."
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        className="text-sm bg-transparent border-0 resize-none px-0 focus-visible:ring-0"
        dir="auto"
      />
      <div className="flex items-center gap-2 justify-end pt-1">
        <Button
          size="sm" variant="ghost"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          <X className="w-3 h-3 me-1" />
          إلغاء
        </Button>
        <Button
          size="sm"
          onClick={() => { if (title.trim()) onSave(title, content); }}
          disabled={!title.trim() || isSaving}
          className="h-7 text-xs"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin me-1" /> : <Check className="w-3 h-3 me-1" />}
          حفظ
        </Button>
      </div>
    </div>
  );
}

// ── Note row ──────────────────────────────────────────────────────────────────

function NoteRow({ note }: { note: Note }) {
  const [expanded, setExpanded]   = useState(false);
  const [editing,  setEditing]    = useState(false);
  const [editTitle,   setEditTitle]   = useState(note.title);
  const [editContent, setEditContent] = useState(note.content ?? '');

  const updateNote  = useUpdateNote();
  const deleteNote  = useDeleteNote();
  const archiveNote = useArchiveNote();
  const navigate    = useNavigate();

  const handleSave = async () => {
    try {
      await updateNote.mutateAsync({ id: note.id, title: editTitle, content: editContent });
      setEditing(false);
      toast.success('تم تحديث الملاحظة');
    } catch { toast.error('حدث خطأ'); }
  };

  const handleDelete = async () => {
    if (!confirm('هل تريد حذف هذه الملاحظة؟')) return;
    try {
      await deleteNote.mutateAsync(note.id);
      toast.success('تم حذف الملاحظة');
    } catch { toast.error('حدث خطأ'); }
  };

  const handleArchive = async () => {
    try {
      await archiveNote.mutateAsync(note.id);
      toast.success('تم أرشفة الملاحظة');
    } catch { toast.error('حدث خطأ'); }
  };

  if (editing) {
    return (
      <div className="border border-primary/30 rounded-xl p-3 space-y-2 bg-primary/5" dir="rtl">
        <Input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          className="h-8 text-sm font-semibold bg-transparent border-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0"
          dir="auto"
        />
        <Textarea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          rows={4}
          className="text-sm bg-transparent border-0 resize-none px-0 focus-visible:ring-0"
          dir="auto"
        />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs">
            <X className="w-3 h-3 me-1" />إلغاء
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateNote.isPending} className="h-7 text-xs">
            {updateNote.isPending
              ? <Loader2 className="w-3 h-3 animate-spin me-1" />
              : <Check className="w-3 h-3 me-1" />}
            حفظ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group border-b border-border/30 last:border-0 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg px-2 -mx-2"
      dir="rtl"
    >
      {/* Main row */}
      <div className="flex items-start gap-2">
        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0" onClick={() => setExpanded(v => !v)}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{note.title}</p>
            {note.tags && note.tags.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                #{note.tags[0]}
                {note.tags.length > 1 ? ` +${note.tags.length - 1}` : ''}
              </span>
            )}
          </div>
          {!expanded && note.content && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{note.content}</p>
          )}
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true, locale: ar })}
          </p>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground p-1"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setEditTitle(note.title); setEditContent(note.content ?? ''); setEditing(true); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="تعديل"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => navigate('/knowledge')}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="فتح في الملاحظات"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={handleArchive}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-amber-500 transition-colors"
            title="أرشفة"
          >
            <Archive className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
            title="حذف"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && note.content && (
        <div className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed ps-5 border-s-2 border-border/40">
          {note.content}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function NotesTab({ notes, isLoading, linkField, linkValue }: NotesTabProps) {
  const [adding, setAdding] = useState(false);
  const createNote = useCreateNote();

  const handleSave = async (title: string, content: string) => {
    try {
      await createNote.mutateAsync({
        title,
        content,
        [linkField]: linkValue,
      });
      toast.success('تم إنشاء الملاحظة');
      setAdding(false);
    } catch { toast.error('حدث خطأ'); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            الملاحظات
            {notes.length > 0 && (
              <span className="text-muted-foreground font-normal ms-1.5">({notes.length})</span>
            )}
          </span>
        </div>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            ملاحظة جديدة
          </Button>
        )}
      </div>

      {/* New note form */}
      {adding && (
        <NewNoteForm
          onSave={handleSave}
          onCancel={() => setAdding(false)}
          isSaving={createNote.isPending}
        />
      )}

      {/* Notes list */}
      {notes.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <StickyNote className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد ملاحظات بعد</p>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1">
            <Plus className="w-3 h-3" />
            أضف أول ملاحظة
          </Button>
        </div>
      ) : (
        <div>
          {notes.map(note => (
            <NoteRow key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
