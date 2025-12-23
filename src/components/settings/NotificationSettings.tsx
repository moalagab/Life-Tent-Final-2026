import { useLanguage } from '@/hooks/useLanguage';
import { useNotifications } from '@/hooks/useNotifications';
import { Switch } from '@/components/ui/switch';
import { Bell, CalendarDays, CheckSquare, Repeat, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function NotificationSettings() {
  const { t } = useLanguage();
  const { enabled, enableNotifications, disableNotifications, permission } = useNotifications();
  const [taskReminders, setTaskReminders] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [habitReminders, setHabitReminders] = useState(true);

  const handleNotificationToggle = async () => {
    if (enabled) {
      disableNotifications();
      toast.success(t('settings.notificationsDisabled'));
    } else {
      const success = await enableNotifications();
      if (success) {
        toast.success(t('settings.notificationsEnabled'));
      } else {
        toast.error(t('settings.notificationPermissionDenied'));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{t('settings.enableNotifications')}</h4>
              <p className="text-sm text-muted-foreground">{t('settings.notificationsDesc')}</p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={handleNotificationToggle} />
        </div>
        
        {permission === 'denied' && (
          <div className="mt-3 flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{t('settings.notificationPermissionDenied')}</span>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground mb-4">{t('settings.notificationTypes')}</h4>
        
        {/* Task Reminders */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{t('settings.taskReminders')}</h4>
              <p className="text-sm text-muted-foreground">{t('settings.taskRemindersDesc')}</p>
            </div>
          </div>
          <Switch 
            checked={taskReminders} 
            onCheckedChange={setTaskReminders}
            disabled={!enabled}
          />
        </div>

        {/* Event Reminders */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{t('settings.eventReminders')}</h4>
              <p className="text-sm text-muted-foreground">{t('settings.eventRemindersDesc')}</p>
            </div>
          </div>
          <Switch 
            checked={eventReminders} 
            onCheckedChange={setEventReminders}
            disabled={!enabled}
          />
        </div>

        {/* Habit Reminders */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{t('settings.habitReminders')}</h4>
              <p className="text-sm text-muted-foreground">{t('settings.habitRemindersDesc')}</p>
            </div>
          </div>
          <Switch 
            checked={habitReminders} 
            onCheckedChange={setHabitReminders}
            disabled={!enabled}
          />
        </div>
      </div>
    </div>
  );
}
