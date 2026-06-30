import type { ProjectPhase, PhaseProgress } from '@/types/projects.types';

const PHASES: { key: ProjectPhase; label: string }[] = [
  { key: 'initiation', label: 'تأسيس' },
  { key: 'planning',   label: 'تخطيط' },
  { key: 'execution',  label: 'تنفيذ' },
  { key: 'monitoring', label: 'مراقبة' },
  { key: 'closing',    label: 'إغلاق' },
];

const PHASE_COLORS: Record<ProjectPhase, string> = {
  initiation:  '#6B7280',
  planning:    '#2563EB',
  execution:   '#A855F7',
  monitoring:  '#F59E0B',
  closing:     '#10B981',
};

interface Props {
  currentPhase: ProjectPhase;
  phaseProgress: PhaseProgress;
  onPhaseClick?: (phase: ProjectPhase) => void;
}

export function PhaseIntelligenceBar({ currentPhase, phaseProgress, onPhaseClick }: Props) {
  const currentIndex = PHASES.findIndex(p => p.key === currentPhase);

  return (
    <div
      dir="rtl"
      style={{ padding: '8px 0', overflowX: 'auto' }}
      role="navigation"
      aria-label="مراحل المشروع"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 'max-content' }}>
        {PHASES.map((phase, index) => {
          const progress  = phaseProgress?.[phase.key] ?? 0;
          const isCurrent = phase.key === currentPhase;
          const isPast    = index < currentIndex;
          const color     = PHASE_COLORS[phase.key];
          const deg       = progress * 3.6;

          return (
            <div key={phase.key} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => onPhaseClick?.(phase.key)}
                aria-label={`مرحلة ${phase.label}: ${progress}%`}
                aria-current={isCurrent ? 'step' : undefined}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  padding: '6px 10px', borderRadius: '8px', border: 'none',
                  background: isCurrent ? `${color}20` : isPast ? `${color}10` : 'transparent',
                  cursor: onPhaseClick ? 'pointer' : 'default',
                  outline: isCurrent ? `2px solid ${color}` : 'none',
                  outlineOffset: '1px',
                  minWidth: '72px', transition: 'all 0.15s',
                  opacity: isPast ? 0.85 : 1,
                }}
              >
                {/* Progress ring */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: `conic-gradient(${color} ${deg}deg, #E5E7EB ${deg}deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: 'var(--background, #fff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, color,
                  }}>
                    {isPast && progress === 100 ? '✓' : `${progress}%`}
                  </div>
                </div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: isCurrent ? 700 : 400,
                  color: isCurrent ? color : '#374151',
                }}>
                  {phase.label}
                </span>
              </button>

              {index < PHASES.length - 1 && (
                <span style={{ color: '#9CA3AF', fontSize: '12px', margin: '0 2px' }}>←</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
