import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  /** Custom fallback UI. Receives the error and a reset function. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * ErrorBoundary — catches unhandled React render errors, logs them,
 * and renders a graceful fallback instead of a blank screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomePage />
 *   </ErrorBoundary>
 *
 *   // Custom fallback:
 *   <ErrorBoundary fallback={(err, reset) => <MyFallback error={err} onRetry={reset} />}>
 *     <SomePage />
 *   </ErrorBoundary>
 */
const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'Unable to preload CSS',
  'ChunkLoadError',
];

const isChunkError = (err: Error) =>
  CHUNK_ERROR_PATTERNS.some(p => err.message?.includes(p) || err.name?.includes(p));

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    // Stale-chunk error after a new deployment → reload once (guard against loops)
    if (isChunkError(error)) {
      const reloadKey = 'eb_chunk_reload';
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
        return { error: null }; // keep the tree alive until reload fires
      }
      sessionStorage.removeItem(reloadKey);
    }
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (isChunkError(error)) return; // already handled above
    logger.error('Unhandled render error', error, {
      componentStack: info.componentStack ?? undefined,
    });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return <DefaultFallback error={error} onReset={this.reset} />;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function DefaultFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const isDev = import.meta.env.DEV;

  return (
    <div
      role="alert"
      className="min-h-screen flex items-center justify-center bg-background p-6"
      dir="rtl"
    >
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
        <p className="text-muted-foreground text-sm">
          نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
        </p>

        <details className="text-start bg-muted rounded-lg p-4 text-xs font-mono overflow-auto max-h-48">
          <summary className="cursor-pointer font-semibold mb-2">
            تفاصيل الخطأ
          </summary>
          <p className="text-destructive break-all">{error.message}</p>
          {isDev && error.stack && (
            <pre className="mt-2 text-muted-foreground whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </details>

        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.assign('/dashboard')}
            className="px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
