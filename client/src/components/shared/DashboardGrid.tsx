import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive Grid for Dashboard Widgets.
 * Uses a 12-column grid system that stacks on mobile.
 */
export default function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface DashboardWidgetProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 'default' | 'md' | 'lg' | 'full';
}

/**
 * Individual Widget/Card for the DashboardGrid.
 * Supports configurable column spans.
 */
export function DashboardWidget({
  children,
  className,
  colSpan = 'default',
}: DashboardWidgetProps) {
  const spanClasses = {
    default: 'col-span-1',
    md: 'md:col-span-2',
    lg: 'lg:col-span-3',
    full: 'col-span-1 md:col-span-full',
  };

  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden',
        spanClasses[colSpan],
        className,
      )}
    >
      {children}
    </div>
  );
}
