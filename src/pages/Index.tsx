import { MainLayout } from '@/components/layout/MainLayout';
import { GreetingSlim } from '@/components/dashboard/GreetingSlim';
import { AttentionStrip } from '@/components/dashboard/AttentionStrip';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
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
import { FocusEngine } from '@/components/dashboard/FocusEngine';
import {
  LayoutPresetSwitcher,
  type DashboardPreset,
} from '@/components/dashboard/LayoutPresetSwitcher';
import { useAutoReminders } from '@/hooks/useAutoReminders';
import { useLanguage } from '@/hooks/useLanguage';
import { useSectionState } from '@/hooks/useSectionState';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useContextAwareness } from '@/hooks/useContextAwareness';
import { ContextBanner } from '@/components/context/ContextBanner';
import { CognitiveDashboard } from '@/components/cognitive/CognitiveDashboard';
import { AgentPanel } from '@/components/agents/AgentPanel';
import { PredictivePanel } from '@/components/predictions/PredictivePanel';
import { MemoryInsightsCard } from '@/components/memory/MemoryInsightsCard';
import { CommandCenter } from '@/components/command/CommandCenter';
import { DailyPlanningCycle } from '@/components/planning/DailyPlanningCycle';
import { useDailyPlanningCycle } from '@/hooks/useDailyPlanningCycle';
import { WeeklyReviewEngine } from '@/components/review/WeeklyReviewEngine';
import { useWeeklyReview } from '@/hooks/useWeeklyReview';
import { NaturalCapture }       from '@/components/capture/NaturalCapture';
import { SuccessLoopFeedback }  from '@/components/feedback/SuccessLoopFeedback';
import { SystemHealthCard }     from '@/components/health/SystemHealthCard';
import { EmptyStateIntelligence } from '@/components/empty/EmptyStateIntelligence';
import { WorkloadMeter }  from '@/components/layout/WorkloadMeter';
import { DayTimeline }    from '@/components/layout/DayTimeline';
import { V3Placeholder }  from '@/components/layout/V3Placeholder';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Activity, LayoutGrid, Sparkles, BookOpen, Wallet, Brain,
  Eye, Crosshair, Zap, Sun, BarChart3, Moon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Dashboard — evolved wireframe layout.
 * Mobile:  ritual-first: workload → plan card → morning brief → day timeline → bento → shutdown
 * Desktop: 3-column: context panel (capture + upcoming + v3) | center (existing sections)
 */
const Index = () => {
  useAutoReminders();
  const { t, currentLanguage, isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const context  = useContextAwareness();
  const [showFullInMorning, setShowFullInMorning] = useState(false);

  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  const [focusModeActive, setFocusModeActive] = usePersistedState<boolean>('cmd.focusMode', false);

  const [planningOpen, setPlanningOpen] = useState(false);
  const { shouldShow: shouldShowPlanning, openManually: openPlanningManually } = useDailyPlanningCycle();

  const [reviewOpen, setReviewOpen] = useState(false);
  const { shouldShow: shouldShowReview, openManually: openReviewManually } = useWeeklyReview();

  // Auto-open daily planning cycle on first morning visit
  useEffect(() => {
    if (shouldShowPlanning) {
      const timer = setTimeout(() => setPlanningOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [shouldShowPlanning]);

  // Auto-open weekly review on Fridays
  useEffect(() => {
    if (shouldShowReview && !shouldShowPlanning) {
      const timer = setTimeout(() => setReviewOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowReview, shouldShowPlanning]);

  const [preset, setPreset] = usePersistedState<DashboardPreset>('dashboard.preset', 'execution');

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
      const key = { focus: 'dashboard.presetFocus', finance: 'dashboard.presetFinance', execution: 'dashboard.presetExecution' }[next] as string;
      toast.success(`${t('dashboard.presetSwitched')}: ${t(key)}`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setPreset, t]);

  // Sections — overview + active-work open by default; AI section open by default
  const overview   = useSectionState('overview',         true);
  const activeWork = useSectionState('active-work',      true);
  const rhythm     = useSectionState('rhythm',           false);
  const finance    = useSectionState('finance',          false);
  const library    = useSectionState('library',          false);
  const aiSection  = useSectionState('ai-intelligence',  true);

  const isAr = currentLanguage === 'ar';
  const isShutdownTime = new Date().getHours() >= 18;

  // ── Section definitions ────────────────────────────────────────────────────

  const sectionOverview = (
    <section key="overview">
      <DashboardSection
        title={t('dashboard.overview')}
        icon={Sparkles}
        open={overview.open}
        onToggle={overview.toggle}
        summary={isAr ? 'صافي الثروة · الإنفاق الشهري · المهام اليوم' : 'Net Worth · Monthly Burn · Tasks Today'}
      >
        <>
          <KpiStrip />
          <SystemHealthCard />
        </>
      </DashboardSection>
    </section>
  );

  const sectionActiveWork = (
    <section key="active-work">
      <DashboardSection
        title={t('dashboard.activeWork')}
        icon={Activity}
        open={activeWork.open}
        onToggle={activeWork.toggle}
        summary={isAr ? 'المشاريع · المهام · الأحداث القادمة' : 'Projects · Tasks · Upcoming Events'}
      >
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 items-stretch">
            <div className="lg:col-span-2 min-w-0"><ProjectsOverview /></div>
            <div className="min-w-0 space-y-3 lg:space-y-4"><FocusTasks /></div>
          </div>
          <div className="mt-3 lg:mt-4"><UpcomingEvents /></div>
          <div className="mt-3 lg:mt-4"><CognitiveDashboard contextMode={context.mode} /></div>
        </>
      </DashboardSection>
    </section>
  );

  const sectionRhythm = (
    <section key="rhythm">
      <DashboardSection
        title={t('dashboard.rhythm')}
        icon={LayoutGrid}
        open={rhythm.open}
        onToggle={rhythm.toggle}
        summary={isAr ? 'الصلاة · العادات · الأهداف' : 'Prayer · Habits · Goals'}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 items-stretch">
          <div className="min-w-0"><PrayerWidget /></div>
          <div className="min-w-0"><HabitStreaks /></div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-1"><GoalProgress /></div>
        </div>
      </DashboardSection>
    </section>
  );

  const sectionFinance = (
    <section key="finance">
      <DashboardSection
        title={t('dashboard.financeSnapshot')}
        icon={Wallet}
        open={finance.open}
        onToggle={finance.toggle}
        summary={isAr ? 'الحسابات · الإيرادات · المصروفات' : 'Accounts · Income · Expenses'}
      >
        <FinanceSnapshot />
      </DashboardSection>
    </section>
  );

  const sectionLibrary = (
    <section key="library">
      <DashboardSection
        title={t('dashboard.libraryKnowledge')}
        icon={BookOpen}
        open={library.open}
        onToggle={library.toggle}
        summary={isAr ? 'المعرفة · الاستوديو الإبداعي' : 'Knowledge · Creative Studio'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 items-stretch">
          <div className="min-w-0"><KnowledgeWidget /></div>
          <div className="min-w-0"><StudioWidget /></div>
        </div>
      </DashboardSection>
    </section>
  );

  const sectionAI = (
    <section key="ai-intelligence">
      <DashboardSection
        title={isAr ? 'الذكاء الاصطناعي' : 'AI Intelligence'}
        icon={Brain}
        open={aiSection.open}
        onToggle={aiSection.toggle}
        summary={isAr ? 'إحاطة الصباح · نقطة التحقق · رؤى السلوك · التوقعات' : 'Morning Brief · Midday Check · Insights · Forecasts'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 items-start">
            <div className="lg:col-span-2 min-w-0"><MorningBrief /></div>
            <div className="space-y-3 lg:space-y-4 min-w-0">
              <MiddayCheckpoint />
              <BehaviorInsights />
            </div>
          </div>
          <DailyDecisionCard />
          <AgentPanel />
          <PredictivePanel />
          <MemoryInsightsCard />
        </div>
      </DashboardSection>
    </section>
  );

  // ── Preset arrangements ────────────────────────────────────────────────────

  const allSections = {
    overview:          sectionOverview,
    'active-work':     sectionActiveWork,
    rhythm:            sectionRhythm,
    finance:           sectionFinance,
    library:           sectionLibrary,
    'ai-intelligence': sectionAI,
  };

  const hidden = (!context.isOverridden) ? new Set(context.hiddenSections) : new Set<string>();
  const visible = (key: keyof typeof allSections) => !hidden.has(key) ? allSections[key] : null;

  const arrangements: Record<DashboardPreset, (ReactNode | null)[]> = {
    focus:     [visible('ai-intelligence'), visible('rhythm'),      visible('active-work'), visible('overview'), visible('finance'), visible('library')],
    finance:   [visible('overview'),        visible('finance'),     visible('active-work'), visible('rhythm'),   visible('ai-intelligence'), visible('library')],
    execution: [visible('active-work'),     visible('overview'),    visible('rhythm'),      visible('finance'),  visible('ai-intelligence'), visible('library')],
  };

  const isMorningFocus = context.focusOnlyMode && !context.isOverridden && !showFullInMorning;

  // ── Shared control strip ───────────────────────────────────────────────────
  const controlStrip = (
    <div className="flex items-center rounded-xl border border-border/40 bg-muted/20 overflow-hidden text-xs">
      <button
        onClick={() => { openPlanningManually(); setPlanningOpen(true); }}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 hover:bg-background/70 transition-colors"
      >
        <Sun className="w-3 h-3 text-amber-400 shrink-0" />
        <span className="font-semibold text-foreground/80">{isAr ? 'تخطيط اليوم' : 'Daily Plan'}</span>
        {shouldShowPlanning && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
      </button>
      <div className="w-px h-5 bg-border/60 shrink-0" />
      <button
        onClick={() => { openReviewManually(); setReviewOpen(true); }}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 hover:bg-background/70 transition-colors"
      >
        <BarChart3 className="w-3 h-3 text-emerald-500 shrink-0" />
        <span className="font-semibold text-foreground/80">{isAr ? 'مراجعة الأسبوع' : 'Weekly Review'}</span>
        {shouldShowReview && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
      </button>
      <div className="w-px h-5 bg-border/60 shrink-0" />
      <button
        onClick={() => setCommandCenterOpen(true)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 hover:bg-background/70 transition-colors"
        aria-label={isAr ? 'مركز القيادة — ⌘K' : 'Command Center — ⌘K'}
      >
        <Crosshair className="w-3 h-3 text-muted-foreground shrink-0" />
        <span className="font-semibold text-foreground/80">{isAr ? 'مركز القيادة' : 'Command'}</span>
        {focusModeActive && <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
      </button>
    </div>
  );

  // ── Main sections block (shared) ──────────────────────────────────────────
  const mainSections = isMorningFocus ? (
    <div className="flex flex-col items-center gap-3 py-6">
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        {isAr
          ? '🌅 وضع الصباح — ركّز على شيء واحد فقط قبل أن تفتح لوحة التحكم'
          : '🌅 Morning mode — focus on one thing before opening the dashboard'}
      </p>
      <button
        onClick={() => setShowFullInMorning(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-xl px-4 py-2 transition-colors hover:bg-muted/30"
      >
        <Eye className="w-3.5 h-3.5" />
        {isAr ? 'فتح لوحة التحكم الكاملة' : 'Open full dashboard'}
      </button>
    </div>
  ) : focusModeActive ? null : (
    <>
      <EmptyStateIntelligence />
      <AttentionStrip />
      {isMobile && (
        <div className="flex items-center justify-end">
          <LayoutPresetSwitcher value={preset} onChange={setPreset} />
        </div>
      )}
      <div className="space-y-3">
        {arrangements[preset]}
      </div>
      {!context.isOverridden && hidden.size > 0 && (
        <div className="flex items-center justify-center pt-2">
          <button
            onClick={context.override}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <Eye className="w-3 h-3" />
            {hidden.size === 1
              ? (isAr ? 'قسم واحد مخفي حسب السياق' : '1 section hidden by context')
              : (isAr ? `${hidden.size} أقسام مخفية حسب السياق` : `${hidden.size} sections hidden`)}
            {isAr ? ' — اضغط لإظهارها' : ' — tap to show'}
          </button>
        </div>
      )}
    </>
  );

  return (
    <MainLayout>
      {/* Ambient background tint */}
      {context.accentScheme && (
        <div
          className={`fixed inset-0 -z-10 pointer-events-none bg-gradient-to-b ${context.accentScheme} to-transparent transition-all duration-1000`}
        />
      )}

      <div className="space-y-4 lg:space-y-5 pb-4 animate-fade-in">

        {/* Context-aware banner */}
        <ContextBanner context={context} />

        {/* Desktop greeting + preset switcher */}
        {!isMobile && (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
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

        {/* Focus mode active banner */}
        {focusModeActive && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-amber-400/25 bg-amber-400/5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-black text-amber-400">{isAr ? 'وضع التركيز نشط' : 'Focus mode on'}</span>
              <span className="text-[10px] text-muted-foreground/60 ms-2">
                {isAr ? '— اللوحة مخفية، ركّز على مهمتك' : '— dashboard hidden, stay focused'}
              </span>
            </div>
            <button
              onClick={() => setFocusModeActive(false)}
              className="text-[10px] font-bold text-muted-foreground/60 hover:text-foreground transition-colors border border-border/40 rounded-lg px-2 py-1"
            >
              {isAr ? 'إيقاف' : 'Exit'}
            </button>
          </div>
        )}

        {/* ── MOBILE: ritual-first layout ── */}
        {isMobile && (
          <div className="space-y-3">
            {/* Workload meter */}
            <div className="glass-card px-4 py-3">
              <WorkloadMeter />
            </div>

            {/* Plan Your Day card */}
            <button
              onClick={() => { openPlanningManually(); setPlanningOpen(true); }}
              className="w-full flex items-center gap-3 p-4 glass-card rounded-2xl border border-primary/10 active:scale-[0.98] transition-transform text-start"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t('layout.planYourDay')}</p>
                <p className="text-xs text-muted-foreground">{t('layout.autoplan')}</p>
              </div>
              {shouldShowPlanning && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
            </button>

            {/* Morning brief */}
            <MorningBrief />

            {/* Day timeline preview */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{t('layout.dayTimeline')}</h3>
                <button
                  onClick={() => { openPlanningManually(); setPlanningOpen(true); }}
                  className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                >
                  {t('layout.autoplan')}
                </button>
              </div>
              <DayTimeline />
            </div>

            {/* Hero engine */}
            <FocusEngine />

            {/* Control strip */}
            {controlStrip}
          </div>
        )}

        {/* ── DESKTOP: 3-column layout ── */}
        {!isMobile && (
          <div className={cn(
            'flex gap-5 items-start',
            isRTL ? 'flex-row-reverse' : 'flex-row',
          )}>
            {/* Center column — main content */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Workload meter */}
              <div className="glass-card px-4 py-3">
                <WorkloadMeter />
              </div>

              {/* Day timeline */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">{t('layout.dayTimeline')}</h3>
                <DayTimeline />
              </div>

              {/* Hero: Decision Engine */}
              <FocusEngine />

              {/* Control strip */}
              {controlStrip}

              {/* Main sections */}
              {mainSections}
            </div>

            {/* Context panel — right (LTR) / left (RTL) */}
            <div className="w-72 shrink-0 space-y-3 sticky top-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1">
                {t('layout.contextPanel')}
              </h3>
              <NaturalCapture />
              <UpcomingEvents />
              <V3Placeholder />
            </div>
          </div>
        )}

        {/* ── MOBILE: main sections + shutdown ritual ── */}
        {isMobile && (
          <div className="space-y-3">
            {mainSections}

            {/* Shutdown ritual card — visible after 6pm */}
            {isShutdownTime && !focusModeActive && (
              <button
                onClick={() => { openReviewManually(); setReviewOpen(true); }}
                className="w-full flex items-center gap-3 p-4 glass-card rounded-2xl border border-violet-500/20 active:scale-[0.98] transition-transform text-start"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Moon className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t('layout.shutdownRitual')}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? 'مراجعة نهاية اليوم' : 'End-of-day review'}</p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      <WeeklyReviewEngine open={reviewOpen} onClose={() => setReviewOpen(false)} />
      <DailyPlanningCycle open={planningOpen} onClose={() => setPlanningOpen(false)} />
      <SuccessLoopFeedback />
      <CommandCenter
        open={commandCenterOpen}
        onClose={() => setCommandCenterOpen(false)}
        focusModeActive={focusModeActive}
        onToggleFocusMode={() => setFocusModeActive(v => !v)}
      />
    </MainLayout>
  );
};

export default Index;
