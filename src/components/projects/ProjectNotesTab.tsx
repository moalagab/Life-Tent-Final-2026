import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjectNotes, useCreateNote, useDeleteNote, Note } from '@/hooks/useKnowledge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  Plus, FileText, Trash2, Loader2, 
  StickyNote, Tag, Calendar, ExternalLink, MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ProjectNotesTabProps {
  projectId: string;
}

export function ProjectNotesTab({ projectId }: ProjectNotesTabProps) {
  const { t, currentLanguage } = useLanguage();
  const { data: notes, isLoading } = useProjectNotes(projectId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    folder: '',
  });
  const [newTag, setNewTag] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const isRTL = currentLanguage === 'ar';
  const dateLocale = isRTL ? arSA : enUS;

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) {
      toast.error(isRTL ? 'العنوان مطلوب' : 'Title is required');
      return;
    }

    try {
      await createNote.mutateAsync({
        ...newNote,
        project_id: projectId,
      });
      toast.success(isRTL ? 'تم إنشاء الملاحظة' : 'Note created');
      setNewNote({ title: '', content: '', tags: [], folder: '' });
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync(noteId);
      toast.success(isRTL ? 'تم حذف الملاحظة' : 'Note deleted');
      if (selectedNote?.id === noteId) setSelectedNote(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !newNote.tags.includes(newTag.trim())) {
      setNewNote({ ...newNote, tags: [...newNote.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setNewNote({ ...newNote, tags: newNote.tags.filter(t => t !== tag) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-primary" />
          {isRTL ? 'ملاحظات المشروع' : 'Project Notes'}
          {notes && notes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notes.length}
            </Badge>
          )}
        </h3>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              {isRTL ? 'ملاحظة جديدة' : 'New Note'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-primary" />
                {isRTL ? 'إضافة ملاحظة جديدة' : 'Add New Note'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {isRTL ? 'العنوان' : 'Title'} *
                </label>
                <Input
                  placeholder={isRTL ? 'عنوان الملاحظة...' : 'Note title...'}
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {isRTL ? 'المحتوى' : 'Content'}
                </label>
                <Textarea
                  placeholder={isRTL ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {isRTL ? 'المجلد' : 'Folder'}
                </label>
                <Input
                  placeholder={isRTL ? 'اسم المجلد (اختياري)' : 'Folder name (optional)'}
                  value={newNote.folder}
                  onChange={(e) => setNewNote({ ...newNote, folder: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {isRTL ? 'الوسوم' : 'Tags'}
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder={isRTL ? 'أضف وسم...' : 'Add tag...'}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {newNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newNote.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <span className="ms-1 text-xs">×</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCreateNote} 
                className="w-full" 
                disabled={createNote.isPending}
              >
                {createNote.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 me-2" />
                    {isRTL ? 'إضافة الملاحظة' : 'Add Note'}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notes Grid */}
      {notes && notes.length > 0 ? (
        <div className="grid gap-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                'group p-4 rounded-xl border bg-card/50 hover:bg-card transition-all duration-200',
                'hover:shadow-md hover:border-primary/20',
                selectedNote?.id === note.id && 'ring-2 ring-primary/30'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => setSelectedNote(selectedNote?.id === note.id ? null : note)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <h4 className="font-medium text-foreground line-clamp-1">
                      {note.title}
                    </h4>
                  </div>
                  
                  {note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {note.content}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(note.updated_at), 'dd MMM yyyy', { locale: dateLocale })}
                    </span>
                    {note.folder && (
                      <span className="flex items-center gap-1">
                        📁 {note.folder}
                      </span>
                    )}
                  </div>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="w-2.5 h-2.5 me-1" />
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem 
                      onClick={() => window.open(`/knowledge`, '_blank')}
                      className="cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 me-2" />
                      {isRTL ? 'فتح في المعرفة' : 'Open in Knowledge'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteNote(note.id)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 me-2" />
                      {isRTL ? 'حذف' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Expanded Content */}
              {selectedNote?.id === note.id && note.content && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
          <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground mb-3">
            {isRTL ? 'لا توجد ملاحظات لهذا المشروع' : 'No notes for this project'}
          </p>
          <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 me-2" />
            {isRTL ? 'أضف أول ملاحظة' : 'Add First Note'}
          </Button>
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-muted-foreground text-center">
        {isRTL 
          ? '💡 الملاحظات المضافة هنا ستظهر أيضاً في قسم المعرفة'
          : '💡 Notes added here will also appear in the Knowledge section'
        }
      </p>
    </div>
  );
}