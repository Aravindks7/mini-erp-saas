import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
  children?: React.ReactNode;
}

/**
 * Standard placeholder component for null search results or empty entity lists.
 */
export function EmptyState({
  title = 'No results found',
  description = 'No data matches your current filters or query.',
  icon: Icon = SearchX,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/20 animate-in fade-in zoom-in duration-300',
        className,
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/40 mb-6 drop-shadow-sm">
        <Icon className="w-8 h-8 text-muted-foreground/60" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-foreground/90">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-8">
          <Button onClick={action.onClick} className="shadow-lg shadow-primary/20 font-medium px-6">
            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
            {action.label}
          </Button>
        </div>
      )}
      {children && <div className="mt-8 w-full max-w-md">{children}</div>}
    </div>
  );
}
