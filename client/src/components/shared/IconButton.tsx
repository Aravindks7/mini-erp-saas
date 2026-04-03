import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface IconButtonProps extends ButtonProps {
  icon: React.ElementType;
  label: string;
  iconClassName?: string;
  showTooltip?: boolean;
}

/**
 * IconButton Component
 * A domain-agnostic button wrapper for icon-only actions with standard accessibility (ARIA labels and Tooltips).
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, className, iconClassName, showTooltip = true, ...props }, ref) => {
    const button = (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', className)}
        aria-label={label}
        {...props}
      >
        <Icon className={cn('h-4 w-4', iconClassName)} />
      </Button>
    );

    if (!showTooltip) return button;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

IconButton.displayName = 'IconButton';
