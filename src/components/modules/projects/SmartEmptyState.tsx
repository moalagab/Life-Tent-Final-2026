const EMPTY_CONFIGS = {
  goals: {
    icon: '🎯',
    title: 'مشروعك يفتقر لاتجاه واضح',
    subtitle: 'الأهداف تحوّل العمل لإنجازات قابلة للقياس',
    primaryCTA: 'AI يقترح أهدافاً',
    secondaryCTA: 'أضف هدفاً يدوياً',
  },
  tasks: {
    icon: '📋',
    title: 'لا مشروع بدون مهام',
    subtitle: 'ابدأ بتحديد أول 3 مهام',
    primaryCTA: 'AI يولّد خطة مهام',
    secondaryCTA: 'إضافة مهمة',
  },
  risks: {
    icon: '⚠️',
    title: 'لا مشروع بدون مخاطر محتملة',
    subtitle: 'تحديد المخاطر مبكراً يمنع المفاجآت',
    primaryCTA: 'AI يُحلل ويقترح مخاطر',
    secondaryCTA: 'أضف خطراً',
  },
  initiatives: {
    icon: '🚀',
    title: 'لا مبادرات مرتبطة بهذا المشروع',
    subtitle: 'المبادرات تحوّل الأهداف إلى خطوات تنفيذية',
    primaryCTA: 'AI يقترح مبادرات',
    secondaryCTA: 'أضف مبادرة',
  },
  activity: {
    icon: '😴',
    title: 'لم يُسجَّل أي نشاط منذ أسبوع',
    subtitle: 'عُد لمسار الإنجاز',
    primaryCTA: 'اعرض المهام المتأخرة',
    secondaryCTA: undefined,
  },
} as const;

type EmptyType = keyof typeof EMPTY_CONFIGS;

interface Props {
  type: EmptyType;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
}

export function SmartEmptyState({ type, onPrimaryAction, onSecondaryAction }: Props) {
  const config = EMPTY_CONFIGS[type];

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '48px 24px', textAlign: 'center', gap: '16px',
      }}
    >
      <div style={{ fontSize: '48px', lineHeight: 1 }}>{config.icon}</div>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground, #111827)', marginBottom: '6px' }}>
          {config.title}
        </div>
        <div style={{ fontSize: '14px', color: '#6B7280' }}>{config.subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={onPrimaryAction}
          style={{
            background: '#2563EB', color: 'white', border: 'none',
            borderRadius: '8px', padding: '10px 20px',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            minHeight: '44px',
          }}
        >
          ⚡ {config.primaryCTA}
        </button>
        {config.secondaryCTA && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            style={{
              background: 'transparent', color: '#2563EB',
              border: '1px solid #2563EB', borderRadius: '8px',
              padding: '10px 20px', fontSize: '14px', cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            {config.secondaryCTA}
          </button>
        )}
      </div>
    </div>
  );
}
