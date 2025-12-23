import { BookOpen, FileText, ArrowUpRight, Loader2, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useNotes, useCourses } from '@/hooks/useKnowledge';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function KnowledgeWidget() {
  const { t, currentLanguage } = useLanguage();
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: courses, isLoading: coursesLoading } = useCourses();

  const isLoading = notesLoading || coursesLoading;

  const recentNotes = notes?.slice(0, 3) || [];
  const activeCourses = courses?.filter(c => c.status === 'in_progress').slice(0, 2) || [];
  
  const totalNotes = notes?.length || 0;
  const totalCourses = courses?.length || 0;
  const coursesInProgress = courses?.filter(c => c.status === 'in_progress').length || 0;

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{t('knowledge.title')}</h3>
              <p className="text-xs text-muted-foreground">
                {totalNotes} {currentLanguage === 'ar' ? 'ملاحظة' : 'notes'} • {totalCourses} {currentLanguage === 'ar' ? 'دورة' : 'courses'}
              </p>
            </div>
          </div>
          <Link 
            to="/knowledge" 
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            {t('common.viewAll')} 
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {(recentNotes.length > 0 || activeCourses.length > 0) ? (
          <div className="space-y-4">
            {/* Recent Notes */}
            {recentNotes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  {currentLanguage === 'ar' ? 'ملاحظات حديثة' : 'Recent Notes'}
                </p>
                <div className="space-y-2">
                  {recentNotes.map((note) => (
                    <div 
                      key={note.id}
                      className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate flex-1">
                          {note.title}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDistanceToNow(new Date(note.updated_at), {
                            addSuffix: true,
                            locale: currentLanguage === 'ar' ? ar : enUS
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Courses */}
            {activeCourses.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3" />
                  {currentLanguage === 'ar' ? 'دورات نشطة' : 'Active Courses'}
                </p>
                <div className="space-y-2">
                  {activeCourses.map((course) => (
                    <div 
                      key={course.id}
                      className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-foreground truncate flex-1">
                          {course.title}
                        </p>
                        <span className="text-xs font-medium text-primary ml-2">
                          {course.progress || 0}%
                        </span>
                      </div>
                      <Progress value={course.progress || 0} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="pt-3 border-t border-border/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/20">
                  <p className="text-lg font-bold text-foreground">{totalNotes}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentLanguage === 'ar' ? 'ملاحظة' : 'Notes'}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/20">
                  <p className="text-lg font-bold text-foreground">{coursesInProgress}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentLanguage === 'ar' ? 'قيد التعلم' : 'Learning'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {currentLanguage === 'ar' ? 'لا توجد ملاحظات أو دورات' : 'No notes or courses'}
            </p>
            <Link 
              to="/knowledge" 
              className="inline-block mt-2 text-sm text-primary hover:underline"
            >
              {currentLanguage === 'ar' ? 'إضافة محتوى جديد' : 'Add new content'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
