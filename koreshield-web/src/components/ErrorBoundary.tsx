import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorKind = 'render-error' | 'chunk-load' | 'extension-interference';

interface ClientErrorRecord {
  id: string;
  kind: ErrorKind;
  message: string;
  route: string;
  timestamp: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorKind: ErrorKind;
  referenceId: string | null;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((state: State) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

const LAST_ERROR_STORAGE_KEY = 'koreshield:last-route-error';

function generateErrorReference() {
  return `ks-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getCurrentRoute() {
  if (typeof window === 'undefined') {
    return '/';
  }

  return `${window.location.pathname}${window.location.search}`;
}

function classifyError(error: Error): ErrorKind {
  const message = `${error.name} ${error.message} ${error.stack ?? ''}`.toLowerCase();

  if (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('loading module from')
  ) {
    return 'chunk-load';
  }

  if (
    message.includes('lockdown-install') ||
    message.includes('metamask') ||
    message.includes('moz-extension://') ||
    message.includes('chrome-extension://') ||
    message.includes('extension context invalidated')
  ) {
    return 'extension-interference';
  }

  return 'render-error';
}

function storeClientError(errorRecord: ClientErrorRecord) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(LAST_ERROR_STORAGE_KEY, JSON.stringify(errorRecord));
  } catch {
    // Ignore storage failures in private mode or restricted browsers.
  }
}

function getStoredClientError(): ClientErrorRecord | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(LAST_ERROR_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as ClientErrorRecord;
  } catch {
    return null;
  }
}

function getErrorGuidance(kind: ErrorKind) {
  if (kind === 'chunk-load') {
    return 'This usually happens after a deployment or browser cache mismatch. A hard refresh should reload the latest app bundle.';
  }

  if (kind === 'extension-interference') {
    return 'A browser extension or injected script appears to have interfered with the page. Try refreshing or testing in a clean browser profile.';
  }

  return 'This page hit an unexpected application error while rendering. Refreshing should recover, but the reference below will help us trace it if it returns.';
}

function RouteErrorFallback({
  errorKind,
  referenceId,
}: {
  errorKind: ErrorKind;
  referenceId: string | null;
}) {
  const errorRecord = getStoredClientError();
  const route = errorRecord?.route ?? getCurrentRoute();
  const resolvedReferenceId = referenceId ?? errorRecord?.id ?? 'unavailable';
  const guidance = getErrorGuidance(errorKind ?? errorRecord?.kind ?? 'render-error');

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-lg border border-border p-6 text-center">
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Failed to load page
        </h2>
        <p className="text-muted-foreground mb-3">
          {guidance}
        </p>
        <div className="rounded-lg border border-border bg-background/70 p-3 text-left text-sm text-muted-foreground mb-4">
          <p><span className="text-foreground font-medium">Route:</span> {route}</p>
          <p><span className="text-foreground font-medium">Reference:</span> {resolvedReferenceId}</p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
          >
            Refresh Page
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors border border-border"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorKind: 'render-error',
      referenceId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorKind: classifyError(error),
      referenceId: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorRecord: ClientErrorRecord = {
      id: generateErrorReference(),
      kind: classifyError(error),
      message: error.message,
      route: getCurrentRoute(),
      timestamp: new Date().toISOString(),
    };

    console.error('ErrorBoundary caught an error:', errorRecord, error, errorInfo);
    storeClientError(errorRecord);

    this.setState({
      error,
      errorInfo,
      errorKind: errorRecord.kind,
      referenceId: errorRecord.id,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorKind: 'render-error',
      referenceId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state);
        }

        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-2xl w-full bg-card rounded-2xl shadow-xl border border-border p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Something went wrong
                </h1>
                <p className="text-muted-foreground">
                  We apologize for the inconvenience
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Error Details:
                </h2>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-sm font-mono text-red-500 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              </div>
            )}

            {this.state.errorInfo && import.meta.env.DEV && (
              <details className="mb-6">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground mb-2">
                  Stack Trace (Development Only)
                </summary>
                <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors border border-border"
              >
                Go Home
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                If this problem persists, please{' '}
                contact support at{' '}
                <a
                  href="mailto:support@koreshield.com"
                  className="text-primary hover:underline"
                >
                  support@koreshield.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Route-level error boundary for specific pages
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(state) => (
        <RouteErrorFallback
          errorKind={state.errorKind}
          referenceId={state.referenceId}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
