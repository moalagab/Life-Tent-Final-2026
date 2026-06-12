import { useLanguage } from '@/hooks/useLanguage';
import { useProjectNotifications } from '@/hooks/useProjectNotifications';
import { cn } from '@/lib/utils';
import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';

interface ProjectNotificationsProps {
  onProjectClick?: (projectId: string) => void;
}

export function ProjectNotifications({ onProjectClick }: ProjectNotificationsProps) {
  const { currentLanguage } = useLanguage();
  const notifications = useProjectNotifications();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  if (visibleNotifications.length === 0) return null;

  const iconMap = {
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle,
  };

  const colorMap = {
    warning: 'bg-warning/10 text-warning border-warning/20',
    info: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
  };

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">
          {currentLanguage === 'ar' ? 'إشعارات المشاريع' : 'Project Notifications'}
        </h3>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {visibleNotifications.length}
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {visibleNotifications.slice(0, 6).map((notification) => {
          const Icon = iconMap[notification.type];
          
          return (
            <div
              key={notification.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:opacity-80',
                colorMap[notification.type]
              )}
              onClick={() => notification.projectId && onProjectClick?.(notification.projectId)}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="text-xs opacity-80 truncate">{notification.message}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(notification.id);
                }}
                className="p-1 rounded hover:bg-background/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
