import { useState, lazy, Suspense } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, GraduationCap, Plus, Check, Clock, FileText,
  Lightbulb, Play, Trash2, Edit3, MoreVertical, Star, RotateCcw,
  ChevronDown, ChevronUp, ExternalLink, Loader2, Download, Network
} from 'lucide-react';
const CourseMindMap = lazy(() => import('./CourseMindMap').then(m => ({ default: m.CourseMindMap })));
import { generateCourseNotesPDF } from '@/lib/pdf-export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/hooks/useLanguage';
import { Course } from '@/hooks/useKnowledge';
import { 
  useCourseLessons, useCreateCourseLesson, useUpdateCourseLesson, useDeleteCourseLesson,
  useCourseNotes, useCreateCourseNote, useUpdateCourseNote, useDeleteCourseNote,
  useCourseFlashcards, useCreateCourseFlashcard, useUpdateCourseFlashcard, useDeleteCourseFlashcard,
  CourseLesson, CourseNote, CourseFlashcard, calculateNextReview
} from '@/hooks/useCourseStudy';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface CourseDetailViewProps {
  course: Course;
  onBack: () => void;
  onUpdateCourse: (updates: Partial<Course>) => void;
}

export function CourseDetailView({ course, onBack, onUpdateCourse }: CourseDetailViewProps) {
  const { t, currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'lessons' | 'notes' | 'flashcards' | 'mindmap' | 'review'>('lessons');
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddFlashcardOpen, setIsAddFlashcardOpen] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // New item states
  const [newLesson, setNewLesson] = useState({ title: '', description: '', duration_minutes: '' });
  const [newNote, setNewNote] = useState({ title: '', content: '', note_type: 'note', is_important: false });
  const [newFlashcard, setNewFlashcard] = useState({ question: '', answer: '' });
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Queries
  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(course.id);
  const { data: notes } = useCourseNotes(course.id);
  const { data: flashcards } = useCourseFlashcards(course.id);

  // Mutations
  const createLesson = useCreateCourseLesson();
  const updateLesson = useUpdateCourseLesson();
  const deleteLesson = useDeleteCourseLesson();
  const createNote = useCreateCourseNote();
  const updateNote = useUpdateCourseNote();
  const deleteNote = useDeleteCourseNote();
  const createFlashcard = useCreateCourseFlashcard();
  const updateFlashcard = useUpdateCourseFlashcard();
  const deleteFlashcard = useDeleteCourseFlashcard();

  const completedLessons = lessons?.filter(l => l.is_completed).length || 0;
  const totalLessons = lessons?.length || 0;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const flashcardsForReview = flashcards?.filter(f => 
    new Date(f.next_review_at || '') <= new Date()
  ) || [];

  const toggleLessonExpand = (lessonId: string) => {
    setExpandedLessons(prev => 
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleAddLesson = async () => {
    if (!newLesson.title) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createLesson.mutateAsync({
        course_id: course.id,
        title: newLesson.title,
        description: newLesson.description || null,
        duration_minutes: newLesson.duration_minutes ? parseInt(newLesson.duration_minutes) : null,
        order_index: (lessons?.length || 0) + 1,
        is_completed: false,
        completed_at: null,
        notes: null,
        video_url: null,
        resources: null,
      });
      toast.success(currentLanguage === 'ar' ? 'تمت إضافة الدرس' : 'Lesson added');
      setNewLesson({ title: '', description: '', duration_minutes: '' });
      setIsAddLessonOpen(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleToggleLessonComplete = async (lesson: CourseLesson) => {
    try {
      await updateLesson.mutateAsync({
        id: lesson.id,
        is_completed: !lesson.is_completed,
        completed_at: !lesson.is_completed ? new Date().toISOString() : null,
      });
      
      // Update course progress
      const newCompleted = lesson.is_completed ? completedLessons - 1 : completedLessons + 1;
      const newProgress = totalLessons > 0 ? Math.round((newCompleted / totalLessons) * 100) : 0;
      onUpdateCourse({ 
        completed_lessons: newCompleted,
        progress: newProgress,
        status: newProgress >= 100 ? 'completed' : 'in_progress'
      });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleAddNote = async () => {
    if (!newNote.title) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createNote.mutateAsync({
        course_id: course.id,
        lesson_id: selectedLessonId,
        title: newNote.title,
        content: newNote.content || null,
        note_type: newNote.note_type,
        tags: null,
        is_important: newNote.is_important,
        review_count: 0,
        last_reviewed_at: null,
      });
      toast.success(currentLanguage === 'ar' ? 'تمت إضافة الملاحظة' : 'Note added');
      setNewNote({ title: '', content: '', note_type: 'note', is_important: false });
      setSelectedLessonId(null);
      setIsAddNoteOpen(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleAddFlashcard = async () => {
    if (!newFlashcard.question || !newFlashcard.answer) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createFlashcard.mutateAsync({
        course_id: course.id,
        lesson_id: selectedLessonId,
        question: newFlashcard.question,
        answer: newFlashcard.answer,
        difficulty: 0,
        next_review_at: new Date().toISOString(),
        review_count: 0,
        correct_count: 0,
      });
      toast.success(currentLanguage === 'ar' ? 'تمت إضافة البطاقة' : 'Flashcard added');
      setNewFlashcard({ question: '', answer: '' });
      setSelectedLessonId(null);
      setIsAddFlashcardOpen(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleFlashcardReview = async (isCorrect: boolean) => {
    const currentCard = flashcardsForReview[currentFlashcardIndex];
    if (!currentCard) return;

    const nextReview = calculateNextReview(currentCard.difficulty || 0, isCorrect);
    const newDifficulty = isCorrect 
      ? Math.min(5, (currentCard.difficulty || 0) + 1)
      : Math.max(0, (currentCard.difficulty || 0) - 2);

    try {
      await updateFlashcard.mutateAsync({
        id: currentCard.id,
        difficulty: newDifficulty,
        next_review_at: nextReview.toISOString(),
        review_count: (currentCard.review_count || 0) + 1,
        correct_count: isCorrect ? (currentCard.correct_count || 0) + 1 : currentCard.correct_count,
      });

      setShowAnswer(false);
      if (currentFlashcardIndex < flashcardsForReview.length - 1) {
        setCurrentFlashcardIndex(prev => prev + 1);
      } else {
        setReviewMode(false);
        setCurrentFlashcardIndex(0);
        toast.success(currentLanguage === 'ar' ? 'تم الانتهاء من المراجعة!' : 'Review complete!');
      }
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          {currentLanguage === 'ar' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
              {course.platform && (
                <p className="text-muted-foreground text-sm">{course.platform}</p>
              )}
            </div>
          </div>
        </div>
        {course.url && (
          <Button variant="outline" onClick={() => window.open(course.url!, '_blank')}>
            <ExternalLink className="w-4 h-4 me-2" />
            {currentLanguage === 'ar' ? 'فتح الدورة' : 'Open Course'}
          </Button>
        )}
      </div>

      {/* Progress Overview */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">
              {currentLanguage === 'ar' ? 'التقدم في الدورة' : 'Course Progress'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {completedLessons} / {totalLessons} {currentLanguage === 'ar' ? 'دروس مكتملة' : 'lessons completed'}
            </p>
          </div>
          <div className="text-2xl font-bold text-primary">{progress}%</div>
        </div>
        <div dir="ltr"><Progress value={progress} className="h-3" /></div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{totalLessons}</p>
            <p className="text-xs text-muted-foreground">{currentLanguage === 'ar' ? 'دروس' : 'Lessons'}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <FileText className="w-5 h-5 mx-auto mb-1 text-secondary-foreground" />
            <p className="text-lg font-bold text-foreground">{notes?.length || 0}</p>
            <p className="text-xs text-muted-foreground">{currentLanguage === 'ar' ? 'ملاحظات' : 'Notes'}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <Lightbulb className="w-5 h-5 mx-auto mb-1 text-accent" />
            <p className="text-lg font-bold text-foreground">{flashcards?.length || 0}</p>
            <p className="text-xs text-muted-foreground">{currentLanguage === 'ar' ? 'بطاقات' : 'Flashcards'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'الدروس' : 'Lessons'}
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'الملاحظات' : 'Notes'}
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'البطاقات' : 'Flashcards'}
              {flashcardsForReview.length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-1.5 rounded-full">
                  {flashcardsForReview.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="mindmap" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'الخريطة الذهنية' : 'Mind Map'}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'lessons' && (
            <Button variant="gold" size="sm" onClick={() => setIsAddLessonOpen(true)}>
              <Plus className="w-4 h-4 me-1" />
              {currentLanguage === 'ar' ? 'إضافة درس' : 'Add Lesson'}
            </Button>
          )}
          {activeTab === 'notes' && (
            <div className="flex gap-2">
              {notes && notes.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    generateCourseNotesPDF({
                      courseTitle: course.title,
                      notes: notes,
                      lessons: lessons,
                    });
                    toast.success(currentLanguage === 'ar' ? 'تم تصدير الملاحظات' : 'Notes exported to PDF');
                  }}
                >
                  <Download className="w-4 h-4 me-1" />
                  {currentLanguage === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                </Button>
              )}
              <Button variant="gold" size="sm" onClick={() => setIsAddNoteOpen(true)}>
                <Plus className="w-4 h-4 me-1" />
                {currentLanguage === 'ar' ? 'إضافة ملاحظة' : 'Add Note'}
              </Button>
            </div>
          )}
          {activeTab === 'flashcards' && (
            <div className="flex gap-2">
              {flashcardsForReview.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setReviewMode(true); setCurrentFlashcardIndex(0); setShowAnswer(false); }}
                >
                  <RotateCcw className="w-4 h-4 me-1" />
                  {currentLanguage === 'ar' ? 'مراجعة' : 'Review'} ({flashcardsForReview.length})
                </Button>
              )}
              <Button variant="gold" size="sm" onClick={() => setIsAddFlashcardOpen(true)}>
                <Plus className="w-4 h-4 me-1" />
                {currentLanguage === 'ar' ? 'إضافة بطاقة' : 'Add Flashcard'}
              </Button>
            </div>
          )}
        </div>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="mt-4">
          {lessonsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : lessons && lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <Collapsible
                  key={lesson.id}
                  open={expandedLessons.includes(lesson.id)}
                  onOpenChange={() => toggleLessonExpand(lesson.id)}
                >
                  <div className={cn(
                    "glass-card p-4 transition-all",
                    lesson.is_completed && "opacity-75"
                  )}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleLessonComplete(lesson); }}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                          lesson.is_completed 
                            ? "bg-green-500 text-white" 
                            : "border-2 border-muted-foreground/30 hover:border-primary"
                        )}
                      >
                        {lesson.is_completed ? <Check className="w-4 h-4" /> : (
                          <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-medium",
                          lesson.is_completed ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {lesson.title}
                        </h4>
                        {lesson.duration_minutes && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration_minutes} {currentLanguage === 'ar' ? 'دقيقة' : 'min'}
                          </span>
                        )}
                      </div>

                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                          {expandedLessons.includes(lesson.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedLessonId(lesson.id);
                            setIsAddNoteOpen(true);
                          }}>
                            <FileText className="w-4 h-4 me-2" />
                            {currentLanguage === 'ar' ? 'إضافة ملاحظة' : 'Add Note'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedLessonId(lesson.id);
                            setIsAddFlashcardOpen(true);
                          }}>
                            <Lightbulb className="w-4 h-4 me-2" />
                            {currentLanguage === 'ar' ? 'إضافة بطاقة' : 'Add Flashcard'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteLesson.mutate({ id: lesson.id, courseId: course.id })}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 me-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CollapsibleContent className="mt-3 pt-3 border-t border-border/50">
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground mb-3">{lesson.description}</p>
                      )}
                      
                      {/* Lesson Notes */}
                      {notes?.filter(n => n.lesson_id === lesson.id).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            {currentLanguage === 'ar' ? 'ملاحظات الدرس:' : 'Lesson Notes:'}
                          </p>
                          {notes.filter(n => n.lesson_id === lesson.id).map(note => (
                            <div key={note.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{note.title}</span>
                                {note.is_important && <Star className="w-3 h-3 text-primary fill-primary" />}
                              </div>
                              {note.content && <p className="text-muted-foreground text-xs mt-1">{note.content}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {currentLanguage === 'ar' ? 'لا توجد دروس بعد' : 'No lessons yet'}
              </p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => setIsAddLessonOpen(true)}
              >
                <Plus className="w-4 h-4 me-1" />
                {currentLanguage === 'ar' ? 'إضافة أول درس' : 'Add first lesson'}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4">
          {notes && notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map(note => (
                <div key={note.id} className="glass-card p-4 group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {note.is_important && <Star className="w-4 h-4 text-primary fill-primary" />}
                      <h4 className="font-medium text-foreground">{note.title}</h4>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7"
                      onClick={() => deleteNote.mutate({ id: note.id, courseId: course.id })}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                  
                  {note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted/50">
                      {note.note_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                        locale: currentLanguage === 'ar' ? ar : enUS
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {currentLanguage === 'ar' ? 'لا توجد ملاحظات بعد' : 'No notes yet'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="mt-4">
          {reviewMode && flashcardsForReview.length > 0 ? (
            <div className="max-w-lg mx-auto">
              <div className="glass-card p-6 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    {currentFlashcardIndex + 1} / {flashcardsForReview.length}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setReviewMode(false)}>
                    {currentLanguage === 'ar' ? 'إنهاء' : 'Exit'}
                  </Button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-lg font-medium text-foreground mb-4">
                    {flashcardsForReview[currentFlashcardIndex]?.question}
                  </p>

                  {showAnswer ? (
                    <>
                      <div className="w-full h-px bg-border my-4" />
                      <p className="text-muted-foreground">
                        {flashcardsForReview[currentFlashcardIndex]?.answer}
                      </p>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setShowAnswer(true)}>
                      {currentLanguage === 'ar' ? 'إظهار الإجابة' : 'Show Answer'}
                    </Button>
                  )}
                </div>

                {showAnswer && (
                  <div className="flex gap-3 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => handleFlashcardReview(false)}
                    >
                      {currentLanguage === 'ar' ? 'صعب' : 'Hard'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
                      onClick={() => handleFlashcardReview(true)}
                    >
                      {currentLanguage === 'ar' ? 'سهل' : 'Easy'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : flashcards && flashcards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map(card => (
                <div key={card.id} className="glass-card p-4 group">
                  <div className="flex items-start justify-between mb-2">
                    <Lightbulb className="w-4 h-4 text-accent" />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7"
                      onClick={() => deleteFlashcard.mutate({ id: card.id, courseId: course.id })}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                  
                  <p className="font-medium text-foreground text-sm mb-2">{card.question}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{card.answer}</p>
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {currentLanguage === 'ar' ? 'مراجعات:' : 'Reviews:'} {card.review_count || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {card.correct_count || 0}/{card.review_count || 0} ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {currentLanguage === 'ar' ? 'لا توجد بطاقات بعد' : 'No flashcards yet'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Mind Map Tab — reactflow loaded on demand */}
        <TabsContent value="mindmap" className="mt-4">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
            <CourseMindMap
              course={course}
              lessons={lessons}
              notes={notes}
              flashcards={flashcards}
            />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Add Lesson Dialog */}
      <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
        <DialogContent dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{currentLanguage === 'ar' ? 'إضافة درس جديد' : 'Add New Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder={currentLanguage === 'ar' ? 'عنوان الدرس' : 'Lesson Title'}
              value={newLesson.title}
              onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
            />
            <Textarea
              placeholder={currentLanguage === 'ar' ? 'وصف الدرس (اختياري)' : 'Lesson Description (optional)'}
              value={newLesson.description}
              onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
              rows={3}
            />
            <Input
              type="number"
              placeholder={currentLanguage === 'ar' ? 'المدة بالدقائق (اختياري)' : 'Duration in minutes (optional)'}
              value={newLesson.duration_minutes}
              onChange={(e) => setNewLesson({ ...newLesson, duration_minutes: e.target.value })}
            />
            <Button onClick={handleAddLesson} className="w-full" disabled={createLesson.isPending}>
              {createLesson.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={(open) => { setIsAddNoteOpen(open); if (!open) setSelectedLessonId(null); }}>
        <DialogContent dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{currentLanguage === 'ar' ? 'إضافة ملاحظة' : 'Add Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder={currentLanguage === 'ar' ? 'عنوان الملاحظة' : 'Note Title'}
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            <Textarea
              placeholder={currentLanguage === 'ar' ? 'محتوى الملاحظة' : 'Note Content'}
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={5}
            />
            <div className="flex items-center gap-4">
              <select
                value={newNote.note_type}
                onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground"
              >
                <option value="note">{currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}</option>
                <option value="summary">{currentLanguage === 'ar' ? 'ملخص' : 'Summary'}</option>
                <option value="question">{currentLanguage === 'ar' ? 'سؤال' : 'Question'}</option>
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newNote.is_important}
                  onChange={(e) => setNewNote({ ...newNote, is_important: e.target.checked })}
                  className="rounded border-border"
                />
                <Star className="w-4 h-4 text-primary" />
              </label>
            </div>
            <Button onClick={handleAddNote} className="w-full" disabled={createNote.isPending}>
              {createNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Flashcard Dialog */}
      <Dialog open={isAddFlashcardOpen} onOpenChange={(open) => { setIsAddFlashcardOpen(open); if (!open) setSelectedLessonId(null); }}>
        <DialogContent dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{currentLanguage === 'ar' ? 'إضافة بطاقة تعليمية' : 'Add Flashcard'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {currentLanguage === 'ar' ? 'السؤال' : 'Question'}
              </label>
              <Textarea
                placeholder={currentLanguage === 'ar' ? 'اكتب السؤال هنا...' : 'Write your question here...'}
                value={newFlashcard.question}
                onChange={(e) => setNewFlashcard({ ...newFlashcard, question: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {currentLanguage === 'ar' ? 'الإجابة' : 'Answer'}
              </label>
              <Textarea
                placeholder={currentLanguage === 'ar' ? 'اكتب الإجابة هنا...' : 'Write the answer here...'}
                value={newFlashcard.answer}
                onChange={(e) => setNewFlashcard({ ...newFlashcard, answer: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleAddFlashcard} className="w-full" disabled={createFlashcard.isPending}>
              {createFlashcard.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
