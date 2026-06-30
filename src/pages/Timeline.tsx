import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useGlobalTimeline, TimelineEntry, TimelineEntryType } from '@/hooks/useGlobalTimeline';
import { useLanguage } from '@/hooks/useLanguage';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Activity, CheckSquare, FolderKanban, Target, FileText,
  BookOpen, Flame, Film, Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TYPE_CFG: Record<TimelineEntryType, {
  icon: typeof Activity;
  labelAr: string;
  labelEn: string;
  iconColor: string;
  badgeBg: string;
}> = {
  task:      { icon: CheckSquare,  labelAr: 'مهمة',    labelEn: 'Task',     iconColor: 'text-blue-500',    badgeBg: 'bg-blue-500/10 text-blue-500'    },
  project:   { icon: FolderKanban, labelAr: 'مشروع',   labelEn: 'Project',  iconColor: 'text-green-500',   badgeBg: 'bg-green-500/10 text-green-500'   },
  goal:      { icon: Target,       labelAr: 'هدف',     labelEn: 'Goal',     iconColor: 'text-purple-500',  badgeBg: 'bg-purple-500/10 text-purple-500'  },
  habit_log: { icon: Flame,        labelAr: 'عادة',    labelEn: 'Habit',    iconColor: 'text-orange-500',  badgeBg: 'bg-orange-500/10 text-orange-500'  },
  resource:  { icon: FileText,     labelAr: 'مورد',    labelEn: 'Resource', iconColor: 'text-amber-500',   badgeBg: 'bg-amber-500/10 text-amber-500'    },
  media:     { icon: Film,         labelAr: 'ميديا',   labelEn: 'Media',    iconColor: 'text-pink-500',    badgeBg: 'bg-pink-500/10 text-pink-500'      },
};

const ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  created:   { ar: 'أُنشئ',  en: 'Created'   },
  completed: { ar: 'اكتمل', en: 'Completed'  },
  archived:  { ar: 'أُرشف', en: 'Archived'   },
  logged:    { ar: 'سُجّل', en: 'Logged'     },
};

type FilterType = 'all' | TimelineEntryType;

const FILTERS: { type: FilterType; ar: string; en: string }[] = [
  { type: 'all',       ar: 'الكل',   en: 'All'      },
  { type: 'task',      ar: 'مهام',   en: 'Tasks'    },
  { type: 'project',   ar: 'مشاريع', en: 'Projects' },
  { type: 'goal',      ar: 'أهداف',  en: 'Goals'    },
  { type: 'habit_log', ar: 'عادات',  en: 'Habits'   },
  { type: 'resource',  ar: 'موارد',  en: 'Resources'},
  { type: 'media',     ar: 'ميديا',  en: 'Media'    },
];

function getDayLabel(dateStr: string, isAr: boolean): string {
  const d = new Date(dateStr);
  if (isToday(d))     return isAr ? 'اليوم' : 'Today';
  if (isYesterday(d)) return isAr ? 'أمس' : 'Yesterday';
  if (isThisWeek(d))  return format(d, 'EEEE', { locale: isAr ? ar : undefined });
  return format(d, 'dd MMM yyyy', { locale: isAr ? ar : undefined });
}

function groupEntries(entries: TimelineEntry[], isAr: boolean) {
  const groups: { dayKey: string; label: string; items: TimelineEntry[] }[] = [];
  const map = new Map<string, number>();
  for (const e of entries) {
    const dayKey = format(new Date(e.date), 'yyyy-MM-dd');
    if (map.has(dayKey)) {
      groups[map.get(dayKey)!].items.push(e);
    } else {
      map.set(dayKey, groups.length);
      groups.push({ dayKey, label: getDayLabel(e.date, isAr), items: [e] });
    }
  }
  return groups;
}

function EntryRow({ entry, isAr, onClick }: { entry: TimelineEntry; isAr: boolean; onClick: () => void }) {
  const cfg = TYPE_CFG[entry.type];
  const Icon = cfg.icon;
  const actionLabel = ACTION_LABELS[entry.action];
  const time = format(new Date(entry.date), 'HH:mm');

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 active:scale-[0.98] transition-all text-start group"
    >
      {/* Icon */}
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.badgeBg.split(' ')[0])}>
        <Icon className={cn('w-4 h-4', cfg.iconColor)} strokeWidth={1.75} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-snug group-hover:text-primary transition-colors">
          {entry.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', cfg.badgeBg)}>
            {isAr ? cfg.labelAr : cfg.labelEn}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {isAr ? actionLabel.ar : actionLabel.en}
          </span>
        </div>
      </div>

      {/* Time */}
      <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">{time}</span>
    </button>
  );
}

export default function Timeline() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { data: entries, isLoading } = useGlobalTimeline(30);

  const filtered = entries?.filter(e => activeFilter === 'all' || e.type === activeFilter) ?? [];
  const groups = groupEntries(filtered, isAr);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-primary" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {isAr ? 'السجل الزمني' : 'Timeline'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'كل نشاطاتك في مكان واحد' : 'All your activity in one place'}
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {FILTERS.map(f => (
            <button
              key={f.type}
              onClick={() => setActiveFilter(f.type)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                activeFilter === f.type
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted/80',
              )}
            >
              {isAr ? f.ar : f.en}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Activity className="w-12 h-12 text-muted-foreground/20" />
            <p className="text-muted-foreground text-sm">
              {isAr ? 'لا توجد نشاطات بعد' : 'No activity yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map(group => (
              <div key={group.dayKey} className="space-y-1">
                {/* Day label */}
                <div className="flex items-center gap-2 px-1 mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-[10px] text-muted-foreground/60">{group.items.length}</span>
                </div>

                {/* Entries */}
                <div className="glass-card divide-y divide-border/30 overflow-hidden">
                  {group.items.map(entry => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      isAr={isAr}
                      onClick={() => entry.route && navigate(entry.route)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
