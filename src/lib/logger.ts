/**
 * Structured logger for Life Tent OS.
 *
 * In development: logs to console with context.
 * In production: sends errors to the monitoring endpoint (configurable).
 *
 * Usage:
 *   logger.info('User signed in', { userId });
 *   logger.warn('Query took too long', { query, ms });
 *   logger.error('Payment failed', error, { orderId });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  timestamp: string;
}

type MonitoringTransport = (entry: LogEntry) => void;

class Logger {
  private transports: MonitoringTransport[] = [];
  private isDev = import.meta.env.DEV;

  /** Register an external transport (e.g. Sentry, custom endpoint). */
  addTransport(fn: MonitoringTransport): void {
    this.transports.push(fn);
  }

  private log(
    level: LogLevel,
    message: string,
    errorOrContext?: Error | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    const isError = errorOrContext instanceof Error;
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      error: isError ? errorOrContext : undefined,
      context: isError ? context : (errorOrContext as Record<string, unknown>),
    };

    if (this.isDev) {
      const style = {
        debug: 'color: #888',
        info:  'color: #2563eb',
        warn:  'color: #d97706; font-weight: bold',
        error: 'color: #dc2626; font-weight: bold',
      }[level];

      const args: unknown[] = [`%c[${level.toUpperCase()}] ${message}`, style];
      if (entry.context) args.push(entry.context);
      if (entry.error) args.push(entry.error);

      // eslint-disable-next-line no-console
      console[level === 'debug' ? 'log' : level](...args);
    }

    // Send to registered transports (error + warn in prod)
    if (!this.isDev || level === 'error' || level === 'warn') {
      for (const transport of this.transports) {
        try {
          transport(entry);
        } catch { /* never let transport crash the app */ }
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
    this.log('error', message, err, context);
  }
}

export const logger = new Logger();
