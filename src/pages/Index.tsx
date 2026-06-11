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
import { MorningBrief } from '@/components/dashboard/MorningBrief';
import { MiddayCheckpoint } from '@/components/dashboard/MiddayCheckpoint';
import { BehaviorInsights } from '@/components/dashboard/BehaviorInsights';
import { DailyDecisionCard } from '@/components/dashboard/DailyDecisionCard';
import {
  LayoutPresetSwitcher,
  type DashboardPreset,
} from '@/components/dashboard/LayoutPresetSwitcher';
import { useAutoReminders } from '@/hooks/useAutoReminders';
import { useLanguage } from '@/hooks/useLanguage';
import { useSectionState } from '@/hooks/useSectionState';
import { usePersistedState } from '@/hooks/usePersistedState';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { Activity, LayoutGrid, Sparkles, BookOpen, Wallet, Brain } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

/**
 * Dashboard — restructured for scannability with persisted section state and
 * user-selectable layout presets (Focus / Finance / Execution).
 */
const Index = () => {
  useAutoReminders();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

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
      const presetKey = { focus: 'dashboard.presetFocus', finance: 'dashboard.presetFinance', execution: 'dashboard.presetExecution' }[next] as string;
      toast.success(`${t('dashboard.presetSwitched')}: ${t(presetKey)}`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setPreset, t]);

  const overview = useSectionState('overview', true);
  const activeWork = useSectionState('active-work', true);
  const rhythm = useSectionState('rhythm', true);
  const finance = useSectionState('finance', true);
  const library = useSectionState('library', false);
  const aiSection = useSectionState('ai-intelligence', true);

  // ---- Section renderers ----
  const sectionOverview = (
    <section key="overview">
      <SectionHeader
        title={t('dashboard.overview')}
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
        title={t('dashboard.activeWork')}
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
        title={t('dashboard.rhythm')}
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
        title={t('dashboard.financeSnapshot')}
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
        title={t('dashboard.libraryKnowledge')}
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

  const sectionAI = (
    <section key="ai-intelligence">
      <SectionHeader
        title="الذكاء الاصطناعي"
        icon={Brain}
        collapsible
        open={aiSection.open}
        onToggle={aiSection.toggle}
      />
      {aiSection.open && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 items-start">
          {/* Morning brief spans 2 cols */}
          <div className="lg:col-span-2 min-w-0">
            <MorningBrief />
          </div>
          {/* Right column: midday + behavior */}
          <div className="space-y-3 lg:space-y-4 min-w-0">
            <MiddayCheckpoint />
            <BehaviorInsights />
          </div>
        </div>
      )}
    </section>
  );

  // ---- Preset arrangements ----
  const arrangements: Record<DashboardPreset, ReactNode[]> = {
    focus: [sectionAI, sectionRhythm, sectionActiveWork, sectionOverview, sectionFinance, sectionLibrary],
    finance: [sectionOverview, sectionFinance, sectionActiveWork, sectionRhythm, sectionAI, sectionLibrary],
    execution: [sectionAI, sectionOverview, sectionActiveWork, sectionRhythm, sectionFinance, sectionLibrary],
  };

  return (
    <MainLayout>
      <div className="space-y-5 lg:space-y-8 pb-4 animate-fade-in">

        {/* ── Desktop only: greeting + preset switcher ── */}
        {!isMobile && (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3 lg:gap-4">
            <GreetingSlim />
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60">
                <kbd className="px-1.5 py-0.5 rounded border border-border/50 bg-muted/30">Alt</kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-border/50 bg-muted/30">1·2·3</kbd>
              </span>
              <LayoutPresetSwitcher value={preset} onChange={setPreset} />
            </div>
          </div>
        )}

        {/* ── Quick Actions (mobile: horizontal pills, desktop: cards grid) ── */}
        <QuickActions />

        {/* ── Attention ribbon ── */}
        <AttentionStrip />

        {/* ── Daily Decision Card ── */}
        <DailyDecisionCard />

        {/* ── Mobile: preset switcher below the card ── */}
        {isMobile && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t('dashboard.layout') || 'التخطيط'}
            </span>
            <LayoutPresetSwitcher value={preset} onChange={setPreset} />
          </div>
        )}

        {/* ── Sections per preset ── */}
        <div className="space-y-5 lg:space-y-8">
          {arrangements[preset]}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
