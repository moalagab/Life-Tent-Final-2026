import type { HealthStatus } from '@/types/projects.types';

const STATUS_CONFIG: Record<HealthStatus, { label: string; bg: string; text: string; dot: string }> = {
  on_track:    { label: 'على المسار', bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  at_risk:     { label: 'في خطر',     bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  overdue:     { label: 'متأخر',      bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' },
  not_started: { label: 'لم يبدأ',   bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
};

interface Props {
  status: HealthStatus;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function HealthStatusPill({ status, score, size = 'md' }: Props) {
  const cfg      = STATUS_CONFIG[status];
  const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12px';
  const padding  = size === 'sm' ? '2px 8px' : size === 'lg' ? '6px 14px' : '4px 10px';

  return (
    <span
      role="status"
      aria-label={`حالة المشروع: ${cfg.label}`}
      dir="rtl"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding, borderRadius: '20px',
        backgroundColor: cfg.bg, color: cfg.text,
        fontSize, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        backgroundColor: cfg.dot, flexShrink: 0,
      }} />
      {cfg.label}
      {score !== undefined && (
        <span style={{ opacity: 0.65, fontSize: '10px' }}>({score})</span>
      )}
    </span>
  );
}
