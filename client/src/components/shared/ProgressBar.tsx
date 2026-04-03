import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** Current progress value (0 to 100). If omitted, renders indeterminate mode. */
  value?: number;
  /** Height of the progress bar in pixels. Defaults to 2px for a sleek look. */
  height?: number;
  /** Color class for the progress indicator. Defaults to primary. */
  colorClass?: string;
  /** Position at the top of the container/viewport. */
  isTop?: boolean;
  className?: string;
}

/**
 * ProgressBar Component
 * A premium, non-blocking feedback indicator for ERP async tasks.
 * Support for both determinate and indeterminate (loading) states.
 */
export function ProgressBar({
  value,
  height = 2,
  colorClass = 'bg-primary',
  isTop = false,
  className,
}: ProgressBarProps) {
  const isIndeterminate = value === undefined;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn(
        'relative w-full overflow-hidden bg-muted/30',
        isTop && 'fixed top-0 left-0 z-50',
        className,
      )}
      style={{ height: `${height}px` }}
    >
      <div
        className={cn(
          'h-full transition-all duration-500 ease-in-out',
          colorClass,
          isIndeterminate && 'animate-progress-indeterminate absolute w-full',
        )}
        style={{
          width: isIndeterminate ? '100%' : `${Math.min(100, Math.max(0, value))}%`,
        }}
      />
    </div>
  );
}

/* Add to index.css:
@keyframes progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-progress-indeterminate {
  animation: progress-indeterminate 1.5s infinite linear;
}
*/
