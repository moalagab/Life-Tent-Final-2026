/**
 * Error monitoring & performance instrumentation for Life Tent OS.
 *
 * Provider-agnostic: plug in any error tracker via addMonitoringTransport().
 *
 * Sentry integration (optional):
 *   1. npm install @sentry/react
 *   2. Set VITE_SENTRY_DSN in .env
 *   3. Call connectSentry() before initMonitoring()
 *
 * Web Vitals (LCP / CLS / FCP / TTFB) are always reported to the logger.
 */

import { logger } from './logger';
import { capture } from './analytics';

// ─── External transport hook ─────────────────────────────────────────────────

interface MonitoringAdapter {
  captureException: (error: Error, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, level: 'warning' | 'info') => void;
}

let adapter: MonitoringAdapter | null = null;

/**
 * Register an external monitoring provider (e.g. Sentry).
 * Call this before initMonitoring().
 *
 * @example
 * import * as Sentry from '@sentry/react';
 * Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
 * connectMonitoringAdapter({
 *   captureException: (err, ctx) => Sentry.captureException(err, { extra: ctx }),
 *   captureMessage: (msg, level) => Sentry.captureMessage(msg, level),
 * });
 */
export function connectMonitoringAdapter(a: MonitoringAdapter): void {
  adapter = a;
  logger.addTransport((entry) => {
    if (!adapter) return;
    if (entry.level === 'error') {
      adapter.captureException(
        entry.error ?? new Error(entry.message),
        entry.context
      );
    } else if (entry.level === 'warn') {
      adapter.captureMessage(entry.message, 'warning');
    }
  });
}

// ─── Web Vitals ──────────────────────────────────────────────────────────────

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

function rateMetric(name: string, value: number): VitalMetric['rating'] {
  const thresholds: Record<string, [number, number]> = {
    LCP:  [2500, 4000],
    FID:  [100,  300],
    CLS:  [0.1,  0.25],
    FCP:  [1800, 3000],
    TTFB: [800,  1800],
    INP:  [200,  500],
  };
  const [good, poor] = thresholds[name] ?? [Infinity, Infinity];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function observeWebVitals(): void {
  if (!('PerformanceObserver' in window)) return;

  const reportVital = (name: string, value: number) => {
    const rating = rateMetric(name, value);
    const metric: VitalMetric = { name, value: Math.round(value), rating };
    logger.info(`Web Vital: ${name}`, { ...metric });
  };

  // LCP
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
      };
      reportVital('LCP', last.renderTime ?? last.loadTime ?? 0);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* browser may not support */ }

  // CLS
  try {
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!e.hadRecentInput) clsValue += e.value ?? 0;
      }
      reportVital('CLS', clsValue);
    }).observe({ type: 'layout-shift', buffered: true });
  } catch { /* browser may not support */ }

  // FCP
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          reportVital('FCP', entry.startTime);
        }
      }
    }).observe({ type: 'paint', buffered: true });
  } catch { /* browser may not support */ }

  // TTFB
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const nav = entry as PerformanceNavigationTiming;
        reportVital('TTFB', nav.responseStart - nav.requestStart);
      }
    }).observe({ type: 'navigation', buffered: true });
  } catch { /* browser may not support */ }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Call once on app startup (in main.tsx). */
export function initMonitoring(): void {
  observeWebVitals();
  logger.info('Monitoring initialised', { env: import.meta.env.MODE });
}

/** Track a custom user action for analytics (PostHog + local log). */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  logger.debug(`Event: ${name}`, properties);
  capture(name, properties);
}

/** Time a synchronous operation and log if it exceeds the threshold. */
export function timeSync<T>(label: string, fn: () => T, warnMs = 100): T {
  const t0 = performance.now();
  const result = fn();
  const ms = performance.now() - t0;
  if (ms > warnMs) logger.warn(`Slow sync: ${label}`, { ms: Math.round(ms) });
  return result;
}

/** Time an async operation and log if it exceeds the threshold. */
export async function timeAsync<T>(
  label: string,
  fn: () => Promise<T>,
  warnMs = 1000
): Promise<T> {
  const t0 = performance.now();
  const result = await fn();
  const ms = performance.now() - t0;
  if (ms > warnMs) logger.warn(`Slow async: ${label}`, { ms: Math.round(ms) });
  return result;
}
