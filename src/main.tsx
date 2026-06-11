import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { ThemeProvider } from "./hooks/useTheme";
import { initMonitoring, connectMonitoringAdapter } from "./lib/monitoring";

// ── Sentry ───────────────────────────────────────────────────────────────────
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (SENTRY_DSN) {
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
}

// ── Monitoring (Web Vitals) ──────────────────────────────────────────────────
initMonitoring();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
