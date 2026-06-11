/**
 * Push event handler — injected into the Service Worker.
 *
 * Workbox's generated SW (via vite-plugin-pwa) does not handle push events.
 * Register this handler in vite.config.ts via `additionalManifestEntries`
 * or include it in `importScripts` inside `injectManifest` mode.
 *
 * For `generateSW` mode (current setup) use the `additionalManifestEntries`
 * approach or switch to `injectManifest` for full control.
 *
 * This file is loaded via a custom Service Worker that wraps the generated SW.
 */

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Life Tent', body: event.data.text() };
  }

  const options = {
    body:    data.body  || '',
    icon:    data.icon  || '/favicon.ico',
    badge:   '/favicon.ico',
    data:    { url: data.url || '/dashboard' },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open',    title: 'فتح التطبيق' },
      { action: 'dismiss', title: 'إغلاق' },
    ],
    requireInteraction: false,
    tag: data.tag || 'life-tent-notification',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Life Tent', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
