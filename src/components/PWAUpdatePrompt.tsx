import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Detects when a new Service Worker is ready and shows a toast
 * prompting the user to reload and get the latest version.
 */
export function PWAUpdatePrompt() {
  const { currentLanguage } = useLanguage();

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 minutes
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;

    const msg = currentLanguage === 'ar'
      ? 'يتوفر تحديث جديد للتطبيق'
      : 'A new version is available';
    const actionLabel = currentLanguage === 'ar' ? 'تحديث الآن' : 'Update now';

    toast(msg, {
      duration: Infinity,
      action: {
        label: actionLabel,
        onClick: () => updateServiceWorker(true),
      },
    });
  }, [needRefresh, currentLanguage, updateServiceWorker]);

  return null;
}
