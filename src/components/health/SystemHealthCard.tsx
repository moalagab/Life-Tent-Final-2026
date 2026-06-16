import { useMemo } from 'react';
import { Activity, Target, Wallet, Zap, TrendingUp } from 'lucide-react';
import { useSystemHealth, type HealthDimension } from '@/hooks/useSystemHealth';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// ── SVG ring ──────────────────────────────────────────────────────────────────

const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function HealthRing({
  score,
  color,
  label,
}: {
  score: number;
  color: string;
  label: string;
}) {
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg
        width="140"
        height="140"
        viewBox="0 0 120 120"
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx="60" cy="60" r={RADIUS}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx="60" cy="60" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-black tabular-nums leading-none"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Dimension row ────────────────────────────────────────────────────────────

const DIM_ICONS: Record<string, typeof Activity> = {
  focus:     Zap,
  execution: Activity,
  finance:   Wallet,
  goals:     Target,
};

function DimensionRow({ dim }: { dim: HealthDimension }) {
  const Icon = DIM_ICONS[dim.id] ?? TrendingUp;

  return (
    <div className="flex items-center gap-2.5" dir="rtl">
      {/* Icon */}
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${dim.color}20`, border: `1px solid ${dim.color}30` }}
      >
        <Icon className="w-3 h-3" style={{ color: dim.color }} />
      </div>

      {/* Label */}
      <span className="text-[12px] font-semibold text-foreground/70 w-14 shrink-0">
        {dim.label}
      </span>

      {/* Bar */}
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width:      `${dim.score}%`,
            background: dim.color,
            transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
          }}
        />
      </div>

      {/* Score */}
      <span
        className="text-[11px] font-black w-9 text-left tabular-nums shrink-0"
        style={{ color: dim.color }}
      >
        {dim.score}%
      </span>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function HealthSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-border/40 bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-24 h-3 rounded" />
      </div>
      <div className="flex gap-5 items-center">
        <Skeleton className="w-[140px] h-[140px] rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-full h-5 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function SystemHealthCard() {
  const health = useSystemHealth();

  // useMemo MUST be before any early return (Rules of Hooks)
  const weakest = useMemo(
    () => health.dimensions.length > 0
      ? [...health.dimensions].sort((a, b) => a.score - b.score)[0]
      : null,
    [health.dimensions],
  );

  if (health.isLoading) return <HealthSkeleton />;
  if (!weakest) return null;

  return (
    <div
      className="w-full rounded-2xl border bg-card p-4 overflow-hidden"
      style={{ borderColor: `${health.overallColor}40` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4" dir="rtl">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" style={{ color: health.overallColor }} />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            صحة النظام
          </span>
        </div>

        {/* Weakest dim hint */}
        {weakest.grade === 'poor' || weakest.grade === 'fair' ? (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
            style={{
              color:            weakest.color,
              borderColor:      `${weakest.color}30`,
              backgroundColor:  `${weakest.color}15`,
            }}
          >
            {weakest.label} يحتاج تحسين
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/60">{health.overallLabel}</span>
        )}
      </div>

      {/* Body: ring + dimensions */}
      <div className="flex items-center gap-5">
        {/* Ring */}
        <div className="shrink-0">
          <HealthRing
            score={health.overall}
            color={health.overallColor}
            label={health.overallLabel}
          />
        </div>

        {/* Dimensions */}
        <div className="flex-1 space-y-2.5 min-w-0">
          {health.dimensions.map(dim => (
            <DimensionRow key={dim.id} dim={dim} />
          ))}
        </div>
      </div>

      {/* Footer insight */}
      <p
        className="mt-3 pt-3 border-t border-border/30 text-[11px] leading-snug"
        style={{ color: `${health.overallColor}cc` }}
        dir="rtl"
      >
        {weakest.insight} · {health.dimensions.find(d => d.score === Math.max(...health.dimensions.map(d => d.score)))?.insight}
      </p>
    </div>
  );
}
