import type { ProjectZone } from '@/types/projects.types';

const ZONES: { id: ProjectZone; label: string; icon: string; arLabel: string }[] = [
  { id: 'command',   label: 'القيادة',      icon: '🎯', arLabel: 'القيادة' },
  { id: 'work',      label: 'العمل',        icon: '📋', arLabel: 'العمل' },
  { id: 'strategy',  label: 'الاستراتيجية', icon: '🚀', arLabel: 'الاستراتيجية' },
  { id: 'context',   label: 'السياق',       icon: '📝', arLabel: 'السياق' },
  { id: 'resources', label: 'الموارد',      icon: '👥', arLabel: 'الموارد' },
];

interface Props {
  activeZone: ProjectZone;
  onZoneChange: (zone: ProjectZone) => void;
}

export function ZoneNavigation({ activeZone, onZoneChange }: Props) {
  return (
    <div
      dir="rtl"
      role="tablist"
      aria-label="أقسام المشروع"
      style={{
        display: 'flex', gap: '4px',
        borderBottom: '1px solid var(--border, #E5E7EB)',
        marginBottom: '16px', overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {ZONES.map(zone => {
        const isActive = activeZone === zone.id;
        return (
          <button
            key={zone.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`zone-${zone.id}`}
            onClick={() => onZoneChange(zone.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px',
              border: 'none', borderBottom: isActive ? '2px solid #2563EB' : '2px solid transparent',
              background: 'transparent',
              color: isActive ? '#2563EB' : '#6B7280',
              fontSize: '13px', fontWeight: isActive ? 700 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.15s', marginBottom: '-1px',
              minHeight: '44px',
            }}
          >
            <span>{zone.icon}</span>
            <span>{zone.label}</span>
          </button>
        );
      })}
    </div>
  );
}
