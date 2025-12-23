import { MainLayout } from '@/components/layout/MainLayout';
import { FileText, GraduationCap, Plus, Search, Tag, Sparkles, Play, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useNotes, useCourses, useCreateNote, useCreateCourse } from '@/hooks/useKnowledge';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function Knowledge() {
  const { t, currentLanguage } = useLanguage();
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const createNote = useCreateNote();
  const createCourse = useCreateCourse();

  const [activeTab, setActiveTab] = useState<'notes' | 'courses'>('notes');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
  const [newCourse, setNewCourse] = useState({ title: '', platform: '', url: '', total_lessons: '' });

  const isLoading = notesLoading || coursesLoading;

  const tabs = [
    { id: 'notes' as const, label: t('knowledge.notes'), icon: FileText },
    { id: 'courses' as const, label: t('knowledge.courses'), icon: GraduationCap },
  ];

  const filteredNotes = notes?.filter(note => 
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
        tags: newNote.tags ? newNote.tags.split(',').map(t => t.trim()) : null,
      });
      toast.success(t('knowledge.noteAdded'));
      setIsNoteDialogOpen(false);
      setNewNote({ title: '', content: '', tags: '' });
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
        platform: newCourse.platform || null,
        url: newCourse.url || null,
        total_lessons: newCourse.total_lessons ? parseInt(newCourse.total_lessons) : null,
      });
      toast.success(t('knowledge.courseAdded'));
      setIsCourseDialogOpen(false);
      setNewCourse({ title: '', platform: '', url: '', total_lessons: '' });
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
            {activeTab === 'notes' ? (
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
                    <Button onClick={handleCreateNote} className="w-full" disabled={createNote.isPending}>
                      {createNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
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
                    <Input
                      type="number"
                      placeholder={t('knowledge.totalLessons')}
                      value={newCourse.total_lessons}
                      onChange={(e) => setNewCourse({ ...newCourse, total_lessons: e.target.value })}
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
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes Section */}
        <div className="lg:col-span-2">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">{t('knowledge.recentNotes')}</h3>
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

            {filteredNotes.length > 0 ? (
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {note.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.updated_at), { 
                          addSuffix: true,
                          locale: currentLanguage === 'ar' ? ar : enUS 
                        })}
                      </span>
                    </div>
                    {note.content && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{note.content}</p>
                    )}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{t('knowledge.noNotes')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Courses Section */}
        <div>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">{t('knowledge.activeCourses')}</h3>
              <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                {t('common.viewAll')} <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">📚</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                          {course.title}
                        </h4>
                        {course.platform && (
                          <span className="text-xs text-muted-foreground">{course.platform}</span>
                        )}
                      </div>
                      <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                      </button>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">{t('common.progress')}</span>
                        <span className="text-xs font-medium text-foreground">{course.progress || 0}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-gold rounded-full transition-all"
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {course.total_lessons && (
                      <span className="text-xs text-muted-foreground">
                        {course.completed_lessons || 0}/{course.total_lessons} {t('knowledge.lessons')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{t('knowledge.noCourses')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
