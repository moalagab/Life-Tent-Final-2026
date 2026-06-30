/**
 * usePredictiveEngine — Forward-looking behavioral prediction engine.
 *
 * Analyses historical patterns + current state to generate probabilistic
 * forecasts. Each prediction carries a confidence score (0-100) built
 * from multiple independent signals — more signals = higher confidence.
 *
 * Prediction types:
 *   task_delay       — A specific task will miss its due date
 *   project_abandon  — A project is drifting toward abandonment
 *   pressure_spike   — Task pressure will surge tomorrow or this week
 *   habit_break      — A habit streak is about to break today
 *   overload_risk    — Converging deadlines will cause overload
 *   energy_drop      — Low-energy period predicted based on patterns
 */
import { useMemo } from 'react';
import {
  differenceInDays, parseISO, addDays, format,
  getDay, isWeekend, isTomorrow, isThisWeek,
} from 'date-fns';
import { useTasks }                 from './useTasks';
import { useProjects }              from './useProjects';
import { useBehaviorEngine }        from './useBehaviorEngine';
import { useHabitsWithLogs }        from './useHabits';
import { useOperationalMemory }     from './useOperationalMemory';

// ── Types ──────────────────────────────────────────────────────────────────────

export type PredictionType =
  | 'task_delay'
  | 'project_abandon'
  | 'pressure_spike'
  | 'habit_break'
  | 'overload_risk'
  | 'energy_drop';

export type PredictionTimeframe =
  | 'today'
  | 'tomorrow'
  | 'this_week'
  | 'next_week';

export type PredictionSeverity = 'critical' | 'warning' | 'info';

export interface Prediction {
  id:            string;
  type:          PredictionType;
  severity:      PredictionSeverity;
  confidence:    number;          // 0-100
  title:         string;
  summary:       string;          // 1-line reason
  reasons:       string[];        // bullet list explaining signals
  timeframe:     PredictionTimeframe;
  entityId?:     string;
  entityType?:   'task' | 'project' | 'habit';
  entityName?:   string;
  preventable:   boolean;
  actionLabel?:  string;
  actionRoute?:  string;
}

export interface PredictiveReport {
  predictions:   Prediction[];
  riskScore:     number;          // 0-100 overall near-future risk
  riskLabel:     string;
  mostUrgent:    Prediction | null;
  isLoading:     boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Confidence score: sum of weighted signals, capped at 95 */
function buildConfidence(signals: Array<{ weight: number; active: boolean }>): number {
  const total = signals.reduce((s, sig) => s + (sig.active ? sig.weight : 0), 0);
  return clamp(Math.round(total), 5, 95);
}

function timeframeLabel(tf: PredictionTimeframe): string {
  const map: Record<PredictionTimeframe, string> = {
    today:     'اليوم',
    tomorrow:  'غداً',
    this_week: 'هذا الأسبوع',
    next_week: 'الأسبوع القادم',
  };
  return map[tf];
}

const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// ── Prediction builders ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function predictTaskDelays(
  tasks: any[],
  procScore: number,
  stalledIds: string[],
): Prediction[] {
  const today     = format(new Date(), 'yyyy-MM-dd');
  const in3Days   = format(addDays(new Date(), 3), 'yyyy-MM-dd');
  const in7Days   = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const atRisk = tasks.filter(t =>
    t.status !== 'done' &&
    !t.archived_at &&
    t.due_date &&
    t.due_date >= today &&
    t.due_date <= in7Days,
  );

  return atRisk.map(t => {
    const daysLeft  = differenceInDays(parseISO(t.due_date), new Date());
    const isStalled = stalledIds.includes(t.id);
    const notStarted = t.status === 'backlog' || t.status === 'todo';
    const highProc   = procScore > 60;
    const veryClose  = daysLeft <= 1;
    const close      = daysLeft <= 3;

    const confidence = buildConfidence([
      { weight: 35, active: veryClose },
      { weight: 20, active: close && !veryClose },
      { weight: 25, active: notStarted && close },
      { weight: 20, active: isStalled },
      { weight: 15, active: highProc },
      { weight: 10, active: t.priority === 'critical' || t.priority === 'high' },
    ]);

    if (confidence < 30) return null;

    const reasons: string[] = [];
    if (veryClose)              reasons.push(`موعد التسليم بعد ${daysLeft === 0 ? 'اليوم' : 'يوم واحد'}`);
    else if (close)             reasons.push(`${daysLeft} أيام حتى الموعد النهائي`);
    if (notStarted)             reasons.push('المهمة لم تبدأ بعد');
    if (isStalled)              reasons.push('المهمة متوقفة منذ أكثر من 3 أيام');
    if (highProc)               reasons.push(`معدل التسويف لديك ${procScore}%`);

    const severity: PredictionSeverity =
      confidence >= 70 ? 'critical' :
      confidence >= 45 ? 'warning'  : 'info';

    return {
      id:          `task-delay-${t.id}`,
      type:        'task_delay' as PredictionType,
      severity,
      confidence,
      title:       `"${t.title}" ستتأخر`,
      summary:     reasons[0] ?? 'إشارات تأخر متعددة',
      reasons,
      timeframe:   veryClose ? 'today' : close ? 'tomorrow' : 'this_week',
      entityId:    t.id,
      entityType:  'task' as const,
      entityName:  t.title,
      preventable: true,
      actionLabel: 'ابدأ الآن',
      actionRoute: '/tasks',
    } satisfies Prediction;
  }).filter(Boolean) as Prediction[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function predictProjectAbandonment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks: any[],
  abandonThreshold = 14,
): Prediction[] {
  const activeProjects = projects.filter(
    p => p.status === 'active' && !p.archived_at,
  );

  return activeProjects.map(p => {
    const projectTasks = tasks.filter(t => t.project_id === p.id);
    const pending      = projectTasks.filter(t => t.status !== 'done');
    const lastUpdated  = projectTasks
      .map(t => t.updated_at ?? t.created_at)
      .filter(Boolean)
      .sort()
      .at(-1);

    const daysSinceActivity = lastUpdated
      ? differenceInDays(new Date(), parseISO(lastUpdated))
      : 999;

    const noDoneRecently = !projectTasks.some(t => {
      if (t.status !== 'done' || !t.completed_at) return false;
      return differenceInDays(new Date(), parseISO(t.completed_at)) <= 14;
    });

    const allBacklog   = pending.length > 0 && pending.every(t => t.status === 'backlog');
    const longInactive = daysSinceActivity > abandonThreshold * 1.5;
    const medInactive  = daysSinceActivity > abandonThreshold * 0.7;
    const lowProgress  = (p.progress ?? 0) < 20 && projectTasks.length > 3;
    const noDeadline   = !p.due_date;

    const confidence = buildConfidence([
      { weight: 40, active: longInactive },
      { weight: 25, active: medInactive && !longInactive },
      { weight: 20, active: noDoneRecently },
      { weight: 15, active: allBacklog },
      { weight: 10, active: lowProgress },
      { weight: 10, active: noDeadline },
    ]);

    if (confidence < 35) return null;

    const reasons: string[] = [];
    if (longInactive)    reasons.push(`لم يُحدَّث منذ ${daysSinceActivity} يوماً`);
    else if (medInactive) reasons.push(`لا نشاط منذ ${daysSinceActivity} أيام`);
    if (noDoneRecently)  reasons.push('لا مهام مُنجزة خلال آخر أسبوعين');
    if (allBacklog)      reasons.push(`جميع المهام (${pending.length}) في قائمة الانتظار`);
    if (lowProgress)     reasons.push(`التقدم ${p.progress ?? 0}% فقط`);
    if (noDeadline)      reasons.push('لا موعد نهائي يُحفّز التقدم');

    const severity: PredictionSeverity =
      confidence >= 70 ? 'critical' :
      confidence >= 50 ? 'warning'  : 'info';

    return {
      id:          `project-abandon-${p.id}`,
      type:        'project_abandon' as PredictionType,
      severity,
      confidence,
      title:       `"${p.name}" على وشك التوقف`,
      summary:     reasons[0] ?? 'مؤشرات تخلي عن المشروع',
      reasons,
      timeframe:   'this_week',
      entityId:    p.id,
      entityType:  'project' as const,
      entityName:  p.name,
      preventable: true,
      actionLabel: 'راجع المشروع',
      actionRoute: `/projects/${p.id}`,
    } satisfies Prediction;
  }).filter(Boolean) as Prediction[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function predictPressureSpike(
  tasks: any[],
  procScore: number,
  overcommitScore: number,
  peakDay: number,
  memoryWorstDay = -1,
): Prediction[] {
  const today    = new Date();
  const tomorrow = addDays(today, 1);
  const tomStr   = format(tomorrow, 'yyyy-MM-dd');
  const in2Days  = format(addDays(today, 2), 'yyyy-MM-dd');
  const in5Days  = format(addDays(today, 5), 'yyyy-MM-dd');

  const dueTomorrow = tasks.filter(
    t => t.status !== 'done' && !t.archived_at && t.due_date === tomStr,
  );
  const dueThisWeek = tasks.filter(
    t => t.status !== 'done' && !t.archived_at &&
    t.due_date && t.due_date > tomStr && t.due_date <= in5Days,
  );

  const tomorrowDay  = getDay(tomorrow);
  const isTomMonday  = tomorrowDay === 1;
  const isTomFriday  = tomorrowDay === 5;
  const highOverload = overcommitScore > 60;
  const highProc     = procScore > 60;

  // Spike tomorrow
  if (dueTomorrow.length >= 2 || (dueTomorrow.length >= 1 && highOverload)) {
    const confidence = buildConfidence([
      { weight: 40, active: dueTomorrow.length >= 5 },
      { weight: 30, active: dueTomorrow.length >= 3 },
      { weight: 20, active: dueTomorrow.length >= 2 },
      { weight: 15, active: isTomMonday },
      { weight: 15, active: isTomFriday },
      { weight: 15, active: highOverload },
      { weight: 10, active: highProc },
    ]);

    const reasons: string[] = [];
    reasons.push(`${dueTomorrow.length} مهام موعدها ${DAY_NAMES_AR[tomorrowDay]}`);
    if (isTomMonday)  reasons.push('بداية الأسبوع تحمل ضغطاً إضافياً تاريخياً');
    if (isTomFriday)  reasons.push('الجمعة: انتهاية أسبوع العمل يُضاعف الضغط');
    if (tomorrowDay === memoryWorstDay) reasons.push('غداً هو أضعف يوم تاريخياً في أسبوعك');
    if (highOverload) reasons.push(`معدل الإفراط في الالتزام ${overcommitScore}%`);
    if (highProc)     reasons.push('معدل التسويف مرتفع — المهام تتراكم');
    if (dueThisWeek.length > 3) reasons.push(`+ ${dueThisWeek.length} مهمة خلال الأيام التالية`);

    return [{
      id:          'pressure-tomorrow',
      type:        'pressure_spike',
      severity:    confidence >= 65 ? 'critical' : 'warning',
      confidence,
      title:       `ضغط مهام مرتفع غداً`,
      summary:     reasons[0],
      reasons,
      timeframe:   'tomorrow',
      preventable: true,
      actionLabel: 'جدوِل يومك الآن',
      actionRoute: '/tasks',
    }];
  }

  // Spike this week
  if (dueThisWeek.length >= 5) {
    const confidence = buildConfidence([
      { weight: 35, active: dueThisWeek.length >= 8 },
      { weight: 25, active: dueThisWeek.length >= 5 },
      { weight: 15, active: highOverload },
      { weight: 10, active: highProc },
    ]);

    return [{
      id:          'pressure-week',
      type:        'pressure_spike',
      severity:    'warning',
      confidence,
      title:       `${dueThisWeek.length} مهمة ستتقاطع هذا الأسبوع`,
      summary:     `تراكم مواعيد خلال ${dueThisWeek.length} أيام قادمة`,
      reasons:     [
        `${dueThisWeek.length} مهمة مستحقة خلال 5 أيام`,
        highOverload ? 'ميل تاريخي للإفراط في الجدولة' : '',
        highProc ? 'معدل تسويف مرتفع يُضخّم الضغط' : '',
      ].filter(Boolean),
      timeframe:   'this_week',
      preventable: true,
      actionLabel: 'راجع الأولويات',
      actionRoute: '/tasks',
    }];
  }

  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function predictHabitBreaks(
  habits: any[],
  fragileIds: string[],
): Prediction[] {
  const hour     = new Date().getHours();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const lateDay  = hour >= 19;

  return habits
    .filter(h => {
      const logs         = h.logs ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completedToday = logs.some((l: any) => l.completed_at?.startsWith(todayStr));
      const isFragile    = fragileIds.includes(h.id);
      const hasStreak    = logs.length > 0;
      return !completedToday && isFragile && hasStreak;
    })
    .slice(0, 2)
    .map(h => {
      const logs = h.logs ?? [];
      const streak = (() => {
        let s = 0;
        for (let i = 1; i < 60; i++) {
          const d = format(addDays(new Date(), -i), 'yyyy-MM-dd');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (logs.some((l: any) => l.completed_at?.startsWith(d))) s++;
          else break;
        }
        return s;
      })();

      const confidence = buildConfidence([
        { weight: 35, active: lateDay },
        { weight: 30, active: streak > 0 && streak <= 3 },
        { weight: 20, active: streak > 3 && streak <= 7 },
        { weight: 15, active: hour >= 22 },
      ]);

      const reasons: string[] = [
        streak > 0 ? `سلسلة ${streak} ${streak === 1 ? 'يوم' : 'أيام'} ستنكسر الليلة` : 'العادة لم تُكتمل اليوم',
        lateDay ? `الساعة ${hour}:00 — الوقت يضيق` : 'لم تُكمل هذه العادة بعد اليوم',
        streak >= 7 ? 'كسر هذه السلسلة سيستغرق أسابيع لإعادة بنائها' : '',
      ].filter(Boolean);

      return {
        id:          `habit-break-${h.id}`,
        type:        'habit_break' as PredictionType,
        severity:    (lateDay && streak > 5) ? 'critical' : 'warning',
        confidence:  clamp(confidence, 40, 90),
        title:       `سلسلة "${h.name}" ستنكسر اليوم`,
        summary:     reasons[0],
        reasons,
        timeframe:   'today' as PredictionTimeframe,
        entityId:    h.id,
        entityType:  'habit' as const,
        entityName:  h.name,
        preventable: true,
        actionLabel: 'أكمل الآن',
        actionRoute: '/habits',
      } satisfies Prediction;
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function predictOverloadRisk(
  tasks: any[],
  overcommitScore: number,
  procScore: number,
): Prediction | null {
  const today   = format(new Date(), 'yyyy-MM-dd');
  const in7Days = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const upcoming = tasks.filter(
    t => t.status !== 'done' && !t.archived_at &&
    t.due_date && t.due_date >= today && t.due_date <= in7Days,
  );

  const critical = upcoming.filter(t => t.priority === 'critical' || t.priority === 'high');
  const hasConvergence = upcoming.length >= 6 && critical.length >= 2;

  if (!hasConvergence) return null;

  const confidence = buildConfidence([
    { weight: 35, active: upcoming.length >= 10 },
    { weight: 25, active: upcoming.length >= 6 },
    { weight: 20, active: critical.length >= 3 },
    { weight: 15, active: overcommitScore > 50 },
    { weight: 10, active: procScore > 50 },
  ]);

  return {
    id:         'overload-risk',
    type:       'overload_risk',
    severity:   confidence >= 65 ? 'critical' : 'warning',
    confidence,
    title:      `تقاطع ${upcoming.length} مهمة خلال 7 أيام`,
    summary:    `${critical.length} منها عالية الأولوية — خطر الإرهاق`,
    reasons:    [
      `${upcoming.length} مهمة مستحقة هذا الأسبوع`,
      `${critical.length} مهام حرجة / عالية الأولوية`,
      overcommitScore > 50 ? 'ميل تاريخي للإفراط في الالتزام' : '',
      procScore > 50 ? 'معدل تسويف مرتفع يُقلل الوقت الفعلي' : '',
    ].filter(Boolean),
    timeframe:   'this_week',
    preventable: true,
    actionLabel: 'أعد توزيع المهام',
    actionRoute: '/tasks',
  };
}

function predictEnergyDrop(
  procScore: number,
  overcommitScore: number,
  completedToday: number,
  peakDay: number,
): Prediction | null {
  const tomorrow    = addDays(new Date(), 1);
  const tomorrowDay = getDay(tomorrow);
  const isTomWeekend = isWeekend(tomorrow);
  const afterPeak   = tomorrowDay === (peakDay + 1) % 7;
  const highStress  = procScore > 65 && overcommitScore > 55;
  const burnedToday = completedToday >= 5;

  if (!highStress && !isTomWeekend && !burnedToday) return null;

  const confidence = buildConfidence([
    { weight: 30, active: highStress },
    { weight: 25, active: burnedToday },
    { weight: 20, active: isTomWeekend },
    { weight: 15, active: afterPeak },
  ]);

  if (confidence < 35) return null;

  const reasons: string[] = [];
  if (burnedToday)   reasons.push(`أنجزت ${completedToday} مهام اليوم — الإرهاق محتمل`);
  if (highStress)    reasons.push('مؤشرات ضغط مرتفعة في السجل الأخير');
  if (isTomWeekend)  reasons.push('عطلة نهاية الأسبوع تاريخياً أقل إنتاجية');
  if (afterPeak)     reasons.push('اليوم التالي لذروة الإنتاجية عادةً أضعف');

  return {
    id:         'energy-drop',
    type:       'energy_drop',
    severity:   'info',
    confidence,
    title:      'طاقة منخفضة متوقعة غداً',
    summary:    reasons[0] ?? 'إشارات تعب متراكمة',
    reasons,
    timeframe:  'tomorrow',
    preventable: true,
    actionLabel: 'خطط مهاماً خفيفة لغداً',
    actionRoute: '/tasks',
  };
}

// ── Main hook ──────────────────────────────────────────────────────────────────

export function usePredictiveEngine(): PredictiveReport {
  const { data: rawTasks       = [], isLoading: tL } = useTasks();
  const { data: projects       = [], isLoading: pL } = useProjects();
  const { data: habitsWithLogs = [], isLoading: hL } = useHabitsWithLogs();
  const { data: profile,             isLoading: bL } = useBehaviorEngine();
  const { data: memory,              isLoading: mL } = useOperationalMemory();

  const predictions = useMemo<Prediction[]>(() => {
    if (!profile) return [];

    const {
      procrastinationScore, overcommitmentScore,
      fragileHabitIds, stalledTaskIds, peakDay, completedToday,
    } = profile;

    // Use memory-calibrated project lifespan threshold if available
    const projectAbandonThreshold = memory?.medianProjectLifeDays ?? 14;

    // Use memory worst day to boost pressure spike confidence
    const memoryWorstDay = memory?.worstDayOfWeek ?? -1;

    const allPredictions: Prediction[] = [
      ...predictTaskDelays(rawTasks, procrastinationScore, stalledTaskIds),
      ...predictProjectAbandonment(projects, rawTasks, projectAbandonThreshold),
      ...predictPressureSpike(rawTasks, procrastinationScore, overcommitmentScore, peakDay, memoryWorstDay),
      ...predictHabitBreaks(habitsWithLogs, fragileHabitIds),
    ];

    const overload = predictOverloadRisk(rawTasks, overcommitmentScore, procrastinationScore);
    if (overload) allPredictions.push(overload);

    const energyDrop = predictEnergyDrop(
      procrastinationScore, overcommitmentScore, completedToday, peakDay,
    );
    if (energyDrop) allPredictions.push(energyDrop);

    // Sort: severity desc → confidence desc
    const SEV: Record<PredictionSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return allPredictions
      .sort((a, b) => SEV[a.severity] - SEV[b.severity] || b.confidence - a.confidence)
      .slice(0, 8); // max 8 predictions
  }, [rawTasks, projects, habitsWithLogs, profile]);

  const riskScore = useMemo(() => {
    if (predictions.length === 0) return 0;
    const SEV_WEIGHT: Record<PredictionSeverity, number> = { critical: 3, warning: 2, info: 1 };
    const raw = predictions.reduce(
      (s, p) => s + (p.confidence / 100) * SEV_WEIGHT[p.severity] * 33,
      0,
    );
    return clamp(Math.round(raw), 0, 100);
  }, [predictions]);

  const riskLabel =
    riskScore >= 70 ? 'مخاطر مرتفعة' :
    riskScore >= 40 ? 'مخاطر متوسطة' :
    riskScore >= 15 ? 'مخاطر منخفضة' :
    'المسار سليم';

  return {
    predictions,
    riskScore,
    riskLabel,
    mostUrgent: predictions[0] ?? null,
    isLoading: tL || pL || hL || bL || mL,
  };
}
