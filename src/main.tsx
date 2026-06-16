import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./life-tent-theme.css";
import "./life-tent.css";
import "./i18n";
import { ThemeProvider } from "./hooks/useTheme";
import { initMonitoring, connectMonitoringAdapter } from "./lib/monitoring";
import { initAnalytics } from "./lib/analytics";
import { registerSW } from "virtual:pwa-register";

// ── PWA Service Worker registration ─────────────────────────────────────────
// autoUpdate: SW installs silently; prompts user to reload when new version ready
registerSW({
  onNeedRefresh() {
    // Notify the user a new version is available (toast shown in App via store)
    window.dispatchEvent(new CustomEvent("pwa:update-available"));
  },
  onOfflineReady() {
    console.info("[SW] App ready for offline use");
  },
});

// ── Monitoring (Web Vitals) — runs immediately, lightweight ─────────────────
initMonitoring();

// ── PostHog Analytics — init before render ───────────────────────────────────
initAnalytics();

// ── Sentry — lazy loaded after app mounts, never blocks render ───────────────
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (SENTRY_DSN) {
  import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION ?? "dev",
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
      ],
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1.0,
    });
    connectMonitoringAdapter({
      captureException: (err, ctx) => Sentry.captureException(err, { extra: ctx }),
      captureMessage: (msg, level) => Sentry.captureMessage(msg, level),
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
