import { useState } from 'react';
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
import { Activity, LayoutGrid, Sparkles } from 'lucide-react';

/**
 * Dashboard — restructured for scannability.
 *
 * Hierarchy (top → bottom):
 *  1. GreetingSlim   — light context, no decoration
 *  2. AttentionStrip — "what needs me NOW" (auto-derived; hides if empty)
 *  3. KpiStrip       — 4 numbers across; replaces 3 snapshot cards
 *  4. Active Work    — Projects (lead), Tasks, Events  (the operational core)
 *  5. Today's Rhythm — Prayer, Habits, Goals (steady, secondary)
 *  6. Library        — Knowledge + Studio  (collapsible, lowest priority)
 *
 * No new colors. Pure structure / spacing / sizing changes.
 */
const Index = () => {
  useAutoReminders();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-8 pb-10 animate-fade-in">
        {/* 1. Greeting */}
        <GreetingSlim />

        {/* 2. Attention — only shows if there is something to act on */}
        <AttentionStrip />

        {/* 3. KPIs */}
        <section>
          <SectionHeader
            title={isAr ? 'نظرة عامة' : 'Overview'}
            icon={Sparkles}
          />
          <KpiStrip />
        </section>

        {/* 4. Active Work */}
        <section>
          <SectionHeader
            title={isAr ? 'العمل النشط' : 'Active Work'}
            icon={Activity}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Projects — lead, takes 2 cols on desktop */}
            <div className="lg:col-span-2">
              <ProjectsOverview />
            </div>
            <div className="space-y-4">
              <FocusTasks />
            </div>
          </div>

          {/* Events — full width below */}
          <div className="mt-4">
            <UpcomingEvents />
          </div>
        </section>

        {/* 5. Today's Rhythm */}
        <section>
          <SectionHeader
            title={isAr ? 'إيقاع يومك' : 'Today\u2019s Rhythm'}
            icon={LayoutGrid}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PrayerWidget />
            <HabitStreaks />
            <GoalProgress />
          </div>
        </section>

        {/* 6. Library — collapsed by default, opt-in */}
        <section>
          <SectionHeader
            title={isAr ? 'المكتبة والمعرفة' : 'Library & Knowledge'}
            collapsible
            open={libraryOpen}
            onToggle={() => setLibraryOpen((v) => !v)}
          />
          {libraryOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <KnowledgeWidget />
              <StudioWidget />
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
