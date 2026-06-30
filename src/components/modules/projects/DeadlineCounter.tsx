interface Props {
  dueDate: string;
  className?: string;
}

export function DeadlineCounter({ dueDate, className }: Props) {
  const daysLeft = Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysLeft < 0;
  const isUrgent  = daysLeft >= 0 && daysLeft <= 7;
  const isWarning = daysLeft > 7 && daysLeft <= 14;

  const color = isOverdue ? '#EF4444' : isUrgent ? '#F59E0B' : isWarning ? '#D97706' : '#6B7280';
  const bg    = isOverdue ? '#FEE2E2' : isUrgent ? '#FFFBEB' : 'transparent';

  const label = isOverdue
    ? `متأخر ${Math.abs(daysLeft)} يوم`
    : daysLeft === 0 ? 'اليوم'
    : daysLeft === 1 ? 'غداً'
    : `${daysLeft} أيام`;

  return (
    <span
      aria-label={`الموعد النهائي: ${label}`}
      dir="rtl"
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '2px 8px', borderRadius: '6px',
        backgroundColor: bg, color,
        fontSize: '12px', fontWeight: 600,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      ⏰ {label}
    </span>
  );
}
