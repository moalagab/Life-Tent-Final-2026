import { Bell, Check, Trash2, CheckCircle, Calendar, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'task':
      return <CheckCircle className="w-4 h-4 text-primary" />;
    case 'event':
      return <Calendar className="w-4 h-4 text-blue-500" />;
    case 'habit':
      return <Target className="w-4 h-4 text-green-500" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
};

export function NotificationCenter() {
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{t('notifications.title')}</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={markAllAsRead} title={t('notifications.markAllRead')}>
              <Check className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={clearAll} title={t('notifications.clearAll')}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t('notifications.noNotifications')}</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  'flex items-start gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors',
                  !notification.read && 'bg-primary/5'
                )}
              >
                <div className="mt-0.5">
                  <NotificationIcon type={notification.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {notification.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(notification.timestamp, 'HH:mm')}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
