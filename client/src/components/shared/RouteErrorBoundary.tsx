import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from './ErrorState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';
import { CopyButton } from './CopyButton';

/**
 * RouteErrorBoundary
 *
 * Specialized Error Boundary for React Router 6+ Data Routers.
 * Catches 404s, 403s, and other routing-level failures that occur
 * before the component tree is even rendered.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const errorText =
    error instanceof Error ? error.stack || error.message : JSON.stringify(error, null, 2);

  // If it's a known router error (e.g. 404, 403)
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
          <ErrorState
            title="404 - Page Not Found"
            description="The resource you are looking for does not exist or has been moved to a new location."
            className="max-w-md border-none shadow-none"
            onRetry={() => navigate(getPath(APP_PATHS.dashboard()))}
          />
        </div>
      );
    }

    if (error.status === 401) {
      return (
        <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
          <ErrorState
            title="401 - Unauthorized"
            description="You do not have permission to access this page. Please log in to continue."
            className="max-w-md border-none shadow-none"
            onRetry={() => navigate(APP_PATHS.auth.login())}
          />
        </div>
      );
    }

    if (error.status === 503) {
      return (
        <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
          <ErrorState
            title="Maintenance"
            description="Our systems are currently undergoing scheduled maintenance. Please check back later."
            className="max-w-md border-none shadow-none"
          />
        </div>
      );
    }
  }

  // Fallback for unexpected runtime errors caught by the router
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-4 bg-background text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-10 w-10" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Unexpected Application Error</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        A critical error occurred within the application core. Our engineering team has been
        notified.
      </p>

      <div className="flex gap-4">
        <Button variant="default" onClick={() => window.location.reload()} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reload Application
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(getPath(APP_PATHS.dashboard()))}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>

      {import.meta.env.DEV && (
        <div className="group relative mt-12 w-full max-w-2xl text-left rounded-lg border bg-muted font-mono text-xs text-muted-foreground overflow-hidden">
          <div className="sticky top-0 flex items-center justify-between p-3 border-b bg-muted/95 backdrop-blur-md z-10">
            <p className="font-bold text-destructive uppercase tracking-widest px-1">
              Developer Diagnostics:
            </p>
            <CopyButton
              value={errorText || ''}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 shadow-sm"
            />
          </div>
          <div className="p-4 overflow-auto max-h-[400px] whitespace-pre-wrap">
            <pre>{errorText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
