import type { EnrichedProject } from '@/types/projects.types';
import { HealthStatusPill } from './HealthStatusPill';

interface Props {
  project: EnrichedProject;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  onRisksClick: () => void;
}

export function ProjectHealthDashboard({
  project, totalTasks, completedTasks, overdueTasks, onRisksClick,
}: Props) {
  const daysLeft = project.due_date
    ? Math.ceil((new Date(project.due_date).getTime() - Date.now()) / 86_400_000)
    : null;

  const timeValue =
    daysLeft === null ? '—'
    : daysLeft < 0    ? `متأخر ${Math.abs(daysLeft)}ي`
    : `${daysLeft} يوم`;

  const forecastOverdue =
    project.forecasted_end && project.due_date &&
    new Date(project.forecasted_end) > new Date(project.due_date);

  const cards = [
    {
      id: 'progress', icon: '🎯', title: 'التقدم',
      value: `${project.progress ?? 0}%`,
      sub: project.velocity > 0 ? `↑ ${project.velocity.toFixed(1)} مهمة/يوم` : 'لا سرعة بعد',
      subColor: project.velocity > 0 ? '#10B981' : '#9CA3AF',
      alert: false, onClick: undefined as (() => void) | undefined,
    },
    {
      id: 'tasks', icon: '📋', title: 'المهام',
      value: `${completedTasks}/${totalTasks}`,
      sub: overdueTasks > 0 ? `${overdueTasks} متأخرة` : 'لا تأخير',
      subColor: overdueTasks > 0 ? '#EF4444' : '#10B981',
      alert: overdueTasks > 0, onClick: undefined as (() => void) | undefined,
    },
    {
      id: 'time', icon: '⏰', title: 'الوقت',
      value: timeValue,
      sub: project.forecasted_end
        ? `توقع: ${new Date(project.forecasted_end).toLocaleDateString('ar-SA')}`
        : '—',
      subColor: forecastOverdue ? '#EF4444' : '#6B7280',
      alert: project.health_status === 'overdue', onClick: undefined as (() => void) | undefined,
    },
    {
      id: 'risks', icon: '⚠️', title: 'المخاطر',
      value: String((project.risk_count?.high ?? 0) + (project.risk_count?.medium ?? 0)),
      sub: `${project.risk_count?.high ?? 0} عالية / ${project.risk_count?.medium ?? 0} متوسطة`,
      subColor: (project.risk_count?.high ?? 0) > 0 ? '#EF4444' : '#F59E0B',
      alert: (project.risk_count?.high ?? 0) > 0, onClick: onRisksClick,
    },
  ];

  return (
    <div dir="rtl" role="region" aria-label="لوحة صحة المشروع" style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <HealthStatusPill status={project.health_status} score={project.health_score} size="md" />
        {project.ai_brief && (
          <span style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
            {project.ai_brief}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={card.onClick}
            role={card.onClick ? 'button' : undefined}
            tabIndex={card.onClick ? 0 : undefined}
            onKeyDown={card.onClick ? (e) => e.key === 'Enter' && card.onClick?.() : undefined}
            style={{
              background: card.alert ? '#FEF2F2' : 'var(--card, #F9FAFB)',
              border: `1px solid ${card.alert ? '#FCA5A5' : 'var(--border, #E5E7EB)'}`,
              borderRadius: '12px', padding: '14px',
              cursor: card.onClick ? 'pointer' : 'default',
              transition: 'box-shadow 0.15s, transform 0.1s',
              minWidth: 0,
            }}
            onMouseEnter={(e) => {
              if (card.onClick) {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = '0 4px 12px rgba(19,28,50,0.12)';
                el.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow = 'none';
              el.style.transform = 'none';
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{card.icon}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground, #111827)', lineHeight: 1.2 }}>
              {card.value}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{card.title}</div>
            <div style={{ fontSize: '11px', color: card.subColor, marginTop: '5px', fontWeight: 500 }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
