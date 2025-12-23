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
  // Initialize automatic reminders
  useAutoReminders();
  const { currentLanguage } = useLanguage();

  return (
    <MainLayout>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Greeting Section */}
        <GreetingHeader />
        
        {/* Quick Actions - Horizontal Scroll on Mobile */}
        <section className="slide-up" style={{ animationDelay: '100ms' }}>
          <QuickActions />
        </section>

        {/* Main Dashboard Grid - Improved Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Column - Prayer & Finance (Sticky on Desktop) */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            <section className="slide-up lg:sticky lg:top-4" style={{ animationDelay: '150ms' }}>
              <PrayerWidget />
            </section>
            <section className="slide-up" style={{ animationDelay: '200ms' }}>
              <FinanceSnapshot />
            </section>
          </div>

          {/* Center Column - Main Content */}
          <div className="lg:col-span-6 space-y-4 lg:space-y-6">
            {/* Projects - Full Width in Center */}
            <section className="slide-up" style={{ animationDelay: '250ms' }}>
              <ProjectsOverview />
            </section>
            
            {/* Tasks & Habits - Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <section className="slide-up" style={{ animationDelay: '300ms' }}>
                <FocusTasks />
              </section>
              <section className="slide-up" style={{ animationDelay: '350ms' }}>
                <HabitStreaks />
              </section>
            </div>
            
            {/* Goals & Knowledge - Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <section className="slide-up" style={{ animationDelay: '400ms' }}>
                <GoalProgress />
              </section>
              <section className="slide-up" style={{ animationDelay: '450ms' }}>
                <KnowledgeWidget />
              </section>
            </div>
          </div>

          {/* Right Column - Events & Studio */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            <section className="slide-up" style={{ animationDelay: '500ms' }}>
              <UpcomingEvents />
            </section>
            <section className="slide-up" style={{ animationDelay: '550ms' }}>
              <StudioWidget />
            </section>
          </div>
        </div>

        {/* Footer Spacer for Mobile */}
        <div className="h-4 lg:h-0" />
      </div>
    </MainLayout>
  );
};

export default Index;