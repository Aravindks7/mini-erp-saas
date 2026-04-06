import React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showSeparator?: boolean;
  /** Number of grid columns (1, 2, or 3). Defaults to 3 on large screens. */
  columns?: 1 | 2 | 3;
}

/**
 * Standardized Section wrapper for complex ERP forms.
 * Provides a consistent layout for grouping related form fields.
 */
export function FormSection({
  title,
  description,
  children,
  className,
  showSeparator = true,
  columns = 3,
}: FormSectionProps) {
  const columnClass = {
    1: 'md:grid-cols-1 lg:grid-cols-1',
    2: 'md:grid-cols-2 lg:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
  }[columns];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col space-y-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>

      <div className={cn('grid grid-cols-1 gap-6 pt-2', columnClass)}>{children}</div>

      {showSeparator && <Separator className="my-8" />}
    </div>
  );
}
