import { MainLayout } from '@/components/layout/MainLayout';
import { GreetingSlim } from '@/components/dashboard/GreetingSlim';
import { AttentionStrip } from '@/components/dashboard/AttentionStrip';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ProjectsOverview } from '@/components/dashboard/ProjectsOverview';
import { FocusTasks } from '@/components/dashboard/FocusTasks';
import { HabitStreaks } from '@/components/dashboard/HabitStreaks';
import { GoalProgress } from '@/components/dashboard/GoalProgress';
import { BehaviorInsights } from '@/components/dashboard/BehaviorInsights';
import { SystemHealthCard } from '@/components/health/SystemHealthCard';
import { DayTimeline } from '@/components/layout/DayTimeline';
import { CommandCenter } from '@/components/command/CommandCenter';
import { DailyPlanningCycle } from '@/components/planning/DailyPlanningCycle';
import { useDailyPlanningCycle } from '@/hooks/useDailyPlanningCycle';
import { WeeklyReviewEngine } from '@/components/review/WeeklyReviewEngine';
import { useWeeklyReview } from '@/hooks/useWeeklyReview';
import { SuccessLoopFeedback } from '@/components/feedback/SuccessLoopFeedback';
import { useAutoReminders } from '@/hooks/useAutoReminders';
import { useLanguage } from '@/hooks/useLanguage';
import { useSectionState } from '@/hooks/useSectionState';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  Sun, BarChart3, Crosshair, Zap,
  ListChecks, Activity, FolderKanban, Sparkles, Brain, HeartPulse,
} from 'lucide-react';
import { AICoachPanel } from '@/components/ai/AICoachPanel';
import { useEffect, useState } from 'react';

const Index = () => {
  useAutoReminders();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  /* ── modals ── */
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  const [focusModeActive, setFocusModeActive] = usePersistedState<boolean>('cmd.focusMode', false);
  const [planningOpen,    setPlanningOpen]    = useState(false);
  const [reviewOpen,      setReviewOpen]      = useState(false);

  const { shouldShow: shouldShowPlanning, openManually: openPlanningManually } = useDailyPlanningCycle();
  const { shouldShow: shouldShowReview,   openManually: openReviewManually   } = useWeeklyReview();

  /* Auto-open planning in the morning */
  useEffect(() => {
    if (!shouldShowPlanning) return;
    const t = setTimeout(() => setPlanningOpen(true), 1200);
    return () => clearTimeout(t);
  }, [shouldShowPlanning]);

  /* Auto-open weekly review on Fridays */
  useEffect(() => {
    if (!shouldShowReview || shouldShowPlanning) return;
    const t = setTimeout(() => setReviewOpen(true), 2000);
    return () => clearTimeout(t);
  }, [shouldShowReview, shouldShowPlanning]);

  /* ── section states — first 4 open by default, rest closed ── */
  const secTasks    = useSectionState('tasks-pending', true);
  const secRhythm   = useSectionState('daily-rhythm',  true);
  const secWork     = useSectionState('active-work',   true);
  const secOverview = useSectionState('overview',      false);
  const secAICoach  = useSectionState('ai-coach',      false);
  const secBehavior = useSectionState('behavior',      false);
  const secHealth   = useSectionState('sys-health',    false);

  /* ── control strip ── */
  const controlStrip = (
    <div className="flex items-center rounded-xl border border-border/40 bg-muted/20 overflow-hidden text-xs">
      <button
        onClick={() => { openPlanningManually(); setPlanningOpen(true); }}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 hover:bg-background/70 transition-colors"
      >
        <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-semibold text-foreground/80 truncate">
          {isAr ? 'تخطيط اليوم' : 'Daily Plan'}
        </span>
        {shouldShowPlanning && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
      </button>

      <div className="w-px h-6 bg-border/60 shrink-0" />

      <button
        onClick={() => { openReviewManually(); setReviewOpen(true); }}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 hover:bg-background/70 transition-colors"
      >
        <BarChart3 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="font-semibold text-foreground/80 truncate">
          {isAr ? 'مراجعة الأسبوع' : 'Weekly Review'}
        </span>
        {shouldShowReview && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
      </button>

      <div className="w-px h-6 bg-border/60 shrink-0" />

      <button
        onClick={() => setCommandCenterOpen(true)}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 hover:bg-background/70 transition-colors"
      >
        <Crosshair className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="font-semibold text-foreground/80 truncate">
          {isAr ? 'مركز القيادة' : 'Command'}
        </span>
        {focusModeActive && <Zap className="w-3 h-3 text-amber-400 shrink-0" />}
      </button>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-3 pb-6 animate-fade-in">

        {/* Greeting */}
        <GreetingSlim />

        {/* ① تخطيط اليوم — مراجعة الأسبوع — مركز القيادة */}
        {controlStrip}

        {/* ② المهام المعلقة */}
        <DashboardSection
          title={isAr ? 'المهام المعلقة' : 'Pending Tasks'}
          icon={ListChecks}
          open={secTasks.open}
          onToggle={secTasks.toggle}
          summary={isAr ? 'المتأخرة · اليوم · القادمة' : 'Overdue · Today · Upcoming'}
        >
          <div className="space-y-3">
            <AttentionStrip />
            <FocusTasks />
          </div>
        </DashboardSection>

        {/* ③ جدول اليوم — has its own collapsible header */}
        <DayTimeline />

        {/* ④ إيقاع يومك */}
        <DashboardSection
          title={isAr ? 'إيقاع يومك' : 'Daily Rhythm'}
          icon={Activity}
          open={secRhythm.open}
          onToggle={secRhythm.toggle}
          summary={isAr ? 'العادات اليومية · تقدم الأهداف' : 'Habits · Goal Progress'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 items-start">
            <HabitStreaks />
            <GoalProgress />
          </div>
        </DashboardSection>

        {/* ⑤ العمل النشط */}
        <DashboardSection
          title={isAr ? 'العمل النشط' : 'Active Work'}
          icon={FolderKanban}
          open={secWork.open}
          onToggle={secWork.toggle}
          summary={isAr ? 'المشاريع الجارية والمهام المرتبطة' : 'Ongoing projects & linked tasks'}
        >
          <ProjectsOverview />
        </DashboardSection>

        {/* ⑥ نظرة عامة — closed by default */}
        <DashboardSection
          title={isAr ? 'نظرة عامة' : 'Overview'}
          icon={Sparkles}
          open={secOverview.open}
          onToggle={secOverview.toggle}
          summary={isAr ? 'المؤشرات الرئيسية' : 'KPIs'}
        >
          <KpiStrip />
        </DashboardSection>

        {/* ⑦ مساعدك الشخصي AI */}
        <DashboardSection
          title={isAr ? 'مساعدك الشخصي' : 'AI Coach'}
          icon={Sparkles}
          open={secAICoach.open}
          onToggle={secAICoach.toggle}
          summary={isAr ? 'ملخص يومي · محادثة ذكية' : 'Daily briefing · Smart chat'}
        >
          <AICoachPanel />
        </DashboardSection>

        {/* ⑧ تحليل السلوك — closed by default */}
        <DashboardSection
          title={isAr ? 'تحليل السلوك' : 'Behavior Analysis'}
          icon={Brain}
          open={secBehavior.open}
          onToggle={secBehavior.toggle}
          summary={isAr ? 'أنماط العمل · رؤى ذكية' : 'Work patterns · Smart insights'}
        >
          <BehaviorInsights />
        </DashboardSection>

        {/* ⑧ صحة النظام — last, closed by default */}
        <DashboardSection
          title={isAr ? 'صحة النظام' : 'System Health'}
          icon={HeartPulse}
          open={secHealth.open}
          onToggle={secHealth.toggle}
          summary={isAr ? 'حالة قاعدة البيانات والخدمات' : 'Database & services status'}
        >
          <SystemHealthCard />
        </DashboardSection>

      </div>

      {/* ── Modals (preserved) ── */}
      <WeeklyReviewEngine open={reviewOpen}    onClose={() => setReviewOpen(false)} />
      <DailyPlanningCycle open={planningOpen}  onClose={() => setPlanningOpen(false)} />
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
