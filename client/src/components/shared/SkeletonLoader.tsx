import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'table' | 'form' | 'card' | 'list';
  rows?: number;
}

/**
 * Standard Skeleton Loader for ERP SaaS.
 * Provides consistent loading states for high-traffic views.
 */
export function SkeletonLoader({ className, variant = 'table', rows = 5 }: SkeletonLoaderProps) {
  if (variant === 'table') {
    return (
      <div className={cn('w-full space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[150px] lg:w-[250px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <div className="rounded-md border">
          <div className="border-b h-10 flex items-center px-4">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="border-b h-12 flex items-center px-4 last:border-b-0">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="space-y-2">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('rounded-xl border bg-card p-6 space-y-4', className)}>
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <Skeleton className={cn('w-full h-full', className)} />;
}
