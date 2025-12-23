import { MainLayout } from '@/components/layout/MainLayout';
import { GreetingHeader } from '@/components/dashboard/GreetingHeader';
import { PrayerWidget } from '@/components/dashboard/PrayerWidget';
import { FinanceSnapshot } from '@/components/dashboard/FinanceSnapshot';
import { FocusTasks } from '@/components/dashboard/FocusTasks';
import { HabitStreaks } from '@/components/dashboard/HabitStreaks';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ProjectsOverview } from '@/components/dashboard/ProjectsOverview';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';

const Index = () => {
  return (
    <MainLayout>
      <GreetingHeader />
      
      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column - Prayer & Finance */}
        <div className="lg:col-span-3 space-y-6">
          <PrayerWidget />
          <FinanceSnapshot />
        </div>

        {/* Center Column - Tasks & Projects */}
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
    </MainLayout>
  );
};

export default Index;
