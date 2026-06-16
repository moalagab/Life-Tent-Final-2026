import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowLeft, Sparkles } from 'lucide-react';
import { useEmptyStateIntelligence, type SetupStep } from '@/hooks/useEmptyStateIntelligence';
import { cn } from '@/lib/utils';

// ── Color map (tailwind classes) ──────────────────────────────────────────────

const COLOR_MAP: Record<string, { border: string; text: string; bg: string; btn: string }> = {
  violet: {
    border: 'border-violet-500/25',
    text:   'text-violet-400',
    bg:     'bg-violet-500/15',
    btn:    'bg-violet-600 hover:bg-violet-500',
  },
  blue: {
    border: 'border-blue-500/25',
    text:   'text-blue-400',
    bg:     'bg-blue-500/15',
    btn:    'bg-blue-600 hover:bg-blue-500',
  },
  emerald: {
    border: 'border-emerald-500/25',
    text:   'text-emerald-400',
    bg:     'bg-emerald-500/15',
    btn:    'bg-emerald-600 hover:bg-emerald-500',
  },
  amber: {
    border: 'border-amber-500/25',
    text:   'text-amber-400',
    bg:     'bg-amber-500/15',
    btn:    'bg-amber-600 hover:bg-amber-500',
  },
  rose: {
    border: 'border-rose-500/25',
    text:   'text-rose-400',
    bg:     'bg-rose-500/15',
    btn:    'bg-rose-600 hover:bg-rose-500',
  },
};

// ── Step pill (checklist row) ─────────────────────────────────────────────────

function StepRow({
  step,
  isNext,
  onNavigate,
}: {
  step:       SetupStep;
  isNext:     boolean;
  onNavigate: (route: string) => void;
}) {
  const colors = COLOR_MAP[step.color] ?? COLOR_MAP.blue;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2.5 rounded-xl transition-all',
        isNext && !step.done
          ? cn('border', colors.border, `bg-gradient-to-l ${step.bgClass}`)
          : 'opacity-60',
      )}
      dir="rtl"
    >
      {/* Icon */}
      {step.done ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : (
        <Circle
          className={cn('w-4 h-4 shrink-0', isNext ? colors.text : 'text-muted-foreground/30')}
        />
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-[12px] font-bold leading-tight', step.done ? 'text-muted-foreground/50 line-through' : 'text-foreground')}>
          {step.title}
        </p>
        {isNext && !step.done && (
          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{step.description}</p>
        )}
      </div>

      {/* CTA button (only for next step) */}
      {isNext && !step.done && (
        <button
          onClick={() => onNavigate(step.route)}
          className={cn(
            'shrink-0 flex items-center gap-1 text-[11px] font-black text-white',
            'px-3 py-1.5 rounded-lg transition-colors',
            colors.btn,
          )}
        >
          {step.cta}
          <ArrowLeft className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function EmptyStateIntelligence() {
  const navigate = useNavigate();
  const {
    isNewUser, emptyLayers, allSteps, nextStep, doneCount, totalSteps, isLoading,
  } = useEmptyStateIntelligence();

  // Don't render if all data exists or still loading
  if (isLoading || emptyLayers.length === 0) return null;

  const pct = Math.round((doneCount / totalSteps) * 100);

  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-border/40 bg-card overflow-hidden',
        'animate-in fade-in slide-in-from-top-2 duration-500',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/20" dir="rtl">
        <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-violet-500" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-black text-foreground leading-tight">
            {isNewUser ? 'مرحباً — لم تبدأ بعد' : 'النظام يحتاج اكتمالاً'}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            {isNewUser
              ? 'اتبع الخطوات التالية لتفعيل النظام كاملاً'
              : `${doneCount} من ${totalSteps} طبقات مفعّلة`}
          </p>
        </div>
        {/* Progress ring */}
        <div className="shrink-0 relative w-10 h-10">
          <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
            <circle
              cx="20" cy="20" r="16"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-violet-400">
            {pct}%
          </span>
        </div>
      </div>

      {/* Steps list */}
      <div className="px-3 py-3 space-y-1">
        {allSteps.map(step => (
          <StepRow
            key={step.id}
            step={step}
            isNext={nextStep?.id === step.id}
            onNavigate={navigate}
          />
        ))}
      </div>

      {/* Bottom hint */}
      {!isNewUser && emptyLayers.length <= 2 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-muted-foreground/50 text-center" dir="rtl">
            النظام يعمل بكامل طاقته عندما تكتمل جميع الطبقات
          </p>
        </div>
      )}
    </div>
  );
}
