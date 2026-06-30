/**
 * ContextBanner — Ambient mode indicator for the Home page.
 *
 * Shows at the top of the dashboard when context rules are active:
 *   - Mode badge (morning / pressure / deep-work / etc.)
 *   - Up to 4 signal chips (Arabic reasons)
 *   - "إظهار الكل" — override hidden sections
 *   - "✕" — dismiss banner for this session/mode
 *
 * Hidden when:
 *   - Mode is 'midday' or 'review' with low pressure (normal state)
 *   - User has dismissed it for this mode+day
 *   - isOverridden = true (user already tapped "Show all")
 */
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Eye } from 'lucide-react';
import type { UIContextConfig, UIMode } from '@/hooks/useContextAwareness';

// ── Dismiss persistence ────────────────────────────────────────────────────────

const DISMISS_KEY = 'ctx:banner-dismissed-v1';

function getBannerDismissKey(mode: UIMode): string {
  return `${new Date().toDateString()}:${mode}`;
}

function isBannerDismissed(mode: UIMode): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissed = JSON.parse(raw) as string[];
    return dismissed.includes(getBannerDismissKey(mode));
  } catch { return false; }
}

function dismissBanner(mode: UIMode) {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const key = getBannerDismissKey(mode);
    if (!list.includes(key)) {
      // Keep only last 20 entries to avoid localStorage bloat
      list.push(key);
      localStorage.setItem(DISMISS_KEY, JSON.stringify(list.slice(-20)));
    }
  } catch { /* noop */ }
}

// ── Signal chip ────────────────────────────────────────────────────────────────

function SignalChip({ label, accentColor }: { label: string; accentColor: string }) {
  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border"
      style={{
        background:   `${accentColor}15`,
        borderColor:  `${accentColor}35`,
        color:        accentColor,
      }}
    >
      {label}
    </span>
  );
}

// ── Mode accent colors ─────────────────────────────────────────────────────────

const MODE_ACCENT: Record<UIMode, string> = {
  morning:     '#f59e0b',
  'deep-work': '#3b82f6',
  midday:      '#64748b',
  review:      '#6366f1',
  execution:   '#22c55e',
  'wind-down': '#8b5cf6',
  pressure:    '#ef4444',
  celebration: '#10b981',
};

// ── Modes that should always show the banner ───────────────────────────────────

const BANNER_MODES: UIMode[] = [
  'morning', 'deep-work', 'pressure', 'execution', 'wind-down', 'celebration',
];

// ── Main component ─────────────────────────────────────────────────────────────

interface ContextBannerProps {
  context: UIContextConfig;
}

export function ContextBanner({ context }: ContextBannerProps) {
  const { mode, modeLabel, modeEmoji, signals, hiddenSections, isOverridden, override } = context;

  const [dismissed, setDismissed] = useState(() => isBannerDismissed(mode));

  // Re-check dismiss status when mode changes
  useEffect(() => {
    setDismissed(isBannerDismissed(mode));
  }, [mode]);

  const handleDismiss = () => {
    dismissBanner(mode);
    setDismissed(true);
  };

  // Don't show if:
  // - mode is normal (midday/review with no pressure and no hidden sections)
  // - already dismissed
  // - user overrode context (they see everything already)
  const shouldShow =
    BANNER_MODES.includes(mode) &&
    !dismissed &&
    !isOverridden &&
    hiddenSections.length > 0;

  if (!shouldShow) return null;

  const accent = MODE_ACCENT[mode];

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl border text-start w-full',
        'animate-fade-in',
      )}
      style={{
        background:  `${accent}08`,
        borderColor: `${accent}25`,
      }}
    >
      {/* Mode badge */}
      <div
        className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg"
        style={{ background: `${accent}18` }}
      >
        <span className="text-base leading-none">{modeEmoji}</span>
        <span className="text-[11px] font-black" style={{ color: accent }}>
          {modeLabel.ar}
        </span>
      </div>

      {/* Signal chips */}
      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-none">
        {signals.map((s, i) => (
          <SignalChip key={i} label={s} accentColor={accent} />
        ))}
        {hiddenSections.length > 0 && (
          <SignalChip
            label={`${hiddenSections.length} قسم مخفي`}
            accentColor="#64748b"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={override}
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors hover:opacity-80"
          style={{ color: accent, background: `${accent}15` }}
        >
          <Eye className="w-3 h-3" />
          إظهار الكل
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
