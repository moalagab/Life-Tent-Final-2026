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
    // Auto-apply the new service worker immediately so users always run
    // the latest version without having to manually click an update button.
    updateServiceWorker(true);
  }, [needRefresh, updateServiceWorker]);

  // Suppress unused-variable warning — kept for future use
  void currentLanguage;

  return null;
}
