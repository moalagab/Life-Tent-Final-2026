import { MainLayout } from '@/components/layout/MainLayout';
import { FileText, GraduationCap, Plus, Search, Tag, Sparkles, Loader2, Archive, RotateCcw, MoreVertical, ExternalLink, BookOpen, FolderOpen, Target, Briefcase, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useNotes, useCourses, useCreateNote, useCreateCourse, useUpdateNote, useDeleteNote, useArchiveNote, useRestoreNote, useArchivedNotes, useUpdateCourse, useDeleteCourse, Note, Course } from '@/hooks/useKnowledge';
import { useProjects } from '@/hooks/useProjects';
import { useGoals } from '@/hooks/useGoals';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { CourseDetailView } from '@/components/knowledge/CourseDetailView';
import { NoteDetailDialog } from '@/components/knowledge/NoteDetailDialog';

export default function Knowledge() {
  const { t, currentLanguage } = useLanguage();
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: archivedNotes } = useArchivedNotes();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: projects } = useProjects();
  const { data: goals } = useGoals();
  const createNote = useCreateNote();
  const createCourse = useCreateCourse();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const archiveNote = useArchiveNote();
  const restoreNote = useRestoreNote();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [activeTab, setActiveTab] = useState<'notes' | 'courses' | 'archived'>('notes');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '', project_id: '', goal_id: '', folder: '' });
  const [newCourse, setNewCourse] = useState({ title: '', description: '', platform: '', url: '' });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const isLoading = notesLoading || coursesLoading;

  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredArchivedNotes = archivedNotes?.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateNote = async () => {
    if (!newNote.title) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createNote.mutateAsync({
        title: newNote.title,
        content: newNote.content || null,
        tags: newNote.tags ? newNote.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        project_id: newNote.project_id || null,
        goal_id: newNote.goal_id || null,
        folder: newNote.folder || null,
      });
      toast.success(t('knowledge.noteAdded'));
      setIsNoteDialogOpen(false);
      setNewNote({ title: '', content: '', tags: '', project_id: '', goal_id: '', folder: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateNote = async (noteData: Partial<Note> & { id: string }) => {
    try {
      await updateNote.mutateAsync({
        id: noteData.id,
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags,
        project_id: noteData.project_id || null,
        goal_id: noteData.goal_id || null,
        folder: noteData.folder || null,
      });
      toast.success(t('knowledge.noteUpdated'));
      // Update selected note with new data
      if (selectedNote && selectedNote.id === noteData.id) {
        setSelectedNote({ ...selectedNote, ...noteData } as Note);
      }
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote.mutateAsync(id);
      toast.success(t('knowledge.noteDeleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleArchiveNote = async (id: string) => {
    try {
      await archiveNote.mutateAsync(id);
      toast.success(t('knowledge.noteArchived'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleRestoreNote = async (id: string) => {
    try {
      await restoreNote.mutateAsync(id);
      toast.success(t('knowledge.noteRestored'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createCourse.mutateAsync({
        title: newCourse.title,
        description: newCourse.description || null,
        platform: newCourse.platform || null,
        url: newCourse.url || null,
        total_lessons: 0,
        completed_lessons: 0,
        progress: 0,
        status: 'not_started',
      });
      toast.success(t('knowledge.courseAdded'));
      setIsCourseDialogOpen(false);
      setNewCourse({ title: '', description: '', platform: '', url: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateCourse = async (id: string, updates: Partial<Course>) => {
    try {
      await updateCourse.mutateAsync({ id, ...updates });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await deleteCourse.mutateAsync(id);
      toast.success(t('knowledge.courseDeleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Show course detail view if a course is selected
  if (selectedCourse) {
    return (
      <MainLayout>
        <CourseDetailView 
          course={selectedCourse}
          onBack={() => setSelectedCourse(null)}
          onUpdateCourse={(updates) => {
            handleUpdateCourse(selectedCourse.id, updates);
            setSelectedCourse({ ...selectedCourse, ...updates });
          }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('knowledge.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('knowledge.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg">
              <Sparkles className="w-5 h-5 me-2" />
              {t('knowledge.aiInsights')}
            </Button>
            {activeTab === 'notes' && (
              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gold" size="lg">
                    <Plus className="w-5 h-5 me-2" />
                    {t('knowledge.newNote')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('knowledge.newNote')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      placeholder={t('knowledge.noteTitle')}
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    />
                    <Textarea
                      placeholder={t('knowledge.noteContent')}
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      rows={5}
                    />
                    <Input
                      placeholder={t('knowledge.tags')}
                      value={newNote.tags}
                      onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                    />
                    
                    {/* Link to Project */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {currentLanguage === 'ar' ? 'ربط بمشروع' : 'Link to Project'}
                      </Label>
                      <Select value={newNote.project_id || 'none'} onValueChange={(v) => setNewNote({ ...newNote, project_id: v === 'none' ? '' : v })}>
                        <SelectTrigger>
                          <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر مشروع' : 'Select Project'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{currentLanguage === 'ar' ? 'بدون' : 'None'}</SelectItem>
                          {projects?.map(p => (
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
                      <Select value={newNote.goal_id || 'none'} onValueChange={(v) => setNewNote({ ...newNote, goal_id: v === 'none' ? '' : v })}>
                        <SelectTrigger>
                          <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر هدف' : 'Select Goal'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{currentLanguage === 'ar' ? 'بدون' : 'None'}</SelectItem>
                          {goals?.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Folder */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        {currentLanguage === 'ar' ? 'المجلد' : 'Folder'}
                      </Label>
                      <Input
                        placeholder={currentLanguage === 'ar' ? 'اسم المجلد (اختياري)' : 'Folder name (optional)'}
                        value={newNote.folder}
                        onChange={(e) => setNewNote({ ...newNote, folder: e.target.value })}
                      />
                    </div>

                    <Button onClick={handleCreateNote} className="w-full" disabled={createNote.isPending}>
                      {createNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {activeTab === 'courses' && (
              <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gold" size="lg">
                    <Plus className="w-5 h-5 me-2" />
                    {t('knowledge.newCourse')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('knowledge.newCourse')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      placeholder={t('knowledge.courseTitle')}
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    />
                    <Textarea
                      placeholder={currentLanguage === 'ar' ? 'وصف الدورة (اختياري)' : 'Course description (optional)'}
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      rows={3}
                    />
                    <Input
                      placeholder={t('knowledge.platform')}
                      value={newCourse.platform}
                      onChange={(e) => setNewCourse({ ...newCourse, platform: e.target.value })}
                    />
                    <Input
                      placeholder={t('knowledge.url')}
                      value={newCourse.url}
                      onChange={(e) => setNewCourse({ ...newCourse, url: e.target.value })}
                    />
                    <Button onClick={handleCreateCourse} className="w-full" disabled={createCourse.isPending}>
                      {createCourse.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'notes' | 'courses' | 'archived')} className="space-y-6">
        <div className="flex items-center justify-between">
          <div dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
          <TabsList>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('knowledge.notes')}
              {notes && notes.length > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{notes.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              {t('knowledge.courses')}
              {courses && courses.length > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{courses.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              {t('knowledge.archived')}
              {archivedNotes && archivedNotes.length > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{archivedNotes.length}</span>
              )}
            </TabsTrigger>
          </TabsList>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('knowledge.searchNotes')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
            />
          </div>
        </div>

        {/* Notes Tab */}
        <TabsContent value="notes">
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="glass-card p-4 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {note.title}
                    </h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedNote(note); }}>
                          <Eye className="w-4 h-4 me-2" />
                          {currentLanguage === 'ar' ? 'عرض وتعديل' : 'View & Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchiveNote(note.id); }}>
                          <Archive className="w-4 h-4 me-2" />
                          {t('knowledge.archiveNote')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 me-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.updated_at), { 
                      addSuffix: true,
                      locale: currentLanguage === 'ar' ? ar : enUS 
                    })}
                  </span>
                  
                  {note.content && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{note.content}</p>
                  )}
                  
                  {/* Links indicators */}
                  <div className="flex items-center gap-2 mt-2">
                    {note.project_id && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-500">
                        <Briefcase className="w-3 h-3" />
                      </span>
                    )}
                    {note.goal_id && (
                      <span className="flex items-center gap-1 text-[10px] text-success">
                        <Target className="w-3 h-3" />
                      </span>
                    )}
                    {note.folder && (
                      <span className="flex items-center gap-1 text-[10px] text-primary">
                        <FolderOpen className="w-3 h-3" />
                        {note.folder}
                      </span>
                    )}
                  </div>
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">{t('knowledge.noNotes')}</p>
            </div>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses">
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="glass-card p-5 hover:border-primary/30 transition-all group cursor-pointer"
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {course.title}
                        </h4>
                        {course.platform && (
                          <span className="text-xs text-muted-foreground">{course.platform}</span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {course.url && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(course.url!, '_blank'); }}>
                            <ExternalLink className="w-4 h-4 me-2" />
                            {currentLanguage === 'ar' ? 'فتح الرابط' : 'Open Link'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 me-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {course.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                  )}

                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">{t('common.progress')}</span>
                      <span className="text-xs font-medium text-foreground">{course.progress || 0}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {course.completed_lessons || 0}/{course.total_lessons || 0} {t('knowledge.lessons')}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full",
                      course.status === 'completed' ? "bg-green-500/10 text-green-500" :
                      course.status === 'in_progress' ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {course.status === 'completed' ? (currentLanguage === 'ar' ? 'مكتمل' : 'Completed') :
                       course.status === 'in_progress' ? (currentLanguage === 'ar' ? 'قيد التنفيذ' : 'In Progress') :
                       (currentLanguage === 'ar' ? 'لم يبدأ' : 'Not Started')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">{t('knowledge.noCourses')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentLanguage === 'ar' ? 'أضف دورة جديدة للبدء في نظام التعلم' : 'Add a new course to start the learning system'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archived">
          {filteredArchivedNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArchivedNotes.map((note) => (
                <div
                  key={note.id}
                  className="glass-card p-4 opacity-75 hover:opacity-100 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground line-clamp-1">
                      {note.title}
                    </h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRestoreNote(note.id)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        title={t('knowledge.restoreNote')}
                      >
                        <RotateCcw className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                  
                  {note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Archive className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">
                {currentLanguage === 'ar' ? 'لا توجد ملاحظات مؤرشفة' : 'No archived notes'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Note Detail Dialog */}
      <NoteDetailDialog
        note={selectedNote}
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        onSave={handleUpdateNote}
        onDelete={async (id) => {
          await handleDeleteNote(id);
        }}
        onArchive={async (id) => {
          await handleArchiveNote(id);
        }}
        projects={projects || []}
        goals={goals || []}
        isSaving={updateNote.isPending}
      />
    </MainLayout>
  );
}
