import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatusTextProps {
  status: string;
  date?: string | Date | null;
  children: React.ReactNode;
  className?: string;
}

/**
 * Domain-specific text component that applies warning styles
 * based on document status and date context (e.g., Overdue Drafts).
 */
export function StatusText({ status, date, children, className }: StatusTextProps) {
  const isPastDue = React.useMemo(() => {
    if (!date) return false;
    const d = typeof date === 'string' ? new Date(date) : date;
    // Set to start of day for comparison if needed, but simple Date comparison usually suffices
    return d < new Date();
  }, [date]);

  const isWarning = status === 'draft' && isPastDue;

  return (
    <span className={cn(isWarning && 'text-warning font-bold animate-pulse', className)}>
      {children}
    </span>
  );
}
