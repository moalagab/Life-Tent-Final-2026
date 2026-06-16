/**
 * LifecycleBar — Compact task health strip for the Tasks page.
 *
 * Shows:
 *  - Overall health score (color-coded bar)
 *  - Per-state bubble counts (aging / stale / dormant / ghost)
 *  - "Review" button → opens StaleTasksSheet
 */
import { useState } from 'react';
import { useLifecycleIntelligence, STATE_LABELS } from '@/hooks/useLifecycleIntelligence';
import { StaleTasksSheet } from './StaleTasksSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Activity, ChevronRight } from 'lucide-react';

function HealthBar({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-success'
    : score >= 50 ? 'bg-amber-500'
    : score >= 30 ? 'bg-orange-500'
    : 'bg-destructive';

  const label =
    score >= 75 ? 'صحي'
    : score >= 50 ? 'متوسط'
    : score >= 30 ? 'ضعيف'
    : 'خطر';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn(
        'text-[10px] font-bold w-14 text-end shrink-0',
        score >= 75 ? 'text-success' : score >= 50 ? 'text-amber-500' : 'text-destructive',
      )}>
        {score}% · {label}
      </span>
    </div>
  );
}

interface StateBubbleProps {
  count:  number;
  color:  string;
  labelAr: string;
  onClick: () => void;
}

function StateBubble({ count, color, labelAr, onClick }: StateBubbleProps) {
  if (count === 0) return null;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all hover:opacity-80 active:scale-95"
      style={{ borderColor: `${color}40`, background: `${color}12` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <span className="text-[11px] font-bold" style={{ color }}>
        {count} {labelAr}
      </span>
    </button>
  );
}

export function LifecycleBar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const report = useLifecycleIntelligence();

  if (report.isLoading) {
    return <Skeleton className="h-9 w-full rounded-xl" />;
  }

  const { byState, healthScore } = report;
  const problemCount =
    byState.aging.length + byState.stale.length +
    byState.dormant.length + byState.ghost.length;

  if (problemCount === 0 && healthScore >= 90) return null;

  return (
    <>
      <div className="glass-card px-4 py-3 space-y-2">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              صحة المهام
            </span>
          </div>
          {problemCount > 0 && (
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-0.5 text-[11px] text-primary font-semibold hover:underline"
            >
              مراجعة {problemCount} مهمة
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Health bar */}
        <HealthBar score={healthScore} />

        {/* State bubbles */}
        {problemCount > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <StateBubble
              count={byState.aging.length}
              color={STATE_LABELS.aging.color}
              labelAr={STATE_LABELS.aging.ar}
              onClick={() => setSheetOpen(true)}
            />
            <StateBubble
              count={byState.stale.length}
              color={STATE_LABELS.stale.color}
              labelAr={STATE_LABELS.stale.ar}
              onClick={() => setSheetOpen(true)}
            />
            <StateBubble
              count={byState.dormant.length}
              color={STATE_LABELS.dormant.color}
              labelAr={STATE_LABELS.dormant.ar}
              onClick={() => setSheetOpen(true)}
            />
            <StateBubble
              count={byState.ghost.length}
              color={STATE_LABELS.ghost.color}
              labelAr={STATE_LABELS.ghost.ar}
              onClick={() => setSheetOpen(true)}
            />
          </div>
        )}
      </div>

      <StaleTasksSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
