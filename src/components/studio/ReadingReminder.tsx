import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useCurrentlyReading } from '@/hooks/useMedia';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ReadingReminder() {
  const { currentLanguage } = useLanguage();
  const { data: profile } = useProfile();
  const { data: currentlyReading } = useCurrentlyReading();
  const updateProfile = useUpdateProfile();
  
  const [isOpen, setIsOpen] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (profile) {
      setReminderEnabled(profile.reading_reminder_enabled || false);
      setReminderTime(profile.reading_reminder_time || '20:00');
    }
  }, [profile]);

  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error(currentLanguage === 'ar' ? 'المتصفح لا يدعم الإشعارات' : 'Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setHasPermission(granted);
    
    if (!granted) {
      toast.error(currentLanguage === 'ar' ? 'تم رفض إذن الإشعارات' : 'Notification permission denied');
    }
    
    return granted;
  };

  const handleToggleReminder = async (enabled: boolean) => {
    if (enabled && !hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }

    setReminderEnabled(enabled);
    
    try {
      await updateProfile.mutateAsync({
        reading_reminder_enabled: enabled,
        reading_reminder_time: reminderTime,
      });
      toast.success(
        enabled 
          ? (currentLanguage === 'ar' ? 'تم تفعيل التذكير' : 'Reminder enabled')
          : (currentLanguage === 'ar' ? 'تم إلغاء التذكير' : 'Reminder disabled')
      );
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const handleSaveTime = async () => {
    try {
      await updateProfile.mutateAsync({
        reading_reminder_enabled: reminderEnabled,
        reading_reminder_time: reminderTime,
      });
      toast.success(currentLanguage === 'ar' ? 'تم حفظ الوقت' : 'Time saved');
      setIsOpen(false);
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
  };

  // Schedule notification check
  useEffect(() => {
    if (!reminderEnabled || !hasPermission) return;

    const checkTime = () => {
      const now = new Date();
      const [hours, minutes] = reminderTime.split(':').map(Number);
      
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        if (currentlyReading && currentlyReading.length > 0) {
          const book = currentlyReading[0];
          new Notification(
            currentLanguage === 'ar' ? '📚 وقت القراءة!' : '📚 Reading Time!',
            {
              body: currentLanguage === 'ar' 
                ? `أكمل قراءة "${book.title}"`
                : `Continue reading "${book.title}"`,
              icon: '/favicon.ico',
            }
          );
        } else {
          new Notification(
            currentLanguage === 'ar' ? '📚 وقت القراءة!' : '📚 Reading Time!',
            {
              body: currentLanguage === 'ar' 
                ? 'حان وقت القراءة اليومية'
                : 'Time for your daily reading',
              icon: '/favicon.ico',
            }
          );
        }
      }
    };

    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminderEnabled, reminderTime, hasPermission, currentlyReading, currentLanguage]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {reminderEnabled ? (
            <Bell className="w-4 h-4 text-primary" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
          {currentLanguage === 'ar' ? 'التذكيرات' : 'Reminders'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {currentLanguage === 'ar' ? 'تذكيرات القراءة' : 'Reading Reminders'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                reminderEnabled ? 'bg-primary/20' : 'bg-muted'
              )}>
                <Bell className={cn(
                  'w-5 h-5',
                  reminderEnabled ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <Label className="text-foreground font-medium">
                  {currentLanguage === 'ar' ? 'تذكير يومي' : 'Daily Reminder'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' 
                    ? 'تلقي إشعار للقراءة يومياً' 
                    : 'Get notified to read daily'}
                </p>
              </div>
            </div>
            <Switch 
              checked={reminderEnabled} 
              onCheckedChange={handleToggleReminder}
            />
          </div>

          {/* Time Selector */}
          <div className={cn(
            'p-4 rounded-xl border border-border transition-opacity',
            !reminderEnabled && 'opacity-50 pointer-events-none'
          )}>
            <Label className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {currentLanguage === 'ar' ? 'وقت التذكير' : 'Reminder Time'}
            </Label>
            <Input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Currently Reading Preview */}
          {currentlyReading && currentlyReading.length > 0 && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-2">
                {currentLanguage === 'ar' ? 'سيذكرك بـ:' : 'Will remind you about:'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg">📘</span>
                <p className="text-sm font-medium text-foreground truncate">
                  {currentlyReading[0].title}
                </p>
              </div>
            </div>
          )}

          {/* Permission Warning */}
          {!hasPermission && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary/80 text-xs">
              {currentLanguage === 'ar' 
                ? 'يجب السماح بالإشعارات لتفعيل التذكيرات'
                : 'Notification permission required for reminders'}
            </div>
          )}

          <Button onClick={handleSaveTime} className="w-full" disabled={!reminderEnabled}>
            {currentLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
