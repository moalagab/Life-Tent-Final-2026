/**
 * useContextAwareness — Context-Aware UI Engine
 *
 * Combines four signal streams to decide WHAT the UI should show and HOW:
 *
 *   1. Time of day    → base mode (morning / deep-work / midday / review / execution / wind-down)
 *   2. Task pressure  → overdue count + lifecycle stale/ghost count
 *   3. Behavior       → energy estimate, risk level, overcommitment, completedToday
 *   4. Financial      → (placeholder — can be wired to finance data later)
 *
 * Output (`UIContextConfig`):
 *   - mode              → current UI mode (may override time-based mode if pressure is high)
 *   - pressureLevel     → low / medium / high / crisis
 *   - hiddenSections    → section keys that should be completely hidden
 *   - focusOnlyMode     → true in morning: show only FocusEngine + quick actions
 *   - accentScheme      → Tailwind class string for background tint
 *   - signals           → Arabic strings explaining why this mode is active
 *   - isOverridden      → user tapped "Show everything" — ignore hiding rules
 *   - override/reset    → toggle override (persisted per day in localStorage)
 *
 * Non-destructive: user can always dismiss the banner or click "Show all" to
 * override context rules. Override resets at midnight.
 */
import { useState, useCallback, useMemo } from 'react';
import { useBehaviorEngine } from './useBehaviorEngine';
import { useLifecycleIntelligence } from './useLifecycleIntelligence';
import { useTasks } from './useTasks';
import { differenceInDays, parseISO } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────

export type UIMode =
  | 'morning'       // 05-09: single decision, hide clutter
  | 'deep-work'     // 09-12: work focus, no finance/library
  | 'midday'        // 12-14: full dashboard
  | 'review'        // 14-17: all sections, insights prominent
  | 'execution'     // 17-21: output tracking, lite library
  | 'wind-down'     // 21-05: tomorrow planning
  | 'pressure'      // override: high task debt, reduce UI
  | 'celebration';  // override: great output day

export type PressureLevel = 'low' | 'medium' | 'high' | 'crisis';

export interface UIContextConfig {
  mode:            UIMode;
  pressureLevel:   PressureLevel;
  hiddenSections:  string[];     // 'finance' | 'library' | 'ai-intelligence' | 'rhythm' | 'overview'
  focusOnlyMode:   boolean;      // morning: collapse everything except FocusEngine
  accentScheme:    string;       // tailwind classes for container background tint
  modeLabel:       { ar: string; en: string };
  modeEmoji:       string;
  signals:         string[];     // Arabic reason chips shown in ContextBanner
  isOverridden:    boolean;
  override:        () => void;
  resetOverride:   () => void;
  isLoading:       boolean;
}

// ── localStorage helpers ───────────────────────────────────────────────────────

const OVERRIDE_KEY  = 'ctx:override-v1';
const TODAY         = () => new Date().toDateString();

function loadOverride(): boolean {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return false;
    const { date } = JSON.parse(raw) as { date: string };
    return date === TODAY();
  } catch { return false; }
}

function saveOverride(on: boolean) {
  if (on) localStorage.setItem(OVERRIDE_KEY, JSON.stringify({ date: TODAY() }));
  else    localStorage.removeItem(OVERRIDE_KEY);
}

// ── Mode configuration ─────────────────────────────────────────────────────────

const MODE_CFG: Record<UIMode, {
  label:     { ar: string; en: string };
  emoji:     string;
  accent:    string;
  hidden:    string[];
  focusOnly: boolean;
}> = {
  morning:     {
    label:     { ar: 'وضع الصباح',       en: 'Morning Mode'     },
    emoji:     '🌅',
    accent:    'from-amber-500/[0.06] via-transparent',
    hidden:    ['finance', 'library', 'ai-intelligence'],
    focusOnly: true,
  },
  'deep-work': {
    label:     { ar: 'وقت العمل العميق',  en: 'Deep Work'        },
    emoji:     '🔵',
    accent:    'from-blue-600/[0.05] via-transparent',
    hidden:    ['finance', 'library'],
    focusOnly: false,
  },
  midday:      {
    label:     { ar: 'منتصف اليوم',      en: 'Midday'           },
    emoji:     '☀️',
    accent:    '',
    hidden:    [],
    focusOnly: false,
  },
  review:      {
    label:     { ar: 'وقت المراجعة',     en: 'Review Mode'      },
    emoji:     '🔍',
    accent:    'from-indigo-500/[0.04] via-transparent',
    hidden:    [],
    focusOnly: false,
  },
  execution:   {
    label:     { ar: 'وضع الإنجاز',      en: 'Execution Mode'   },
    emoji:     '⚡',
    accent:    'from-green-600/[0.05] via-transparent',
    hidden:    ['library'],
    focusOnly: false,
  },
  'wind-down': {
    label:     { ar: 'وقت التخطيط',      en: 'Wind Down'        },
    emoji:     '🌙',
    accent:    'from-violet-600/[0.06] via-transparent',
    hidden:    [],
    focusOnly: false,
  },
  pressure:    {
    label:     { ar: 'وضع الضغط العالي', en: 'High Pressure'    },
    emoji:     '🔴',
    accent:    'from-red-600/[0.06] via-transparent',
    hidden:    ['finance', 'library'],
    focusOnly: false,
  },
  celebration: {
    label:     { ar: 'يوم إنتاجي ممتاز', en: 'Great Day!'       },
    emoji:     '🎯',
    accent:    'from-emerald-500/[0.07] via-transparent',
    hidden:    ['library'],
    focusOnly: false,
  },
};

// ── Time → base mode ───────────────────────────────────────────────────────────

function getTimeMode(): UIMode {
  const h = new Date().getHours();
  if (h >= 5  && h <  9)  return 'morning';
  if (h >= 9  && h < 12)  return 'deep-work';
  if (h >= 12 && h < 14)  return 'midday';
  if (h >= 14 && h < 17)  return 'review';
  if (h >= 17 && h < 21)  return 'execution';
  return 'wind-down';
}

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useContextAwareness(): UIContextConfig {
  const [isOverridden, setIsOverridden] = useState<boolean>(() => loadOverride());

  const { data: profile, isLoading: profileLoading } = useBehaviorEngine();
  const { data: tasks = [],  isLoading: tasksLoading } = useTasks();
  const lifecycle = useLifecycleIntelligence();

  const override      = useCallback(() => { saveOverride(true);  setIsOverridden(true);  }, []);
  const resetOverride = useCallback(() => { saveOverride(false); setIsOverridden(false); }, []);

  const config = useMemo((): Omit<UIContextConfig, 'isOverridden' | 'override' | 'resetOverride' | 'isLoading'> => {
    // ── Signals ──
    const signals: string[] = [];
    const now = new Date();

    // Task pressure signals
    const activeTasks = tasks.filter(t =>
      t.status !== 'done' && !t.archived_at
    );
    const overdueTasks = activeTasks.filter(t => {
      if (!t.due_date) return false;
      return differenceInDays(now, parseISO(t.due_date)) > 0;
    });
    const overdueCnt = overdueTasks.length;
    const staleCnt   = lifecycle.byState.stale.length + lifecycle.byState.dormant.length;
    const ghostCnt   = lifecycle.byState.ghost.length;

    // Behavior signals
    const energy       = profile?.energyEstimate   ?? 3;
    const riskLevel    = profile?.todayRiskLevel    ?? 'low';
    const overcommit   = profile?.overcommitmentScore ?? 0;
    const completed    = profile?.completedToday    ?? 0;

    // ── Pressure level ──
    let pressureLevel: PressureLevel = 'low';

    if (overdueCnt > 5 || (energy <= 2 && riskLevel === 'high') || overcommit > 80) {
      pressureLevel = 'crisis';
    } else if (overdueCnt > 2 || riskLevel === 'high' || (staleCnt > 10 && energy <= 2)) {
      pressureLevel = 'high';
    } else if (overdueCnt > 0 || energy <= 2 || staleCnt > 5) {
      pressureLevel = 'medium';
    }

    // ── Build signal chips ──
    if (energy <= 2)        signals.push('طاقة منخفضة');
    if (energy >= 5)        signals.push('طاقة عالية');
    if (overdueCnt > 0)     signals.push(`${overdueCnt} مهمة متأخرة`);
    if (staleCnt > 5)       signals.push(`${staleCnt} مهمة راكدة`);
    if (ghostCnt > 0)       signals.push(`${ghostCnt} شبح`);
    if (completed >= 5)     signals.push(`${completed} مهمة منجزة`);
    if (overcommit > 70)    signals.push('جدولة مكتظة');
    if (riskLevel === 'high') signals.push('خطر عالٍ اليوم');
    if (profile?.todayRiskLevel === 'low' && energy >= 4 && overdueCnt === 0) {
      signals.push('يوم مثالي');
    }

    // ── Determine final mode ──
    const timeMode = getTimeMode();
    let mode: UIMode = timeMode;

    // Pressure overrides time-based mode (but not morning — morning always wins)
    if (timeMode !== 'morning' && (pressureLevel === 'crisis' || pressureLevel === 'high')) {
      mode = 'pressure';
    }

    // Celebration override (great day, low pressure, good energy)
    if (completed >= 7 && pressureLevel === 'low' && energy >= 4 && timeMode !== 'morning') {
      mode = 'celebration';
    }

    const cfg           = MODE_CFG[mode];
    const hiddenSections = [...cfg.hidden];

    // Additional energy-based hiding (medium pressure)
    if (pressureLevel === 'medium' && energy <= 2) {
      if (!hiddenSections.includes('finance')) hiddenSections.push('finance');
    }

    return {
      mode,
      pressureLevel,
      hiddenSections,
      focusOnlyMode: cfg.focusOnly,
      accentScheme:  cfg.accent,
      modeLabel:     cfg.label,
      modeEmoji:     cfg.emoji,
      signals:       signals.slice(0, 4), // max 4 chips
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, tasks, lifecycle.byState, lifecycle.isLoading]);

  return {
    ...config,
    isOverridden,
    override,
    resetOverride,
    isLoading: profileLoading || tasksLoading || lifecycle.isLoading,
  };
}
