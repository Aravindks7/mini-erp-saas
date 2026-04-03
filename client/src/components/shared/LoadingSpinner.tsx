import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'muted' | 'white';
  label?: string;
  center?: boolean;
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const variantMap = {
  primary: 'text-primary',
  muted: 'text-muted-foreground/40',
  white: 'text-white',
};

/**
 * Lightweight Loading Spinner for ERP SaaS.
 * Essential for providing localized feedback inside buttons, inputs, and small containers.
 */
export function LoadingSpinner({
  className,
  size = 'md',
  variant = 'primary',
  label,
  center = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Loader2
        className={cn('animate-spin', sizeMap[size], variantMap[variant])}
        aria-hidden="true"
      />
      {label && (
        <span className="text-xs font-medium text-muted-foreground animate-pulse">{label}</span>
      )}
    </div>
  );

  if (center) {
    return <div className="flex h-full w-full items-center justify-center p-4">{spinner}</div>;
  }

  return spinner;
}
