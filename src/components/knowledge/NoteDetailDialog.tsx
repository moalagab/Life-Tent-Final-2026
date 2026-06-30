import { useState, useEffect } from 'react';
import { 
  FileText, Edit3, Save, X, Trash2, Archive, Tag, Briefcase, 
  Target, FolderOpen, Clock, Calendar, Loader2, Eye, Pencil 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { Note } from '@/hooks/useKnowledge';
import { formatDistanceToNow, format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Project {
  id: string;
  title: string;
}

interface Goal {
  id: string;
  title: string;
}

interface NoteDetailDialogProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Partial<Note> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  projects?: Project[];
  goals?: Goal[];
  isSaving?: boolean;
}

export function NoteDetailDialog({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onArchive,
  projects = [],
  goals = [],
  isSaving = false,
}: NoteDetailDialogProps) {
  const { t, currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  const [editedNote, setEditedNote] = useState<Partial<Note> & { id: string }>({
    id: '',
    title: '',
    content: '',
    tags: [],
    folder: '',
    project_id: null,
    goal_id: null,
  });
  const [tagsInput, setTagsInput] = useState('');

  // Sync note data when dialog opens
  useEffect(() => {
    if (note) {
      setEditedNote({
        id: note.id,
        title: note.title,
        content: note.content || '',
        tags: note.tags || [],
        folder: note.folder || '',
        project_id: note.project_id || null,
        goal_id: note.goal_id || null,
      });
      setTagsInput(note.tags?.join(', ') || '');
      setActiveTab('view');
    }
  }, [note]);

  const handleSave = async () => {
    if (!editedNote.title?.trim()) return;
    
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : null;
    
    await onSave({
      ...editedNote,
      tags,
      project_id: editedNote.project_id || null,
      goal_id: editedNote.goal_id || null,
      folder: editedNote.folder || null,
    });
    setActiveTab('view');
  };

  const handleDelete = async () => {
    if (!note) return;
    if (window.confirm(currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الملاحظة؟' : 'Are you sure you want to delete this note?')) {
      await onDelete(note.id);
      onClose();
    }
  };

  const handleArchive = async () => {
    if (!note) return;
    await onArchive(note.id);
    onClose();
  };

  const linkedProject = projects.find(p => p.id === note?.project_id);
  const linkedGoal = goals.find(g => g.id === note?.goal_id);

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="truncate max-w-[300px]">
                {activeTab === 'edit' ? (currentLanguage === 'ar' ? 'تعديل الملاحظة' : 'Edit Note') : note.title}
              </span>
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'view' | 'edit')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="view" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'عرض' : 'View'}
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'تعديل' : 'Edit'}
            </TabsTrigger>
          </TabsList>

          {/* View Mode */}
          <TabsContent value="view" className="flex-1 overflow-y-auto mt-4 space-y-4">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'ar' ? 'آخر تحديث: ' : 'Updated: '}
                  {formatDistanceToNow(new Date(note.updated_at), { 
                    addSuffix: true,
                    locale: currentLanguage === 'ar' ? ar : enUS 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {currentLanguage === 'ar' ? 'أنشئت: ' : 'Created: '}
                  {format(new Date(note.created_at), 'PPP', { 
                    locale: currentLanguage === 'ar' ? ar : enUS 
                  })}
                </span>
              </div>
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-3">
              {linkedProject && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span className="text-muted-foreground">{currentLanguage === 'ar' ? 'مشروع:' : 'Project:'}</span>
                  <span className="font-medium text-foreground">{linkedProject.title}</span>
                </div>
              )}
              {linkedGoal && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
                  <Target className="w-4 h-4 text-success" />
                  <span className="text-muted-foreground">{currentLanguage === 'ar' ? 'هدف:' : 'Goal:'}</span>
                  <span className="font-medium text-foreground">{linkedGoal.title}</span>
                </div>
              )}
              {note.folder && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{currentLanguage === 'ar' ? 'مجلد:' : 'Folder:'}</span>
                  <span className="font-medium text-foreground">{note.folder}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 min-h-[200px]">
              {note.content ? (
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {note.content}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  {currentLanguage === 'ar' ? 'لا يوجد محتوى' : 'No content'}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-border/50">
              <Button variant="outline" onClick={handleArchive} className="flex-1">
                <Archive className="w-4 h-4 me-2" />
                {currentLanguage === 'ar' ? 'أرشفة' : 'Archive'}
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="flex-1">
                <Trash2 className="w-4 h-4 me-2" />
                {t('common.delete')}
              </Button>
            </div>
          </TabsContent>

          {/* Edit Mode */}
          <TabsContent value="edit" className="flex-1 overflow-y-auto mt-4 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('knowledge.noteTitle')}
              </Label>
              <Input
                placeholder={t('knowledge.noteTitle')}
                value={editedNote.title || ''}
                onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
                className="bg-muted/50"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                {t('knowledge.noteContent')}
              </Label>
              <Textarea
                placeholder={t('knowledge.noteContent')}
                value={editedNote.content || ''}
                onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
                rows={8}
                className="bg-muted/50 resize-none"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {t('knowledge.tags')}
              </Label>
              <Input
                placeholder={currentLanguage === 'ar' ? 'مفصولة بفاصلة (،)' : 'Separated by comma'}
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            {/* Folder */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                {currentLanguage === 'ar' ? 'المجلد' : 'Folder'}
              </Label>
              <Input
                placeholder={currentLanguage === 'ar' ? 'اسم المجلد (اختياري)' : 'Folder name (optional)'}
                value={editedNote.folder || ''}
                onChange={(e) => setEditedNote({ ...editedNote, folder: e.target.value })}
                className="bg-muted/50"
              />
            </div>

            {/* Link to Project */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {currentLanguage === 'ar' ? 'ربط بمشروع' : 'Link to Project'}
              </Label>
              <Select 
                value={editedNote.project_id || 'none'} 
                onValueChange={(v) => setEditedNote({ ...editedNote, project_id: v === 'none' ? null : v })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر مشروع' : 'Select Project'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{currentLanguage === 'ar' ? 'بدون' : 'None'}</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link to Goal */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                {currentLanguage === 'ar' ? 'ربط بهدف' : 'Link to Goal'}
              </Label>
              <Select 
                value={editedNote.goal_id || 'none'} 
                onValueChange={(v) => setEditedNote({ ...editedNote, goal_id: v === 'none' ? null : v })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر هدف' : 'Select Goal'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{currentLanguage === 'ar' ? 'بدون' : 'None'}</SelectItem>
                  {goals.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-border/50">
              <Button 
                onClick={handleSave} 
                className="w-full" 
                disabled={isSaving || !editedNote.title?.trim()}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                ) : (
                  <Save className="w-4 h-4 me-2" />
                )}
                {t('common.save')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}