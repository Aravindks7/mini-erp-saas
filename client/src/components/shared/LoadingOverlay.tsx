import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

/**
 * Global or context-specific Loading Overlay.
 * Blocks interaction and provides visual feedback during high-latency operations.
 */
export default function LoadingOverlay({
  isVisible,
  message = 'Syncing...',
  className,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-300',
        className,
      )}
    >
      <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-card border border-border shadow-2xl">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary/10" />
        </div>
        {message && (
          <p className="text-sm font-medium text-foreground tracking-wide animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
