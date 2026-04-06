import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: 'outline' | 'ghost' | 'muted' | 'default';
}

/**
 * Section Component
 * A consistent wrapper for page segments with title, description, and optional actions.
 * Simplifies the standard ERP Card structure.
 */
export const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ className, title, description, actions, variant = 'default', children, ...props }, ref) => {
    const isGhost = variant === 'ghost';

    return (
      <Card
        ref={ref}
        className={cn(
          'overflow-hidden',
          {
            'border-none shadow-none bg-transparent': isGhost,
            'bg-muted/30': variant === 'muted',
            'border-muted-foreground/10': variant === 'outline',
          },
          className,
        )}
        {...props}
      >
        {(title || description || actions) && (
          <CardHeader
            className={cn(
              'flex flex-row items-center justify-between space-y-0 pb-6',
              isGhost && 'px-0 pt-0',
            )}
          >
            <div className="grid gap-1">
              {title && <CardTitle className="text-xl font-bold tracking-tight">{title}</CardTitle>}
              {description && (
                <CardDescription className="text-sm text-muted-foreground">
                  {description}
                </CardDescription>
              )}
            </div>
            {actions && <div className="flex items-center space-x-2">{actions}</div>}
          </CardHeader>
        )}
        <CardContent className={cn(isGhost && 'p-0')}>{children}</CardContent>
      </Card>
    );
  },
);

Section.displayName = 'Section';
