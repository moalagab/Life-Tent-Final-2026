import type { ActivityEvent } from '@/types/projects.types';

const EVENT_CONFIG: Record<string, { icon: string; color: string }> = {
  health_changed:  { icon: '💊', color: '#F59E0B' },
  task_completed:  { icon: '✅', color: '#10B981' },
  task_created:    { icon: '📝', color: '#2563EB' },
  goal_added:      { icon: '🎯', color: '#A855F7' },
  risk_added:      { icon: '⚠️', color: '#EF4444' },
  risk_mitigated:  { icon: '🛡️', color: '#10B981' },
  phase_changed:   { icon: '📍', color: '#2563EB' },
  milestone:       { icon: '🏆', color: '#F59E0B' },
  default:         { icon: '📌', color: '#6B7280' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return 'الآن';
  if (mins < 60)  return `منذ ${mins} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7)   return `منذ ${days} يوم`;
  return new Date(dateStr).toLocaleDateString('ar-SA');
}

interface Props {
  events: ActivityEvent[];
  loading?: boolean;
}

export function ActivityFeed({ events, loading }: Props) {
  if (loading) {
    return (
      <div dir="rtl" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E5E7EB', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, background: '#E5E7EB', borderRadius: 4, marginBottom: 6, width: '70%' }} />
              <div style={{ height: 11, background: '#F3F4F6', borderRadius: 4, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div dir="rtl" style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
        لا يوجد نشاط مسجّل بعد
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ padding: '8px 0' }} role="log" aria-label="سجل نشاط المشروع">
      {events.map((event, index) => {
        const cfg = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.default;
        const isLast = index === events.length - 1;

        return (
          <div
            key={event.id}
            style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 16px', position: 'relative' }}
          >
            {/* Timeline line */}
            {!isLast && (
              <div style={{
                position: 'absolute',
                top: '42px', right: '27px',
                width: '1px', height: 'calc(100% - 10px)',
                background: '#E5E7EB',
                zIndex: 0,
              }} />
            )}

            {/* Icon bubble */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: `${cfg.color}15`,
              border: `1px solid ${cfg.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0, zIndex: 1,
              position: 'relative',
            }}>
              {cfg.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '13px', fontWeight: 500,
                color: 'var(--foreground, #111827)',
                margin: 0, lineHeight: 1.4,
              }}>
                {event.title}
              </p>
              {event.description && (
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0', lineHeight: 1.4 }}>
                  {event.description}
                </p>
              )}
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }}>
                {timeAgo(event.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
