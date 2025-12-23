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

const Index = () => {
  useAutoReminders();
  const { currentLanguage } = useLanguage();

  return (
    <MainLayout>
      <div className="space-y-5 lg:space-y-6 animate-fade-in">
        {/* Greeting Section */}
        <GreetingHeader />
        
        {/* Quick Actions */}
        <section className="slide-up" style={{ animationDelay: '50ms' }}>
          <QuickActions />
        </section>

        {/* Main Dashboard Grid - Optimized Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 lg:gap-5">
          
          {/* Left Column - Prayer & Finance */}
          <div className="md:col-span-1 xl:col-span-3 space-y-4 lg:space-y-5">
            <section className="slide-up" style={{ animationDelay: '100ms' }}>
              <PrayerWidget />
            </section>
            <section className="slide-up" style={{ animationDelay: '150ms' }}>
              <FinanceSnapshot />
            </section>
          </div>

          {/* Center Column - Main Content */}
          <div className="md:col-span-1 xl:col-span-6 space-y-4 lg:space-y-5">
            {/* Projects - Full Width */}
            <section className="slide-up" style={{ animationDelay: '200ms' }}>
              <ProjectsOverview />
            </section>
            
            {/* Tasks & Habits Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
              <section className="slide-up" style={{ animationDelay: '250ms' }}>
                <FocusTasks />
              </section>
              <section className="slide-up" style={{ animationDelay: '300ms' }}>
                <HabitStreaks />
              </section>
            </div>
            
            {/* Goals & Knowledge Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
              <section className="slide-up" style={{ animationDelay: '350ms' }}>
                <GoalProgress />
              </section>
              <section className="slide-up" style={{ animationDelay: '400ms' }}>
                <KnowledgeWidget />
              </section>
            </div>
          </div>

          {/* Right Column - Events & Studio */}
          <div className="md:col-span-2 xl:col-span-3 space-y-4 lg:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 lg:gap-5">
              <section className="slide-up" style={{ animationDelay: '450ms' }}>
                <UpcomingEvents />
              </section>
              <section className="slide-up" style={{ animationDelay: '500ms' }}>
                <StudioWidget />
              </section>
            </div>
          </div>
        </div>

        {/* Footer Spacer */}
        <div className="h-2 lg:h-4" />
      </div>
    </MainLayout>
  );
};

export default Index;