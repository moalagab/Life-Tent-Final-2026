import { MainLayout } from '@/components/layout/MainLayout';
import { GreetingHeader } from '@/components/dashboard/GreetingHeader';
import { PrayerWidget } from '@/components/dashboard/PrayerWidget';
import { FinanceSnapshot } from '@/components/dashboard/FinanceSnapshot';
import { FocusTasks } from '@/components/dashboard/FocusTasks';
import { HabitStreaks } from '@/components/dashboard/HabitStreaks';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ProjectsOverview } from '@/components/dashboard/ProjectsOverview';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { GoalProgress } from '@/components/dashboard/GoalProgress';
import { KnowledgeWidget } from '@/components/dashboard/KnowledgeWidget';
import { StudioWidget } from '@/components/dashboard/StudioWidget';
import { useAutoReminders } from '@/hooks/useAutoReminders';
import { useLanguage } from '@/hooks/useLanguage';
import { Sparkles, LayoutGrid, Zap } from 'lucide-react';

const Index = () => {
  useAutoReminders();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in pb-8">
        {/* Hero / Greeting */}
        <section className="slide-up">
          <GreetingHeader />
        </section>

        {/* Quick Actions — Command Bar Style */}
        <section className="slide-up" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
            </h2>
          </div>
          <QuickActions />
        </section>

        {/* Section: Today at a Glance */}
        <section className="slide-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              {isAr ? 'يومك في لمحة' : 'Today at a Glance'}
            </h2>
          </div>

          {/* Bento Grid — 12-col responsive */}
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-5 auto-rows-min">
            {/* Prayer — tall feature cell */}
            <div className="md:col-span-3 lg:col-span-4 lg:row-span-2 slide-up" style={{ animationDelay: '160ms' }}>
              <PrayerWidget />
            </div>

            {/* Finance — wide cell */}
            <div className="md:col-span-3 lg:col-span-4 slide-up" style={{ animationDelay: '200ms' }}>
              <FinanceSnapshot />
            </div>

            {/* Upcoming Events */}
            <div className="md:col-span-3 lg:col-span-4 slide-up" style={{ animationDelay: '240ms' }}>
              <UpcomingEvents />
            </div>

            {/* Focus Tasks */}
            <div className="md:col-span-3 lg:col-span-4 slide-up" style={{ animationDelay: '280ms' }}>
              <FocusTasks />
            </div>

            {/* Habits */}
            <div className="md:col-span-3 lg:col-span-4 slide-up" style={{ animationDelay: '320ms' }}>
              <HabitStreaks />
            </div>
          </div>
        </section>

        {/* Section: Strategic Pillars */}
        <section className="slide-up" style={{ animationDelay: '360ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              {isAr ? 'الركائز الاستراتيجية' : 'Strategic Pillars'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-5">
            {/* Projects — hero wide */}
            <div className="md:col-span-6 lg:col-span-8 slide-up" style={{ animationDelay: '400ms' }}>
              <ProjectsOverview />
            </div>

            {/* Goals */}
            <div className="md:col-span-3 lg:col-span-4 slide-up" style={{ animationDelay: '440ms' }}>
              <GoalProgress />
            </div>

            {/* Knowledge */}
            <div className="md:col-span-3 lg:col-span-6 slide-up" style={{ animationDelay: '480ms' }}>
              <KnowledgeWidget />
            </div>

            {/* Studio */}
            <div className="md:col-span-6 lg:col-span-6 slide-up" style={{ animationDelay: '520ms' }}>
              <StudioWidget />
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
