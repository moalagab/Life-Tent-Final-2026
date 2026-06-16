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
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CommandCenter } from '@/components/command/CommandCenter';
import { DailyPlanningCycle } from '@/components/planning/DailyPlanningCycle';
import { useDailyPlanningCycle } from '@/hooks/useDailyPlanningCycle';
import { WeeklyReviewEngine } from '@/components/review/WeeklyReviewEngine';
import { useWeeklyReview } from '@/hooks/useWeeklyReview';
import { NaturalCapture } from '@/components/capture/NaturalCapture';
import { useIsMobile } from '@/hooks/use-mobile';
import { Activity, LayoutGrid, Sparkles, BookOpen, Wallet, Brain, Eye, Crosshair, Zap, Sun, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

/**
 * Dashboard — restructured for scannability with persisted section state and
 * user-selectable layout presets (Focus / Finance / Execution).
 */
const Index = () => {
  useAutoReminders();
  const { t, currentLanguage } = useLanguage();
  const isMobile   = useIsMobile();
  const context    = useContextAwareness();
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

  // Auto-open weekly review on Fridays (after planning if both apply)
  useEffect(() => {
    if (shouldShowReview && !shouldShowPlanning) {
      const timer = setTimeout(() => setReviewOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowReview, shouldShowPlanning]);

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

  const overview = useSectionState('overview', false);
  const activeWork = useSectionState('active-work', true);
  const rhythm = useSectionState('rhythm', false);
  const finance = useSectionState('finance', false);
  const library = useSectionState('library', false);
  const aiSection = useSectionState('ai-intelligence', false);

  const isAr = currentLanguage === 'ar';

  // ---- Section renderers ----
  const sectionOverview = (
    <section key="overview">
      <DashboardSection
        title={t('dashboard.overview')}
        icon={Sparkles}
        open={overview.open}
        onToggle={overview.toggle}
        summary={isAr ? 'صافي الثروة · الإنفاق الشهري · المهام اليوم' : 'Net Worth · Monthly Burn · Tasks Today'}
      >
        <KpiStrip />
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
        summary={isAr ? 'إحاطة الصباح · نقطة التحقق · رؤى السلوك' : 'Morning Brief · Midday Check · Behavior Insights'}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 items-start">
          <div className="lg:col-span-2 min-w-0"><MorningBrief /></div>
          <div className="space-y-3 lg:space-y-4 min-w-0">
            <MiddayCheckpoint />
            <BehaviorInsights />
          </div>
        </div>
      </DashboardSection>
    </section>
  );

  // ---- Preset arrangements ----
  const allSections = {
    overview:         sectionOverview,
    'active-work':    sectionActiveWork,
    rhythm:           sectionRhythm,
    finance:          sectionFinance,
    library:          sectionLibrary,
    'ai-intelligence': sectionAI,
  };

  // Apply context hiding (skip when user overrode)
  const hidden = (!context.isOverridden) ? new Set(context.hiddenSections) : new Set<string>();
  const visible = (key: keyof typeof allSections) => !hidden.has(key) ? allSections[key] : null;

  const arrangements: Record<DashboardPreset, (ReactNode | null)[]> = {
    focus:     [visible('ai-intelligence'), visible('rhythm'),      visible('active-work'), visible('overview'), visible('finance'), visible('library')],
    finance:   [visible('overview'),        visible('finance'),     visible('active-work'), visible('rhythm'),   visible('ai-intelligence'), visible('library')],
    execution: [visible('active-work'),     visible('overview'),    visible('rhythm'),      visible('finance'),  visible('ai-intelligence'), visible('library')],
  };

  // ── Morning focus-only mode ──────────────────────────────────────────────
  const isMorningFocus = context.focusOnlyMode && !context.isOverridden && !showFullInMorning;

  return (
    <MainLayout>
      {/* Ambient background tint — changes with context mode */}
      {context.accentScheme && (
        <div
          className={`fixed inset-0 -z-10 pointer-events-none bg-gradient-to-b ${context.accentScheme} to-transparent transition-all duration-1000`}
        />
      )}

      <div className="space-y-5 lg:space-y-8 pb-4 animate-fade-in">

        {/* ── Context-aware mode banner ── */}
        <ContextBanner context={context} />

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

        {/* ── Decision Engine — "شيء واحد فقط مهم الآن" ── */}
        <FocusEngine />

        {/* ── Quick Actions ── */}
        <QuickActions />

        {/* ── Natural Language Capture ── */}
        <NaturalCapture />

        {/* ── Planning + Review + Command Center triggers ── */}
        <div className="grid grid-cols-3 gap-2">
        {/* Daily planning trigger */}
        <button
          onClick={() => { openPlanningManually(); setPlanningOpen(true); }}
          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400/5 to-orange-400/5 hover:from-amber-400/10 hover:to-orange-400/10 transition-all group active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-400/15 border border-amber-400/25 flex items-center justify-center shrink-0">
              <Sun className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-start">
              <div className="text-xs font-black text-foreground/90 leading-tight">تخطيط اليوم</div>
              <div className="text-[9px] text-muted-foreground/50">مراجعة · خطة · تركيز</div>
            </div>
          </div>
          {shouldShowPlanning && (
            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          )}
        </button>

        {/* Weekly review trigger */}
        <button
          onClick={() => { openReviewManually(); setReviewOpen(true); }}
          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 hover:from-emerald-500/10 hover:to-teal-500/10 transition-all group active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <BarChart3 className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="text-start">
              <div className="text-xs font-black text-foreground/90 leading-tight">مراجعة الأسبوع</div>
              <div className="text-[9px] text-muted-foreground/50">إنجاز · تأخر · خطة</div>
            </div>
          </div>
          {shouldShowReview && (
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          )}
        </button>

        {/* Command Center trigger */}
        <button
          onClick={() => setCommandCenterOpen(true)}
          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/5 to-orange-500/5 hover:from-red-500/10 hover:to-orange-500/10 transition-all group active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
              <Crosshair className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-start">
              <div className="text-xs font-black text-foreground/90 leading-tight">مركز القيادة</div>
              <div className="text-[9px] text-muted-foreground/50">خطة اليوم · حذف الثانوي · إعادة الحساب</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {focusModeActive && (
              <div className="flex items-center gap-1 text-[9px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
                <Zap className="w-2.5 h-2.5" />
                تركيز
              </div>
            )}
            <Crosshair className="w-3.5 h-3.5 text-red-400/50 group-hover:text-red-400 transition-colors" />
          </div>
        </button>
        </div>{/* end grid */}

        {/* ── Focus mode active banner ── */}
        {focusModeActive && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-amber-400/25 bg-amber-400/5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-black text-amber-400">وضع التركيز نشط</span>
              <span className="text-[10px] text-muted-foreground/60 ms-2">— اللوحة مخفية، ركّز على مهمتك</span>
            </div>
            <button
              onClick={() => setFocusModeActive(false)}
              className="text-[10px] font-bold text-muted-foreground/60 hover:text-foreground transition-colors border border-border/40 rounded-lg px-2 py-1"
            >
              إيقاف
            </button>
          </div>
        )}

        {/* ── MORNING MODE: only show FocusEngine + button to expand ── */}
        {isMorningFocus ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              🌅 وضع الصباح — ركّز على شيء واحد فقط قبل أن تفتح لوحة التحكم
            </p>
            <button
              onClick={() => setShowFullInMorning(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-xl px-4 py-2 transition-colors hover:bg-muted/30"
            >
              <Eye className="w-3.5 h-3.5" />
              فتح لوحة التحكم الكاملة
            </button>
          </div>
        ) : focusModeActive ? null : (
          <>
            {/* ── Attention ribbon ── */}
            <AttentionStrip />

            {/* ── Daily Decision Card (AI-layer) ── */}
            <DailyDecisionCard />

            {/* ── Cognitive Load Control — curated tasks + projects ── */}
            <CognitiveDashboard contextMode={context.mode} />

            {/* ── Agent Layer — Task / Finance / Habit agents ── */}
            <AgentPanel />

            {/* ── Predictive Layer — forward-looking forecasts ── */}
            <PredictivePanel />

            {/* ── Operational Memory — what the system has learned ── */}
            <MemoryInsightsCard />

            {/* ── Mobile: preset switcher ── */}
            {isMobile && (
              <div className="flex items-center justify-end">
                <LayoutPresetSwitcher value={preset} onChange={setPreset} />
              </div>
            )}

            {/* ── Sections per preset (context-filtered) ── */}
            <div className="space-y-3">
              {arrangements[preset]}
            </div>

            {/* ── Show hidden sections indicator ── */}
            {!context.isOverridden && hidden.size > 0 && (
              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={context.override}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  {hidden.size === 1
                    ? `قسم واحد مخفي حسب السياق`
                    : `${hidden.size} أقسام مخفية حسب السياق`}
                  — اضغط لإظهارها
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* ── Weekly Review Engine ── */}
      <WeeklyReviewEngine
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
      />

      {/* ── Daily Planning Cycle wizard ── */}
      <DailyPlanningCycle
        open={planningOpen}
        onClose={() => setPlanningOpen(false)}
      />

      {/* ── Command Center overlay ── */}
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
