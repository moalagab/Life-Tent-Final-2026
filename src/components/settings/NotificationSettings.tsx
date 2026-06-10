import { useLanguage } from '@/hooks/useLanguage';
import { useNotifications } from '@/hooks/useNotifications';
import { Switch } from '@/components/ui/switch';
import { Bell, CalendarDays, CheckSquare, Repeat, AlertCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const PREFS_KEY = 'notification-prefs';

interface NotificationPrefs {
  taskReminders: boolean;
  eventReminders: boolean;
  habitReminders: boolean;
  emailEnabled: boolean;
  emailAddress: string;
}

function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultPrefs();
}

function defaultPrefs(): NotificationPrefs {
  return { taskReminders: true, eventReminders: true, habitReminders: true, emailEnabled: false, emailAddress: '' };
}

function savePrefs(prefs: NotificationPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/** Exported so other hooks can read preferences without the Settings UI being mounted */
export function getNotificationPrefs(): NotificationPrefs {
  return loadPrefs();
}

export function NotificationSettings() {
  const { t, currentLanguage: language } = useLanguage();
  const { enabled, enableNotifications, disableNotifications, permission } = useNotifications();
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [emailDraft, setEmailDraft] = useState(prefs.emailAddress);
  const [savingEmail, setSavingEmail] = useState(false);

  // Persist whenever prefs change
  useEffect(() => { savePrefs(prefs); }, [prefs]);

  const toggle = (key: keyof Pick<NotificationPrefs, 'taskReminders' | 'eventReminders' | 'habitReminders'>) =>
    setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleMasterToggle = async () => {
    if (enabled) {
      disableNotifications();
      toast.success(t('settings.notificationsDisabled'));
    } else {
      const ok = await enableNotifications();
      if (ok) toast.success(t('settings.notificationsEnabled'));
      else toast.error(t('settings.notificationPermissionDenied'));
    }
  };

  const handleSaveEmail = () => {
    if (emailDraft && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft)) {
      toast.error(language === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email address');
      return;
    }
    setSavingEmail(true);
    setPrefs(p => ({ ...p, emailAddress: emailDraft, emailEnabled: !!emailDraft }));
    setTimeout(() => {
      setSavingEmail(false);
      toast.success(language === 'ar' ? 'تم حفظ إعدادات البريد' : 'Email settings saved');
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary/80 dark:text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{t('settings.enableNotifications')}</h4>
              <p className="text-sm text-muted-foreground">{t('settings.notificationsDesc')}</p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={handleMasterToggle} />
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

        {[
          { key: 'taskReminders' as const, icon: CheckSquare, color: 'blue', titleKey: 'settings.taskReminders', descKey: 'settings.taskRemindersDesc' },
          { key: 'eventReminders' as const, icon: CalendarDays, color: 'purple', titleKey: 'settings.eventReminders', descKey: 'settings.eventRemindersDesc' },
          { key: 'habitReminders' as const, icon: Repeat, color: 'emerald', titleKey: 'settings.habitReminders', descKey: 'settings.habitRemindersDesc' },
        ].map(({ key, icon: Icon, color, titleKey, descKey }) => (
          <div key={key} className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{t(titleKey)}</h4>
                <p className="text-sm text-muted-foreground">{t(descKey)}</p>
              </div>
            </div>
            <Switch checked={prefs[key]} onCheckedChange={() => toggle(key)} disabled={!enabled} />
          </div>
        ))}
      </div>

      {/* Email Notifications */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">
              {language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'استلم تذكيرات مهمة عبر البريد' : 'Receive important reminders via email'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
            </Label>
            <Input
              type="email"
              dir="ltr"
              placeholder="you@example.com"
              value={emailDraft}
              onChange={e => setEmailDraft(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSaveEmail} disabled={savingEmail} size="sm">
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </div>
        {prefs.emailEnabled && prefs.emailAddress && (
          <p className="text-xs text-success">
            ✓ {language === 'ar' ? `سيتم إرسال الإشعارات إلى ${prefs.emailAddress}` : `Notifications will be sent to ${prefs.emailAddress}`}
          </p>
        )}
      </div>
    </div>
  );
}
