/**
 * MorningBrief — AI-powered daily briefing widget.
 *
 * Shows: highlight, brief, energy tip, coaching, top tasks, action cards.
 * Action cards support "done" tracking (persisted per day in localStorage).
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sunrise, Zap, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, ArrowRight, Sparkles,
  Battery, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIDecisionEngine } from '@/hooks/useAIDecisionEngine';
import type { AIAction } from '@/hooks/useAIDecisionEngine';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';

// ── Action icon/color maps ─────────────────────────────────────────────────────

const ACTION_ICONS: Record<AIAction['type'], React.ElementType> = {
  focus:      Zap,
  reschedule: Clock,
  delegate:   ArrowRight,
  review:     AlertTriangle,
  habit:      CheckCircle2,
  energy:     Battery,
};

const ACTION_COLORS: Record<AIAction['priority'], string> = {
  high:   'border-destructive/40 bg-destructive/5',
  medium: 'border-amber-500/40 bg-amber-500/5',
  low:    'border-border bg-muted/20',
};

const PRIORITY_LABEL_AR: Record<AIAction['priority'], string> = {
  high:   'عاجل',
  medium: 'مهم',
  low:    'عادي',
};

const PRIORITY_LABEL_EN: Record<AIAction['priority'], string> = {
  high:   'Urgent',
  medium: 'Important',
  low:    'Normal',
};

const PRIORITY_BADGE: Record<AIAction['priority'], string> = {
  high:   'bg-destructive/15 text-destructive border-destructive/20',
  medium: 'bg-amber-500/15 text-amber-600 border-amber-500/20',
  low:    'bg-muted text-muted-foreground',
};

// ── ActionCard ────────────────────────────────────────────────────────────────

function ActionCard({
  action,
  index,
  isDone,
  onToggle,
  lang = 'ar',
}: {
  action: AIAction;
  index: number;
  isDone: boolean;
  onToggle: (i: number) => void;
  lang?: string;
}) {
  const Icon = ACTION_ICONS[action.type];
  const PRIORITY_LABEL = lang === 'ar' ? PRIORITY_LABEL_AR : PRIORITY_LABEL_EN;

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-xl border transition-all duration-200',
        isDone
          ? 'border-border/30 bg-muted/20 opacity-60'
          : ACTION_COLORS[action.priority]
      )}
    >
      <div className="mt-0.5 shrink-0">
        <Icon className={cn('w-4 h-4', isDone ? 'text-muted-foreground' : 'text-muted-foreground')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={cn('text-sm font-medium', isDone && 'line-through text-muted-foreground')}>
            {action.title}
          </span>
          <Badge className={cn('text-[10px] px-1.5 py-0 border', PRIORITY_BADGE[action.priority])}>
            {PRIORITY_LABEL[action.priority]}
          </Badge>
          {action.estimated_minutes && !isDone && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {action.estimated_minutes} د
            </span>
          )}
        </div>
        <p className={cn('text-xs leading-relaxed', isDone ? 'text-muted-foreground/60' : 'text-muted-foreground')}>
          {action.description}
        </p>
      </div>
      <button
        onClick={() => onToggle(index)}
        className={cn(
          'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5',
          isDone
            ? 'bg-success border-success text-success-foreground'
            : 'border-border hover:border-primary'
        )}
        aria-label={lang === 'ar' ? (isDone ? 'إلغاء التحديد' : 'تحديد كمنجز') : (isDone ? 'Unmark' : 'Mark as done')}
      >
        {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>
    </div>
  );
}

// ── TaskRow ───────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  rank,
}: {
  task: { title: string; adaptiveScore: number; action: string; suggestedTime?: string };
  rank: number;
}) {
  const rankColor =
    rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-400' : 'text-amber-700/70';
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
      <span className={cn('text-xs font-bold w-5 text-center shrink-0', rankColor)}>#{rank}</span>
      <span className="flex-1 text-sm truncate">{task.title}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        {task.suggestedTime && (
          <span className="text-[10px] text-muted-foreground">{task.suggestedTime}</span>
        )}
        <Badge variant="outline" className="text-[10px] px-1.5">{task.adaptiveScore}</Badge>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MorningBrief() {
  const {
    result, scoredTasks, profile, isReady, isAnalysing,
    error, analyse, refresh, doneActions, toggleActionDone,
  } = useAIDecisionEngine();
  const { currentLanguage } = useLanguage();

  const [showAllActions, setShowAllActions] = useState(false);

  // Auto-run analysis on mount if no cached result
  useEffect(() => {
    if (isReady && !result && !isAnalysing) {
      analyse();
    }
  }, [isReady, result, isAnalysing, analyse]);

  const topTasks  = scoredTasks.slice(0, 3);
  const actions   = result?.actions ?? [];
  const visibleActions = showAllActions ? actions : actions.slice(0, 3);
  const doneCount = [...doneActions].filter(i => i < actions.length).length;

  const riskColor =
    profile?.todayRiskLevel === 'high'   ? 'text-destructive'
    : profile?.todayRiskLevel === 'medium' ? 'text-amber-500'
    : 'text-success';

  const computedAgo = result?.computedAt
    ? formatDistanceToNow(new Date(result.computedAt), { locale: currentLanguage === 'ar' ? ar : undefined, addSuffix: true })
    : null;

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (!isReady || (isAnalysing && !result)) {
    return (
      <Card className="col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sunrise className="w-4 h-4 text-amber-400" />
            {currentLanguage === 'ar' ? 'إحاطة الصباح' : 'Morning Brief'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
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
            {currentLanguage === 'ar' ? 'إحاطة الصباح' : 'Morning Brief'}
            {profile && (
              <span className={cn('text-xs font-normal', riskColor)}>
                · {currentLanguage === 'ar'
                  ? (profile.todayRiskLevel === 'high' ? 'خطر مرتفع' : profile.todayRiskLevel === 'medium' ? 'خطر متوسط' : 'وضع جيد')
                  : (profile.todayRiskLevel === 'high' ? 'High risk' : profile.todayRiskLevel === 'medium' ? 'Medium risk' : 'Good')}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {computedAgo && (
              <span className="text-[10px] text-muted-foreground hidden sm:block">{computedAgo}</span>
            )}
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
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error state */}
        {error && !result && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{currentLanguage === 'ar' ? 'تعذّر تحميل التحليل — تحقق من اتصالك' : 'Failed to load analysis — check your connection'}</p>
          </div>
        )}

        {/* Highlight — positive note */}
        {result?.highlight && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-success/5 border border-success/20">
            <Sparkles className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <p className="text-sm text-success dark:text-green-400 font-medium">{result.highlight}</p>
          </div>
        )}

        {/* AI Brief */}
        {result?.brief && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm leading-relaxed text-foreground">{result.brief}</p>
          </div>
        )}

        {/* Energy tip */}
        {result?.energy_tip && (
          <div className="flex gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <Battery className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-400">{result.energy_tip}</p>
          </div>
        )}

        {/* Coaching tip */}
        {result?.coaching && (
          <div className="flex gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">{result.coaching}</p>
          </div>
        )}

        {/* Top priority tasks */}
        {topTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{currentLanguage === 'ar' ? 'أولويات اليوم' : "Today's Priorities"}</p>
            <div>
              {topTasks.map((task, i) => (
                <TaskRow key={task.id} task={task} rank={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Action cards */}
        {actions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">
                {currentLanguage === 'ar' ? 'الإجراءات المقترحة' : 'Suggested Actions'}
                {doneCount > 0 && (
                  <span className="text-success mr-1">({doneCount}/{actions.length} {currentLanguage === 'ar' ? 'منجز' : 'done'})</span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              {visibleActions.map((action, i) => (
                <ActionCard
                  key={i}
                  action={action}
                  index={i}
                  isDone={doneActions.has(i)}
                  onToggle={toggleActionDone}
                  lang={currentLanguage}
                />
              ))}
            </div>
            {actions.length > 3 && (
              <button
                onClick={() => setShowAllActions(v => !v)}
                className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {showAllActions ? (
                  <><ChevronUp className="w-3.5 h-3.5" /> {currentLanguage === 'ar' ? 'عرض أقل' : 'Show less'}</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" /> +{actions.length - 3} {currentLanguage === 'ar' ? 'إجراءات أخرى' : 'more actions'}</>
                )}
              </button>
            )}
          </div>
        )}

        {/* No data fallback */}
        {!result && !error && isReady && (
          <div className="text-center py-6">
            <Sunrise className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">{currentLanguage === 'ar' ? 'اضغط لتوليد إحاطة يومية ذكية' : 'Tap to generate a smart daily brief'}</p>
            <Button size="sm" variant="gold" onClick={() => analyse('morning')} disabled={isAnalysing}>
              {isAnalysing ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {currentLanguage === 'ar' ? 'جارٍ التحليل...' : 'Analysing...'}
                </span>
              ) : (currentLanguage === 'ar' ? 'بدء التحليل' : 'Start Analysis')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
