import { MainLayout } from '@/components/layout/MainLayout';
import { GreetingHeader } from '@/components/dashboard/GreetingHeader';
import { PrayerWidget } from '@/components/dashboard/PrayerWidget';
import { FinanceSnapshot } from '@/components/dashboard/FinanceSnapshot';
import { FocusTasks } from '@/components/dashboard/FocusTasks';
import { HabitStreaks } from '@/components/dashboard/HabitStreaks';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ProjectsOverview } from '@/components/dashboard/ProjectsOverview';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { useAutoReminders } from '@/hooks/useAutoReminders';

const Index = () => {
  // Initialize automatic reminders
  useAutoReminders();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Greeting Section */}
        <GreetingHeader />
        
        {/* Quick Actions */}
        <QuickActions />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Prayer & Finance */}
          <div className="lg:col-span-3 space-y-6">
            <PrayerWidget />
            <FinanceSnapshot />
          </div>

          {/* Center Column - Projects, Tasks & Habits */}
          <div className="lg:col-span-6 space-y-6">
            <ProjectsOverview />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FocusTasks />
              <HabitStreaks />
            </div>
          </div>

          {/* Right Column - Events */}
          <div className="lg:col-span-3">
            <UpcomingEvents />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
