/**
 * DailyDecisionCard — The first thing the user sees when opening the app.
 *
 * Shows:
 *   1. أهم 3 قرارات   (Top 3 decisions)
 *   2. أهم 3 مهام     (Top 3 tasks)
 *   3. أكبر خطر اليوم (Biggest risk)
 *   4. أهم فرصة اليوم (Top opportunity)
 *   5. توقع اليوم     (Day forecast)
 */
import { useEffect, useState } from 'react';
import { useAIDecisionEngine } from '@/hooks/useAIDecisionEngine';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, RefreshCw, CheckCircle2, AlertTriangle,
  Lightbulb, CloudSun, Clock, ChevronDown, ChevronUp,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// ── Greeting by time ──────────────────────────────────────────────────────────

function getTimeGreeting(lang: string): string {
  const h = new Date().getHours();
  if (lang === 'ar') {
    if (h >= 5  && h < 12) return 'صباح الخير';
    if (h >= 12 && h < 17) return 'مساء النور';
    if (h >= 17 && h < 21) return 'مساء الخير';
    return 'مرحباً بك';
  }
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Welcome back';
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Section: Decisions ────────────────────────────────────────────────────────

function DecisionsSection({ decisions, lang }: { decisions: string[]; lang: string }) {
  return (
    <div className="rounded-xl bg-violet-500/8 border border-violet-500/20 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
          <Brain className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
          {lang === 'ar' ? 'أهم 3 قرارات' : 'Top 3 Decisions'}
        </h3>
      </div>
      <ol className="space-y-2.5">
        {decisions.slice(0, 3).map((d, i) => (
          <li key={i} className="flex gap-2.5 items-start">
            <span className="shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-foreground/85 leading-relaxed">{d}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Section: Top Tasks ────────────────────────────────────────────────────────

function TopTasksSection({
  tasks,
  lang,
}: {
  tasks: { title: string; why: string; estimated_minutes: number }[];
  lang: string;
}) {
  return (
    <div className="rounded-xl bg-primary/8 border border-primary/20 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
          {lang === 'ar' ? 'أهم 3 مهام' : 'Top 3 Tasks'}
        </h3>
      </div>
      <ol className="space-y-2.5">
        {tasks.slice(0, 3).map((t, i) => (
          <li key={i} className="flex gap-2.5 items-start">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground/90 truncate">{t.title}</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{t.why}</p>
              {t.estimated_minutes > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                  <Clock className="w-2.5 h-2.5" />
                  {t.estimated_minutes} {lang === 'ar' ? 'د' : 'min'}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Section: Risk / Opportunity / Forecast ────────────────────────────────────

function InfoSection({
  icon: Icon,
  label,
  text,
  colorClass,
  bgClass,
  borderClass,
}: {
  icon: React.ElementType;
  label: string;
  text: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}) {
  return (
    <div className={cn('rounded-xl p-4 border space-y-2', bgClass, borderClass)}>
      <div className="flex items-center gap-2">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', bgClass)}>
          <Icon className={cn('w-3.5 h-3.5', colorClass)} />
        </div>
        <h3 className={cn('text-xs font-semibold uppercase tracking-wider', colorClass)}>{label}</h3>
      </div>
      <p className="text-sm text-foreground/85 leading-relaxed">{text}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DailyDecisionCard() {
  const {
    result, isReady, isAnalysing, error,
    analyse, refresh, currentMode,
  } = useAIDecisionEngine();
  const { currentLanguage: lang } = useLanguage();
  const isMobile = useIsMobile();
  // Start collapsed on phones so the dashboard isn't dominated by this card
  const [collapsed, setCollapsed] = useState(isMobile);

  // Auto-analyse on mount
  useEffect(() => {
    if (isReady && !result && !isAnalysing) {
      analyse();
    }
  }, [isReady, result, isAnalysing, analyse]);

  const today = format(new Date(), lang === 'ar' ? 'EEEE، d MMMM yyyy' : 'EEEE, MMMM d yyyy', {
    locale: lang === 'ar' ? ar : enUS,
  });

  const greeting = getTimeGreeting(lang);

  const modeLabel = (() => {
    if (lang === 'ar') {
      return currentMode === 'morning' ? 'إحاطة الصباح'
           : currentMode === 'midday'  ? 'نقطة التحقق'
           : currentMode === 'evening' ? 'مراجعة المساء'
           : 'تحليل شامل';
    }
    return currentMode === 'morning' ? 'Morning Brief'
         : currentMode === 'midday'  ? 'Midday Check'
         : currentMode === 'evening' ? 'Evening Review'
         : 'Full Analysis';
  })();

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!isReady || (isAnalysing && !result)) {
    return <LoadingSkeleton />;
  }

  // ── No result yet ────────────────────────────────────────────────────────
  if (!result && !isAnalysing) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3">
        <Brain className="w-10 h-10 text-primary/40 mx-auto" />
        <p className="text-sm text-muted-foreground">
          {lang === 'ar' ? 'اضغط لتوليد قرارات وتحليل يومك' : 'Tap to generate your daily decisions'}
        </p>
        <Button size="sm" onClick={() => analyse()} disabled={isAnalysing}>
          {lang === 'ar' ? 'ابدأ التحليل' : 'Start Analysis'}
        </Button>
      </div>
    );
  }

  const decisions       = result?.decisions ?? [];
  const topTasks        = result?.top_tasks ?? [];
  const biggestRisk     = result?.biggest_risk ?? '';
  const topOpportunity  = result?.top_opportunity ?? '';
  const dayForecast     = result?.day_forecast ?? '';

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-violet-500/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Brain className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-foreground">{greeting}</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">·</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">{modeLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{today}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {result?.highlight && (
            <span className="hidden md:flex items-center gap-1 text-[11px] text-success bg-success/10 border border-success/20 rounded-full px-2.5 py-1 max-w-xs truncate">
              <Sparkles className="w-3 h-3 shrink-0" />
              {result.highlight}
            </span>
          )}
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={refresh} disabled={isAnalysing}
            title={lang === 'ar' ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isAnalysing && 'animate-spin')} />
          </Button>
          <button
            onClick={() => setCollapsed(v => !v)}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            {collapsed
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronUp   className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && !result && (
        <div className="px-5 py-3 flex items-center gap-2 bg-destructive/10 border-b border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            {lang === 'ar' ? 'تعذّر تحميل التحليل' : 'Failed to load analysis'}
          </p>
        </div>
      )}

      {/* ── Body ── */}
      {!collapsed && result && (
        <div className="p-4 sm:p-5 space-y-4">

          {/* Row 1: Decisions + Tasks — equal width */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {decisions.length > 0 && (
              <DecisionsSection decisions={decisions} lang={lang} />
            )}
            {topTasks.length > 0 && (
              <TopTasksSection tasks={topTasks} lang={lang} />
            )}
          </div>

          {/* Row 2: Risk + Opportunity + Forecast */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {biggestRisk && (
              <InfoSection
                icon={AlertTriangle}
                label={lang === 'ar' ? 'أكبر خطر اليوم' : "Today's Biggest Risk"}
                text={biggestRisk}
                colorClass="text-destructive"
                bgClass="bg-destructive/8"
                borderClass="border-destructive/20"
              />
            )}
            {topOpportunity && (
              <InfoSection
                icon={Lightbulb}
                label={lang === 'ar' ? 'أهم فرصة اليوم' : "Today's Top Opportunity"}
                text={topOpportunity}
                colorClass="text-amber-500"
                bgClass="bg-amber-500/8"
                borderClass="border-amber-500/20"
              />
            )}
            {dayForecast && (
              <InfoSection
                icon={CloudSun}
                label={lang === 'ar' ? 'توقع اليوم' : 'Day Forecast'}
                text={dayForecast}
                colorClass="text-sky-400"
                bgClass="bg-sky-500/8"
                borderClass="border-sky-500/20"
              />
            )}
          </div>

          {/* Coaching tip — full width bottom */}
          {result.coaching && (
            <div className="flex gap-2.5 p-3.5 rounded-xl bg-muted/40 border border-border/60">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80 leading-relaxed">{result.coaching}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
