import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Standard Error Display for ERP SaaS.
 * Provides a clinical, enterprise-grade feedback UI when a component or query fails.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred while loading this section.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in zoom-in duration-300',
        className,
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <AlertCircle className="h-10 w-10" />
      </div>

      <h3 className="text-xl font-semibold tracking-tight mb-2">{title}</h3>

      <p className="text-muted-foreground max-w-xs mb-8 text-sm leading-relaxed">{description}</p>

      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2 transition-all hover:pr-6">
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
