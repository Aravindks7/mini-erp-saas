import * as React from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RetryButtonProps extends ButtonProps {
  onRetry: () => void;
  label?: string;
  isLoading?: boolean;
}

/**
 * RetryButton Component
 * A standardized component for manual error recovery across the ERP.
 */
export const RetryButton = React.forwardRef<HTMLButtonElement, RetryButtonProps>(
  ({ onRetry, label = 'Retry', isLoading = false, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isLoading || props.disabled}
        className={cn('gap-2', className)}
        {...props}
      >
        <RefreshCcw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        {label}
      </Button>
    );
  },
);

RetryButton.displayName = 'RetryButton';
