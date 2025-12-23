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
import { useAutoReminders } from '@/hooks/useAutoReminders';

const Index = () => {
  // Initialize automatic reminders
  useAutoReminders();

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Greeting Section */}
        <GreetingHeader />
        
        {/* Quick Actions - Horizontal Scroll on Mobile */}
        <section className="slide-up" style={{ animationDelay: '100ms' }}>
          <QuickActions />
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Prayer & Finance */}
          <div className="lg:col-span-3 space-y-6">
            <section className="slide-up" style={{ animationDelay: '150ms' }}>
              <PrayerWidget />
            </section>
            <section className="slide-up" style={{ animationDelay: '200ms' }}>
              <FinanceSnapshot />
            </section>
          </div>

          {/* Center Column - Projects, Tasks & Habits */}
          <div className="lg:col-span-6 space-y-6">
            <section className="slide-up" style={{ animationDelay: '250ms' }}>
              <ProjectsOverview />
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="slide-up" style={{ animationDelay: '300ms' }}>
                <FocusTasks />
              </section>
              <section className="slide-up" style={{ animationDelay: '350ms' }}>
                <HabitStreaks />
              </section>
            </div>
            <section className="slide-up" style={{ animationDelay: '400ms' }}>
              <GoalProgress />
            </section>
          </div>

          {/* Right Column - Events */}
          <div className="lg:col-span-3">
            <section className="slide-up" style={{ animationDelay: '450ms' }}>
              <UpcomingEvents />
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
