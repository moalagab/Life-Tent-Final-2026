import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { ThemeProvider } from "./hooks/useTheme";
import { initMonitoring, connectMonitoringAdapter } from "./lib/monitoring";

// ── Monitoring (Web Vitals) — runs immediately, lightweight ─────────────────
initMonitoring();

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
