import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { FolderKanban, Layers, Database, Archive, Lightbulb } from 'lucide-react';

interface ProjectTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProjectTabs({ activeTab, onTabChange }: ProjectTabsProps) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'projects', label: t('common.projects'), icon: FolderKanban },
    { id: 'areas', label: t('projects.areas'), icon: Layers },
    { id: 'resources', label: t('projects.resources'), icon: Database },
    { id: 'pipeline', label: t('projects.pipeline') || 'Pipeline', icon: Lightbulb },
    { id: 'archives', label: t('projects.archives'), icon: Archive },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive 
                ? 'bg-gradient-gold text-primary-foreground shadow-gold-glow-sm' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
