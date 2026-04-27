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
import { FinanceSnapshot } from '@/components/dashboard/FinanceSnapshot';
import {
  LayoutPresetSwitcher,
  type DashboardPreset,
} from '@/components/dashboard/LayoutPresetSwitcher';
import { useAutoReminders } from '@/hooks/useAutoReminders';
import { useLanguage } from '@/hooks/useLanguage';
import { useSectionState } from '@/hooks/useSectionState';
import { usePersistedState } from '@/hooks/usePersistedState';
import { Activity, LayoutGrid, Sparkles, BookOpen, Wallet } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

/**
 * Dashboard — restructured for scannability with persisted section state and
 * user-selectable layout presets (Focus / Finance / Execution).
 */
const Index = () => {
  useAutoReminders();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const [preset, setPreset] = usePersistedState<DashboardPreset>(
    'dashboard.preset',
    'execution'
  );

  // Keyboard shortcuts: Alt+1 Focus, Alt+2 Finance, Alt+3 Execution
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const map: Record<string, DashboardPreset> = { '1': 'focus', '2': 'finance', '3': 'execution' };
      const next = map[e.key];
      if (!next) return;
      e.preventDefault();
      setPreset(next);
      const labelAr = { focus: 'تركيز', finance: 'مالية', execution: 'تنفيذ' }[next];
      const labelEn = { focus: 'Focus', finance: 'Finance', execution: 'Execution' }[next];
      toast.success(isAr ? `تم التبديل إلى ${labelAr}` : `Switched to ${labelEn}`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setPreset, isAr]);

  const overview = useSectionState('overview', true);
  const activeWork = useSectionState('active-work', true);
  const rhythm = useSectionState('rhythm', true);
  const finance = useSectionState('finance', true);
  const library = useSectionState('library', false);

  // ---- Section renderers ----
  const sectionOverview = (
    <section key="overview">
      <SectionHeader
        title={isAr ? 'نظرة عامة' : 'Overview'}
        icon={Sparkles}
        collapsible
        open={overview.open}
        onToggle={overview.toggle}
      />
      {overview.open && <KpiStrip />}
    </section>
  );

  const sectionActiveWork = (
    <section key="active-work">
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
  );

  const sectionRhythm = (
    <section key="rhythm">
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
  );

  const sectionFinance = (
    <section key="finance">
      <SectionHeader
        title={isAr ? 'لمحة مالية' : 'Finance Snapshot'}
        icon={Wallet}
        collapsible
        open={finance.open}
        onToggle={finance.toggle}
      />
      {finance.open && (
        <div className="grid grid-cols-1 gap-3 lg:gap-4">
          <FinanceSnapshot />
        </div>
      )}
    </section>
  );

  const sectionLibrary = (
    <section key="library">
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
  );

  // ---- Preset arrangements ----
  const arrangements: Record<DashboardPreset, ReactNode[]> = {
    focus: [sectionRhythm, sectionActiveWork, sectionOverview, sectionFinance, sectionLibrary],
    finance: [sectionOverview, sectionFinance, sectionActiveWork, sectionRhythm, sectionLibrary],
    execution: [sectionOverview, sectionActiveWork, sectionRhythm, sectionFinance, sectionLibrary],
  };

  return (
    <MainLayout>
      <div className="space-y-6 lg:space-y-8 pb-10 animate-fade-in">
        {/* 1. Greeting */}
        <GreetingSlim />

        {/* 2. Attention */}
        <AttentionStrip />

        {/* 3. Layout preset switcher */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>
              {isAr ? 'بدّل ترتيب لوحة التحكم بحسب تركيز يومك' : 'Switch dashboard arrangement to match your focus'}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/70">
              <kbd className="px-1.5 py-0.5 rounded border border-border/60 bg-background">Alt</kbd>+
              <kbd className="px-1.5 py-0.5 rounded border border-border/60 bg-background">1</kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-border/60 bg-background">2</kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-border/60 bg-background">3</kbd>
            </span>
          </p>
          <LayoutPresetSwitcher value={preset} onChange={setPreset} />
        </div>

        {/* 4. Sections per preset */}
        {arrangements[preset]}
      </div>
    </MainLayout>
  );
};

export default Index;
