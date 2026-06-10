/**
 * MiddayCheckpoint — Midday re-evaluation widget.
 *
 * Shows: done-today count, remaining tasks, energy, trend,
 * AI brief, do-now tasks, deferred tasks, coaching, energy tip.
 */
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sun, RefreshCw, Zap, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, Battery, ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIDecisionEngine } from '@/hooks/useAIDecisionEngine';
import { useLanguage } from '@/hooks/useLanguage';

// ── Helpers ───────────────────────────────────────────────────────────────────

function EnergyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={cn(
            'w-2.5 h-2.5 rounded-full transition-colors',
            i <= level ? 'bg-primary/60' : 'bg-muted'
          )}
        />
      ))}
    </div>
  );
}

function TrendBadge({ trend, lang = 'ar' }: { trend: 'improving' | 'declining' | 'stable'; lang?: string }) {
  if (trend === 'improving') return (
    <span className="flex items-center gap-1 text-xs text-success">
      <TrendingUp className="w-3 h-3" /> {lang === 'ar' ? 'تحسّن' : 'Improving'}
    </span>
  );
  if (trend === 'declining') return (
    <span className="flex items-center gap-1 text-xs text-destructive">
      <TrendingDown className="w-3 h-3" /> {lang === 'ar' ? 'تراجع' : 'Declining'}
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="w-3 h-3" /> {lang === 'ar' ? 'مستقر' : 'Stable'}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MiddayCheckpoint() {
  const {
    result, scoredTasks, profile, trends,
    doneToday, isReady, isAnalysing, error, analyse, refresh,
  } = useAIDecisionEngine();
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    if (isReady && !result && !isAnalysing) {
      analyse('midday');
    }
  }, [isReady, result, isAnalysing, analyse]);

  const doNowTasks  = scoredTasks.filter(t => t.action === 'do_now').slice(0, 3);
  const deferTasks  = scoredTasks.filter(t => t.action === 'defer').slice(0, 2);
  const remaining   = scoredTasks.length;

  // Progress: done / (done + remaining)
  const total       = doneToday + remaining;
  const progressPct = total > 0 ? Math.round((doneToday / total) * 100) : 0;

  if (!isReady || (isAnalysing && !result)) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="w-4 h-4 text-orange-400" />
            {currentLanguage === 'ar' ? 'نقطة التفتيش' : 'Checkpoint'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="w-4 h-4 text-orange-400" />
            {currentLanguage === 'ar' ? 'نقطة منتصف اليوم' : 'Midday Checkpoint'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={refresh}
            disabled={isAnalysing}
            aria-label={currentLanguage === 'ar' ? 'تحديث التحليل' : 'Refresh analysis'}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isAnalysing && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats row */}
        {profile && (
          <div className="grid grid-cols-4 gap-2">
            {/* Done today */}
            <div className="text-center p-2 rounded-xl bg-success/10 border border-success/20">
              <p className="text-lg font-bold text-success">{doneToday}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{currentLanguage === 'ar' ? 'منجز' : 'Done'}</p>
            </div>
            {/* Remaining */}
            <div className="text-center p-2 rounded-xl bg-muted/40">
              <p className="text-lg font-bold">{remaining}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{currentLanguage === 'ar' ? 'متبقي' : 'Left'}</p>
            </div>
            {/* Energy */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 gap-1">
              <EnergyDots level={profile.energyEstimate} />
              <p className="text-[10px] text-muted-foreground">{currentLanguage === 'ar' ? 'الطاقة' : 'Energy'}</p>
            </div>
            {/* Trend */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 gap-1">
              <TrendBadge trend={trends.weeklyCompletionTrend} lang={currentLanguage} />
              <p className="text-[10px] text-muted-foreground">{currentLanguage === 'ar' ? 'الأسبوع' : 'Week'}</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{currentLanguage === 'ar' ? 'تقدم اليوم' : "Today's Progress"}</span>
            <span>{progressPct}% ({doneToday} / {total})</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* AI brief */}
        {result?.brief && (
          <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
            <p className="text-sm leading-relaxed">{result.brief}</p>
          </div>
        )}

        {/* Energy tip */}
        {result?.energy_tip && (
          <div className="flex gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <Battery className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">{result.energy_tip}</p>
          </div>
        )}

        {/* Do now tasks */}
        {doNowTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" /> {currentLanguage === 'ar' ? 'أنجز الآن' : 'Do Now'}
            </p>
            <div className="space-y-1.5">
              {doNowTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm flex-1 truncate">{task.title}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{task.adaptiveScore}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Defer tasks */}
        {deferTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {currentLanguage === 'ar' ? 'أجّل لغداً' : 'Defer to Tomorrow'}
            </p>
            <div className="space-y-1.5">
              {deferTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40"
                >
                  <ListTodo className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate text-muted-foreground">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coaching */}
        {result?.coaching && (
          <div className="flex gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
            <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-primary/80 dark:text-primary/70">{result.coaching}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive text-center">{currentLanguage === 'ar' ? 'تعذّر الاتصال بالذكاء الاصطناعي' : 'Could not connect to AI'}</p>
        )}

        {/* Trigger manually */}
        {!result && !error && isReady && (
          <Button size="sm" className="w-full" onClick={() => analyse('midday')} disabled={isAnalysing}>
            {isAnalysing ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {currentLanguage === 'ar' ? 'جارٍ التحليل...' : 'Analysing...'}
              </span>
            ) : (currentLanguage === 'ar' ? 'تحليل منتصف اليوم' : 'Analyse Midday')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
