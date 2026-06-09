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

// ── Helpers ───────────────────────────────────────────────────────────────────

function EnergyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={cn(
            'w-2.5 h-2.5 rounded-full transition-colors',
            i <= level ? 'bg-amber-400' : 'bg-muted'
          )}
        />
      ))}
    </div>
  );
}

function TrendBadge({ trend }: { trend: 'improving' | 'declining' | 'stable' }) {
  if (trend === 'improving') return (
    <span className="flex items-center gap-1 text-xs text-success">
      <TrendingUp className="w-3 h-3" /> تحسّن
    </span>
  );
  if (trend === 'declining') return (
    <span className="flex items-center gap-1 text-xs text-destructive">
      <TrendingDown className="w-3 h-3" /> تراجع
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="w-3 h-3" /> مستقر
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MiddayCheckpoint() {
  const {
    result, scoredTasks, profile, trends,
    doneToday, isReady, isAnalysing, error, analyse, refresh,
  } = useAIDecisionEngine();

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
            نقطة التفتيش
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
            نقطة منتصف اليوم
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={refresh}
            disabled={isAnalysing}
            aria-label="تحديث التحليل"
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
              <p className="text-[10px] text-muted-foreground mt-0.5">منجز</p>
            </div>
            {/* Remaining */}
            <div className="text-center p-2 rounded-xl bg-muted/40">
              <p className="text-lg font-bold">{remaining}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">متبقي</p>
            </div>
            {/* Energy */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 gap-1">
              <EnergyDots level={profile.energyEstimate} />
              <p className="text-[10px] text-muted-foreground">الطاقة</p>
            </div>
            {/* Trend */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 gap-1">
              <TrendBadge trend={trends.weeklyCompletionTrend} />
              <p className="text-[10px] text-muted-foreground">الأسبوع</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>تقدم اليوم</span>
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
              <Zap className="w-3 h-3" /> أنجز الآن
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
              <AlertTriangle className="w-3 h-3" /> أجّل لغداً
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
          <div className="flex gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">{result.coaching}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive text-center">تعذّر الاتصال بالذكاء الاصطناعي</p>
        )}

        {/* Trigger manually */}
        {!result && !error && isReady && (
          <Button size="sm" className="w-full" onClick={() => analyse('midday')} disabled={isAnalysing}>
            {isAnalysing ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> جارٍ التحليل...
              </span>
            ) : 'تحليل منتصف اليوم'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
