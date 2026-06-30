/**
 * PredictivePanel — Forward-looking intelligence UI.
 *
 * Shows probabilistic forecasts with confidence meters.
 * Design language: "the system sees what's coming before you do."
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Eye, AlertTriangle, Info, ChevronRight, ArrowRight,
  CheckCircle2, TrendingDown, Layers, Zap, Clock,
  FolderOpen, RefreshCw, Battery,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usePredictiveEngine,
  type Prediction,
  type PredictionType,
  type PredictionSeverity,
  type PredictionTimeframe,
} from '@/hooks/usePredictiveEngine';

// ── Config maps ────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<PredictionType, React.FC<any>> = {
  task_delay:      Clock,
  project_abandon: FolderOpen,
  pressure_spike:  Layers,
  habit_break:     RefreshCw,
  overload_risk:   Zap,
  energy_drop:     Battery,
};

function getSeverityCfg(isAr: boolean): Record<PredictionSeverity, {
  bar: string; badge: string; badgeText: string; icon: string;
}> {
  return {
    critical: {
      bar:       'bg-red-500',
      badge:     'bg-red-500/12 border-red-500/25 text-red-500',
      badgeText: isAr ? 'حرج' : 'Critical',
      icon:      'text-red-500',
    },
    warning: {
      bar:       'bg-amber-400',
      badge:     'bg-amber-400/12 border-amber-400/25 text-amber-500',
      badgeText: isAr ? 'تحذير' : 'Warning',
      icon:      'text-amber-500',
    },
    info: {
      bar:       'bg-blue-400',
      badge:     'bg-blue-400/10 border-blue-400/20 text-blue-500',
      badgeText: isAr ? 'معلومة' : 'Info',
      icon:      'text-blue-500',
    },
  };
}

function getTimeframeCfg(isAr: boolean): Record<PredictionTimeframe, { label: string; color: string }> {
  return {
    today:     { label: isAr ? 'اليوم'           : 'Today',     color: 'text-red-500 bg-red-500/10'     },
    tomorrow:  { label: isAr ? 'غداً'            : 'Tomorrow',  color: 'text-amber-500 bg-amber-500/10' },
    this_week: { label: isAr ? 'هذا الأسبوع'    : 'This Week', color: 'text-blue-500 bg-blue-500/10'   },
    next_week: { label: isAr ? 'الأسبوع القادم' : 'Next Week', color: 'text-slate-500 bg-slate-500/10' },
  };
}

// ── Confidence meter ───────────────────────────────────────────────────────────

function ConfidenceMeter({ value, severity }: { value: number; severity: PredictionSeverity }) {
  const color =
    severity === 'critical' ? 'bg-red-500' :
    severity === 'warning'  ? 'bg-amber-400' :
    'bg-blue-400';

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[9px] font-black tabular-nums text-muted-foreground">
        {value}%
      </span>
    </div>
  );
}

// ── Risk gauge ─────────────────────────────────────────────────────────────────

function RiskGauge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 70 ? 'text-red-500' :
    score >= 40 ? 'text-amber-500' :
    score >= 15 ? 'text-blue-500' :
    'text-emerald-500';

  const barColor =
    score >= 70 ? 'bg-red-500' :
    score >= 40 ? 'bg-amber-400' :
    score >= 15 ? 'bg-blue-400' :
    'bg-emerald-500';

  const segments = [20, 40, 60, 80, 100];

  return (
    <div className="flex items-center gap-2">
      <div className={cn('text-2xl font-black tabular-nums', color)}>{score}</div>
      <div className="flex-1 space-y-1">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="flex gap-0.5 h-1.5">
          {segments.map(seg => (
            <div
              key={seg}
              className={cn(
                'flex-1 rounded-full transition-all duration-500',
                score >= seg ? barColor : 'bg-muted',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Prediction card ────────────────────────────────────────────────────────────

function PredictionCard({ prediction: p, isAr }: { prediction: Prediction; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const navigate        = useNavigate();
  const severityCfg     = getSeverityCfg(isAr);
  const timeframeCfg    = getTimeframeCfg(isAr);
  const cfg             = severityCfg[p.severity];
  const tfCfg           = timeframeCfg[p.timeframe];
  const Icon            = TYPE_ICON[p.type];

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden transition-all duration-200',
        p.severity === 'critical'
          ? 'border-red-500/20 bg-red-500/[0.02]'
          : p.severity === 'warning'
          ? 'border-amber-400/20 bg-amber-400/[0.02]'
          : 'border-border/40 bg-background/40',
      )}
    >
      {/* Main row */}
      <button
        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-start"
        onClick={() => setOpen(o => !o)}
      >
        <div className={cn('w-0.5 rounded-full self-stretch shrink-0 mt-0.5', cfg.bar)} />
        <Icon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', cfg.icon)} />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-foreground/90 truncate">
              {p.title}
            </span>
            <span className={cn(
              'text-[8px] font-black px-1.5 py-0.5 rounded-full border shrink-0',
              tfCfg.color,
            )}>
              {tfCfg.label}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">
            {p.summary}
          </p>
          <ConfidenceMeter value={p.confidence} severity={p.severity} />
        </div>
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1 transition-transform',
            open && 'rotate-90',
          )}
        />
      </button>

      {/* Expanded: reasons + action */}
      {open && (
        <div className="px-4 pb-3 pt-1 border-t border-border/30 space-y-2.5">
          <div className="space-y-1">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
              {isAr ? 'لماذا هذا التوقع؟' : 'Why this forecast?'}
            </div>
            {p.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className={cn('w-1 h-1 rounded-full mt-1.5 shrink-0', cfg.bar)} />
                <span className="text-[10px] text-foreground/75 leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
          {p.preventable && p.actionLabel && (
            <button
              onClick={e => { e.stopPropagation(); navigate(p.actionRoute ?? '/'); }}
              className={cn(
                'flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-colors',
                p.severity === 'critical'
                  ? 'text-red-500 bg-red-500/10 hover:bg-red-500/15'
                  : p.severity === 'warning'
                  ? 'text-amber-600 bg-amber-400/10 hover:bg-amber-400/15'
                  : 'text-blue-500 bg-blue-400/10 hover:bg-blue-400/15',
              )}
            >
              {p.actionLabel}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function PredictiveSkeleton() {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-3 items-center">
        <Skeleton className="h-8 w-10 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="space-y-1.5 p-3 rounded-xl border border-border/30">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-2 w-24" />
          <Skeleton className="h-1 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function PredictiveEmpty({ isAr }: { isAr: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6">
      <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
      <p className="text-xs text-muted-foreground text-center">
        {isAr ? 'لا توقعات سلبية الآن — المسار سليم' : 'No negative forecasts right now — you\'re on track'}
      </p>
    </div>
  );
}

// ── Filter tabs ────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'critical' | 'warning' | 'info';

// ── Main component ─────────────────────────────────────────────────────────────

export function PredictivePanel() {
  const { predictions, riskScore, riskLabel, isLoading } = usePredictiveEngine();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const [filter, setFilter] = useState<FilterTab>('all');

  const FILTER_TABS: { id: FilterTab; label: string }[] = [
    { id: 'all',      label: isAr ? 'الكل'    : 'All'      },
    { id: 'critical', label: isAr ? 'حرج'     : 'Critical' },
    { id: 'warning',  label: isAr ? 'تحذير'   : 'Warning'  },
    { id: 'info',     label: isAr ? 'معلومة'  : 'Info'     },
  ];

  const filtered = filter === 'all'
    ? predictions
    : predictions.filter(p => p.severity === filter);

  const criticalCount = predictions.filter(p => p.severity === 'critical').length;
  const warningCount  = predictions.filter(p => p.severity === 'warning').length;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-border/40">
        <div className="relative shrink-0">
          <Eye className="w-4 h-4 text-indigo-500" />
          {criticalCount > 0 && (
            <span className="absolute -top-1 -end-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
        <span className="text-sm font-black text-foreground">
          {isAr ? 'الطبقة التنبؤية' : 'Predictive Layer'}
        </span>
        <span className="text-[10px] text-muted-foreground/60 flex-1">Predictive Layer</span>

        {/* Badge counts */}
        {criticalCount > 0 && (
          <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
            {criticalCount} {isAr ? 'حرج' : 'critical'}
          </span>
        )}
        {warningCount > 0 && (
          <span className="text-[9px] font-black text-amber-500 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
            {warningCount} {isAr ? 'تحذير' : 'warning'}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? <PredictiveSkeleton /> : (
          <>
            {/* Risk gauge */}
            <RiskGauge score={riskScore} label={riskLabel} />

            {/* Filter tabs — only show if predictions exist */}
            {predictions.length > 0 && (
              <div className="flex gap-1">
                {FILTER_TABS.map(tab => {
                  const count =
                    tab.id === 'all'      ? predictions.length :
                    tab.id === 'critical' ? criticalCount :
                    tab.id === 'warning'  ? warningCount :
                    predictions.filter(p => p.severity === 'info').length;

                  if (count === 0 && tab.id !== 'all') return null;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all',
                        filter === tab.id
                          ? 'bg-foreground/10 text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {tab.label}
                      <span className="text-[8px] opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Prediction list */}
            {filtered.length === 0 ? (
              <PredictiveEmpty isAr={isAr} />
            ) : (
              <div className="space-y-2">
                {filtered.map(p => (
                  <PredictionCard key={p.id} prediction={p} isAr={isAr} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
