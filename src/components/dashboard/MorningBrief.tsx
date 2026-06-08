/**
 * MorningBrief — AI-powered daily briefing widget.
 *
 * Shows: brief text, top 3 scored tasks, AI coaching tip, action cards.
 * Visible when hour is 5–11 AM (or always as fallback).
 */
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sunrise, Zap, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIDecisionEngine } from '@/hooks/useAIDecisionEngine';
import type { AIAction } from '@/hooks/useAIDecisionEngine';

// ── Action icon map ───────────────────────────────────────────────────────────

const ACTION_ICONS: Record<AIAction['type'], React.ElementType> = {
  focus:      Zap,
  reschedule: Clock,
  delegate:   ArrowRight,
  review:     AlertTriangle,
  habit:      CheckCircle2,
  energy:     Sunrise,
};

const ACTION_COLORS: Record<AIAction['priority'], string> = {
  high:   'border-destructive/50 bg-destructive/5',
  medium: 'border-amber-500/50 bg-amber-500/5',
  low:    'border-border bg-muted/30',
};

const PRIORITY_BADGE: Record<AIAction['priority'], string> = {
  high:   'bg-destructive/20 text-destructive',
  medium: 'bg-amber-500/20 text-amber-600',
  low:    'bg-muted text-muted-foreground',
};

// ── Subcomponents ─────────────────────────────────────────────────────────────

function ActionCard({ action }: { action: AIAction }) {
  const Icon = ACTION_ICONS[action.type];
  return (
    <div className={cn('flex gap-3 p-3 rounded-xl border', ACTION_COLORS[action.priority])}>
      <div className="mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium">{action.title}</span>
          <Badge className={cn('text-[10px] px-1.5 py-0', PRIORITY_BADGE[action.priority])}>
            {action.priority === 'high' ? 'عاجل' : action.priority === 'medium' ? 'مهم' : 'عادي'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
      </div>
    </div>
  );
}

function TaskRow({ task, rank }: { task: { title: string; adaptiveScore: number; action: string; suggestedTime?: string }; rank: number }) {
  const rankColor = rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-400' : 'text-amber-700';
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
      <span className={cn('text-xs font-bold w-5 text-center', rankColor)}>#{rank}</span>
      <span className="flex-1 text-sm truncate">{task.title}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {task.suggestedTime && (
          <span className="text-xs text-muted-foreground">{task.suggestedTime}</span>
        )}
        <Badge variant="outline" className="text-[10px]">{task.adaptiveScore}</Badge>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MorningBrief() {
  const { result, scoredTasks, profile, isReady, isAnalysing, error, analyse, refresh } =
    useAIDecisionEngine();

  // Auto-run analysis on mount if no cached result
  useEffect(() => {
    if (isReady && !result && !isAnalysing) {
      analyse();
    }
  }, [isReady, result, isAnalysing, analyse]);

  const topTasks  = scoredTasks.slice(0, 3);
  const riskColor =
    profile?.todayRiskLevel === 'high'   ? 'text-destructive'
    : profile?.todayRiskLevel === 'medium' ? 'text-amber-500'
    : 'text-success';

  // Loading skeleton
  if (!isReady || (isAnalysing && !result)) {
    return (
      <Card className="col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sunrise className="w-4 h-4 text-amber-400" />
            إحاطة الصباح
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sunrise className="w-4 h-4 text-amber-400" />
            إحاطة الصباح
            {profile && (
              <span className={cn('text-xs font-normal', riskColor)}>
                • مستوى الخطر: {profile.todayRiskLevel === 'high' ? 'مرتفع' : profile.todayRiskLevel === 'medium' ? 'متوسط' : 'منخفض'}
              </span>
            )}
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
        {/* Error state */}
        {error && !result && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">تعذّر تحميل التحليل — تحقق من اتصالك</p>
          </div>
        )}

        {/* AI Brief */}
        {result?.brief && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm leading-relaxed text-foreground">{result.brief}</p>
          </div>
        )}

        {/* Coaching tip */}
        {result?.coaching && (
          <div className="flex gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">{result.coaching}</p>
          </div>
        )}

        {/* Top tasks */}
        {topTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">أولويات اليوم</p>
            <div className="space-y-0">
              {topTasks.map((task, i) => (
                <TaskRow key={task.id} task={task} rank={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Action cards */}
        {result?.actions && result.actions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">الإجراءات المقترحة</p>
            <div className="space-y-2">
              {result.actions.slice(0, 3).map((action, i) => (
                <ActionCard key={i} action={action} />
              ))}
            </div>
          </div>
        )}

        {/* No data fallback */}
        {!result && !error && isReady && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">اضغط لتوليد إحاطة يومية ذكية</p>
            <Button size="sm" onClick={() => analyse('morning')} disabled={isAnalysing}>
              {isAnalysing ? 'جارٍ التحليل...' : 'بدء التحليل'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
