import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { FolderKanban, Layers, Database, Archive } from 'lucide-react';

interface ProjectTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProjectTabs({ activeTab, onTabChange }: ProjectTabsProps) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'projects',  label: 'المشاريع', icon: FolderKanban, from: 'from-purple-500', to: 'to-indigo-600', activeBorder: 'border-purple-400/40' },
    { id: 'areas',     label: 'المجالات', icon: Layers,       from: 'from-sky-500',    to: 'to-blue-600',   activeBorder: 'border-sky-400/40'    },
    { id: 'resources', label: 'الموارد',  icon: Database,     from: 'from-emerald-500',to: 'to-teal-600',   activeBorder: 'border-emerald-400/40' },
    { id: 'archives',  label: 'الأرشيف',  icon: Archive,      from: 'from-slate-500',  to: 'to-slate-600',  activeBorder: 'border-slate-400/40'  },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-4 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-2xl transition-all duration-200 active:scale-95 border',
                isActive
                  ? cn('bg-card/80 border-border/50 shadow-sm', tab.activeBorder)
                  : 'border-transparent bg-muted/30 hover:bg-muted/50',
              )}
            >
              <Icon className={cn("w-7 h-7", isActive ? "text-primary" : "text-muted-foreground")} strokeWidth={isActive ? 2 : 1.75} />
              <p className={cn(
                'text-xs font-semibold text-center leading-tight',
                isActive ? 'text-foreground' : 'text-foreground/70',
              )}>
                {tab.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
