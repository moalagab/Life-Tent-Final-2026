import { MainLayout } from '@/components/layout/MainLayout';
import { GreetingSlim } from '@/components/dashboard/GreetingSlim';
import { AttentionStrip } from '@/components/dashboard/AttentionStrip';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { SectionHeader } from '@/components/dashboard/SectionHeader';
import { ProjectsOverview } from '@/components/dashboard/ProjectsOverview';
import { FocusTasks } from '@/components/dashboard/FocusTasks';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { HabitStreaks } from '@/components/dashboard/HabitStreaks';
import { GoalProgress } from '@/components/dashboard/GoalProgress';
import { PrayerWidget } from '@/components/dashboard/PrayerWidget';
import { KnowledgeWidget } from '@/components/dashboard/KnowledgeWidget';
import { StudioWidget } from '@/components/dashboard/StudioWidget';
import { useAutoReminders } from '@/hooks/useAutoReminders';
import { useLanguage } from '@/hooks/useLanguage';
import { useSectionState } from '@/hooks/useSectionState';
import { Activity, LayoutGrid, Sparkles, BookOpen } from 'lucide-react';

/**
 * Dashboard — restructured for scannability with persisted section state.
 * RTL-aware grids: spacing tokens unify across LTR/RTL.
 */
const Index = () => {
  useAutoReminders();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const overview = useSectionState('overview', true);
  const activeWork = useSectionState('active-work', true);
  const rhythm = useSectionState('rhythm', true);
  const library = useSectionState('library', false);

  return (
    <MainLayout>
      <div className="space-y-6 lg:space-y-8 pb-10 animate-fade-in">
        {/* 1. Greeting */}
        <GreetingSlim />

        {/* 2. Attention */}
        <AttentionStrip />

        {/* 3. KPIs */}
        <section>
          <SectionHeader
            title={isAr ? 'نظرة عامة' : 'Overview'}
            icon={Sparkles}
            collapsible
            open={overview.open}
            onToggle={overview.toggle}
          />
          {overview.open && <KpiStrip />}
        </section>

        {/* 4. Active Work */}
        <section>
          <SectionHeader
            title={isAr ? 'العمل النشط' : 'Active Work'}
            icon={Activity}
            collapsible
            open={activeWork.open}
            onToggle={activeWork.toggle}
          />
          {activeWork.open && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 items-stretch">
                <div className="lg:col-span-2 min-w-0">
                  <ProjectsOverview />
                </div>
                <div className="min-w-0 space-y-3 lg:space-y-4">
                  <FocusTasks />
                </div>
              </div>
              <div className="mt-3 lg:mt-4">
                <UpcomingEvents />
              </div>
            </>
          )}
        </section>

        {/* 5. Today's Rhythm */}
        <section>
          <SectionHeader
            title={isAr ? 'إيقاع يومك' : 'Today\u2019s Rhythm'}
            icon={LayoutGrid}
            collapsible
            open={rhythm.open}
            onToggle={rhythm.toggle}
          />
          {rhythm.open && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 items-stretch">
              <div className="min-w-0"><PrayerWidget /></div>
              <div className="min-w-0"><HabitStreaks /></div>
              <div className="min-w-0 sm:col-span-2 lg:col-span-1"><GoalProgress /></div>
            </div>
          )}
        </section>

        {/* 6. Library */}
        <section>
          <SectionHeader
            title={isAr ? 'المكتبة والمعرفة' : 'Library & Knowledge'}
            icon={BookOpen}
            collapsible
            open={library.open}
            onToggle={library.toggle}
          />
          {library.open && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 animate-fade-in items-stretch">
              <div className="min-w-0"><KnowledgeWidget /></div>
              <div className="min-w-0"><StudioWidget /></div>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
