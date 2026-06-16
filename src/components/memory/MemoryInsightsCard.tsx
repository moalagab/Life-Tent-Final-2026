/**
 * MemoryInsightsCard — Makes the operational memory visible to the user.
 *
 * "What the system has learned about you."
 *
 * Shows extracted patterns with confidence bars so the user can
 * understand WHY the system makes the recommendations it does.
 * Memory is not a black box — it's a transparent dossier.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Brain, TrendingUp, AlertTriangle, Minus,
  ChevronDown, ChevronUp, Clock, Zap, RefreshCw,
  BarChart3, CheckCircle, Target,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useOperationalMemory, type MemoryPattern } from '@/hooks/useOperationalMemory';
import { useDecisionEngine } from '@/hooks/useDecisionEngine';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── Pattern icon map ───────────────────────────────────────────────────────────

function PatternIcon({ patternKey }: { patternKey: string }) {
  const cls = 'w-3.5 h-3.5 shrink-0';
  if (patternKey === 'best-hours')          return <Clock       className={cls} />;
  if (patternKey === 'best-day')            return <Zap         className={cls} />;
  if (patternKey === 'worst-day')           return <AlertTriangle className={cls} />;
  if (patternKey === 'throughput')          return <BarChart3   className={cls} />;
  if (patternKey === 'high-priority-rate') return <Target      className={cls} />;
  if (patternKey === 'habit-boost')         return <RefreshCw   className={cls} />;
  if (patternKey === 'top-habit')           return <CheckCircle className={cls} />;
  if (patternKey === 'project-lifespan')   return <TrendingUp  className={cls} />;
  return <Minus className={cls} />;
}

const SENTIMENT_CFG = {
  positive: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500' },
  warning:  { color: 'text-amber-500',   bg: 'bg-amber-400/10',   bar: 'bg-amber-400'   },
  neutral:  { color: 'text-blue-400',    bg: 'bg-blue-400/10',    bar: 'bg-blue-400'    },
};

// ── Pattern chip ───────────────────────────────────────────────────────────────

function PatternChip({ pattern: p }: { pattern: MemoryPattern }) {
  const cfg = SENTIMENT_CFG[p.sentiment];
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors',
      `${cfg.bg} border-current/10`,
    )}>
      {/* Icon */}
      <div className={cfg.color}>
        <PatternIcon patternKey={p.key} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-muted-foreground truncate">{p.label}</div>
        <div className={cn('text-xs font-black truncate', cfg.color)}>{p.value}</div>
      </div>

      {/* Confidence bar */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="text-[8px] font-bold text-muted-foreground/60">{p.confidence}%</span>
        <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full', cfg.bar)}
            style={{ width: `${p.confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Memory influence badge ─────────────────────────────────────────────────────

export function MemoryInfluenceBadge({ memoryReasons }: { memoryReasons: string[] }) {
  const [open, setOpen] = useState(false);
  if (memoryReasons.length === 0) return null;

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[9px] font-black text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5 hover:bg-indigo-500/15 transition-colors"
      >
        <Brain className="w-2.5 h-2.5" />
        بناءً على تاريخك
        {open ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
      </button>
      {open && (
        <div className="mt-1 p-2 rounded-lg bg-indigo-500/8 border border-indigo-500/15 space-y-1">
          {memoryReasons.map((r, i) => (
            <div key={i} className="flex items-start gap-1">
              <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <span className="text-[10px] text-indigo-600 dark:text-indigo-300 leading-relaxed">{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main card ──────────────────────────────────────────────────────────────────

export function MemoryInsightsCard() {
  const { data: memory, isLoading } = useOperationalMemory();
  const { memoryInfluenced, memoryConfidence } = useDecisionEngine();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!memory || memory.dataPoints < 5) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-black">ذاكرة النظام</span>
          <span className="text-[10px] text-muted-foreground/50">Operational Memory</span>
        </div>
        <p className="text-xs text-muted-foreground text-center py-3">
          النظام يجمع بياناتك — ستظهر الأنماط بعد أسبوع من الاستخدام
        </p>
      </div>
    );
  }

  const visiblePatterns = expanded ? memory.patterns : memory.patterns.slice(0, 4);

  const confidenceColor =
    memory.confidence >= 70 ? 'text-emerald-500' :
    memory.confidence >= 40 ? 'text-amber-500'   :
    'text-slate-400';

  const updatedAgo = formatDistanceToNow(parseISO(memory.computedAt), {
    addSuffix: true,
    locale: ar,
  });

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-border/40">
        <Brain className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="text-sm font-black text-foreground">ذاكرة النظام</span>
        <span className="text-[10px] text-muted-foreground/50 flex-1">Operational Memory</span>

        {/* Confidence badge */}
        <div className="flex items-center gap-1.5">
          <div className={cn('text-xs font-black tabular-nums', confidenceColor)}>
            {memory.confidence}%
          </div>
          <div className="text-[9px] text-muted-foreground/50">ثقة</div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Stats bar */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>
            <span className="font-black text-foreground">{memory.dataPoints}</span> نقطة بيانات
          </span>
          <span className="text-border/80">·</span>
          {memoryInfluenced && (
            <>
              <span className="flex items-center gap-1 text-indigo-500 font-bold">
                <Brain className="w-3 h-3" />
                تؤثر في قراراتك الآن
              </span>
              <span className="text-border/80">·</span>
            </>
          )}
          <span>آخر تحديث {updatedAgo}</span>
        </div>

        {/* Confidence bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              memory.confidence >= 70 ? 'bg-emerald-500' :
              memory.confidence >= 40 ? 'bg-amber-400'   :
              'bg-slate-400',
            )}
            style={{ width: `${memory.confidence}%` }}
          />
        </div>

        {/* Pattern grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visiblePatterns.map(p => (
            <PatternChip key={p.key} pattern={p} />
          ))}
        </div>

        {/* Expand/collapse */}
        {memory.patterns.length > 4 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1"
          >
            {expanded ? (
              <><ChevronUp className="w-3 h-3" /> إخفاء</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> {memory.patterns.length - 4} أنماط أخرى</>
            )}
          </button>
        )}

        {/* Memory influence on today's decision */}
        {memoryInfluenced && (
          <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-indigo-500/6 border border-indigo-500/15">
            <Brain className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-semibold">
              الذاكرة تُشكّل قرارات اليوم — الاقتراحات مبنية على أنماطك الفعلية
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
