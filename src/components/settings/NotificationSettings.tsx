import { useLanguage } from '@/hooks/useLanguage';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Bell, CalendarDays, CheckSquare, Repeat, AlertCircle, Mail, Smartphone, Send, Loader2, CheckCircle2 } from 'lucide-react';
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
// eslint-disable-next-line react-refresh/only-export-components
export function getNotificationPrefs(): NotificationPrefs {
  return loadPrefs();
}

export function NotificationSettings() {
  const { t, currentLanguage: language } = useLanguage();
  const { enabled, enableNotifications, disableNotifications, permission } = useNotifications();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, isLoading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushSubscription();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [emailDraft, setEmailDraft] = useState(prefs.emailAddress);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingPush, setTestingPush]   = useState(false);
  const [testPushDone, setTestPushDone] = useState(false);

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

  const handleTestPush = async () => {
    if (!user || testingPush) return;
    setTestingPush(true);
    try {
      const { error } = await supabase.functions.invoke('send-push', {
        body: {
          user_id: user.id,
          title:   language === 'ar' ? '✅ إشعار تجريبي' : '✅ Test Notification',
          body:    language === 'ar' ? 'إشعارات الجهاز تعمل بشكل صحيح!' : 'Device push notifications are working!',
          url:     '/settings',
        },
      });
      if (error) throw error;
      setTestPushDone(true);
      toast.success(language === 'ar' ? 'تم إرسال الإشعار التجريبي' : 'Test notification sent');
      setTimeout(() => setTestPushDone(false), 3000);
    } catch {
      toast.error(language === 'ar' ? 'فشل إرسال الإشعار — تحقق من إعدادات VAPID' : 'Push failed — check VAPID configuration');
    } finally {
      setTestingPush(false);
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
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20/10 to-orange-500/10 border border-primary/20">
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

      {/* Push Notifications (VAPID) */}
      {pushSupported && (
        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">
                  {language === 'ar' ? 'إشعارات الجهاز (Push)' : 'Device Push Notifications'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar'
                    ? 'تلقّ إشعارات حتى عندما يكون التطبيق مغلقاً'
                    : 'Receive notifications even when the app is closed'}
                </p>
              </div>
            </div>
            <Switch
              checked={pushSubscribed}
              disabled={pushLoading || !enabled}
              onCheckedChange={async (checked) => {
                if (checked) {
                  const ok = await pushSubscribe();
                  if (ok) toast.success(language === 'ar' ? 'تم تفعيل إشعارات الجهاز' : 'Device notifications enabled');
                  else    toast.error(language === 'ar' ? 'تعذّر تفعيل الإشعارات' : 'Could not enable push notifications');
                } else {
                  await pushUnsubscribe();
                  toast.success(language === 'ar' ? 'تم إيقاف إشعارات الجهاز' : 'Device notifications disabled');
                }
              }}
            />
          </div>

          {/* Status row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${pushSubscribed ? 'bg-success' : 'bg-muted-foreground/40'}`} />
              {pushSubscribed
                ? (language === 'ar' ? 'مشترك — الإشعارات مفعّلة' : 'Subscribed — notifications active')
                : (language === 'ar' ? 'غير مشترك' : 'Not subscribed')}
            </div>
            {pushSubscribed && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={testingPush || !enabled}
                onClick={handleTestPush}
              >
                {testingPush
                  ? <Loader2 className="w-3 h-3 animate-spin me-1" />
                  : testPushDone
                  ? <CheckCircle2 className="w-3 h-3 text-success me-1" />
                  : <Send className="w-3 h-3 me-1" />}
                {language === 'ar' ? 'إشعار تجريبي' : 'Test push'}
              </Button>
            )}
          </div>

          {!import.meta.env.VITE_VAPID_PUBLIC_KEY && (
            <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {language === 'ar'
                  ? 'VITE_VAPID_PUBLIC_KEY غير مضبوط في .env — راجع إعدادات الذكاء الاصطناعي للتعليمات'
                  : 'VITE_VAPID_PUBLIC_KEY not set in .env — see AI settings for instructions'}
              </span>
            </div>
          )}
        </div>
      )}

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
