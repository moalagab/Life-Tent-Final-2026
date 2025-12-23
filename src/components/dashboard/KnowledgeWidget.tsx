import { BookOpen, FileText, Loader2, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useNotes, useCourses } from '@/hooks/useKnowledge';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { DashboardWidgetShell, DashboardEmptyState } from './DashboardWidgetShell';

export function KnowledgeWidget() {
  const { t, currentLanguage } = useLanguage();
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: courses, isLoading: coursesLoading } = useCourses();

  const isLoading = notesLoading || coursesLoading;

  const recentNotes = notes?.slice(0, 2) || [];
  const activeCourses = courses?.filter(c => c.status === 'in_progress').slice(0, 2) || [];
  
  const totalNotes = notes?.length || 0;
  const coursesInProgress = courses?.filter(c => c.status === 'in_progress').length || 0;

  if (isLoading) {
    return (
      <DashboardWidgetShell
        title={t('knowledge.title')}
        subtitle={`0 ${currentLanguage === 'ar' ? 'ملاحظة' : 'notes'}`}
        icon={BookOpen}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
        accentColor="bg-blue-500/10"
        linkTo="/knowledge"
        linkText={t('common.viewAll')}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </DashboardWidgetShell>
    );
  }

  return (
    <DashboardWidgetShell
      title={t('knowledge.title')}
      subtitle={`${totalNotes} ${currentLanguage === 'ar' ? 'ملاحظة' : 'notes'} • ${coursesInProgress} ${currentLanguage === 'ar' ? 'دورة' : 'courses'}`}
      icon={BookOpen}
      iconColor="text-blue-500"
      iconBg="bg-blue-500/10"
      accentColor="bg-blue-500/10"
      linkTo="/knowledge"
      linkText={t('common.viewAll')}
    >
      {(recentNotes.length > 0 || activeCourses.length > 0) ? (
        <div className="space-y-3">
          {/* Recent Notes */}
          {recentNotes.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileText className="w-2.5 h-2.5" />
                {currentLanguage === 'ar' ? 'ملاحظات' : 'Notes'}
              </p>
              <div className="space-y-1.5">
                {recentNotes.map((note) => (
                  <div key={note.id} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground truncate flex-1 pr-2">
                        {note.title}
                      </p>
                      <span className="text-[9px] text-muted-foreground">
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
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <GraduationCap className="w-2.5 h-2.5" />
                {currentLanguage === 'ar' ? 'دورات' : 'Courses'}
              </p>
              <div className="space-y-1.5">
                {activeCourses.map((course) => (
                  <div key={course.id} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-foreground truncate flex-1 pr-2">
                        {course.title}
                      </p>
                      <span className="text-[10px] font-bold text-blue-500">{course.progress || 0}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="pt-2 border-t border-border/40">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-lg bg-muted/20">
                <p className="text-base font-bold text-foreground">{totalNotes}</p>
                <p className="text-[9px] text-muted-foreground">{currentLanguage === 'ar' ? 'ملاحظة' : 'Notes'}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/20">
                <p className="text-base font-bold text-foreground">{coursesInProgress}</p>
                <p className="text-[9px] text-muted-foreground">{currentLanguage === 'ar' ? 'قيد التعلم' : 'Learning'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <DashboardEmptyState
          icon={BookOpen}
          message={currentLanguage === 'ar' ? 'لا توجد ملاحظات' : 'No notes yet'}
          action={
            <Link to="/knowledge" className="text-xs text-primary hover:underline">
              {currentLanguage === 'ar' ? 'إضافة محتوى' : 'Add content'}
            </Link>
          }
        />
      )}
    </DashboardWidgetShell>
  );
}