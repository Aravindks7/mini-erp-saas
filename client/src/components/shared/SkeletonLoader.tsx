import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'table' | 'form' | 'card' | 'list' | 'dashboard' | 'details';
  rows?: number;
}

/**
 * Standard Skeleton Loader for ERP SaaS.
 * Provides consistent loading states for high-traffic views.
 */
export function SkeletonLoader({ className, variant = 'table', rows = 5 }: SkeletonLoaderProps) {
  if (variant === 'dashboard') {
    return (
      <div className={cn('space-y-8 animate-pulse', className)}>
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-[120px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          ))}
        </div>

        {/* Widgets Row */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="col-span-1 lg:col-span-2 rounded-xl border bg-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-[150px]" />
              <Skeleton className="h-5 w-5" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
          <div className="col-span-1 lg:col-span-2 rounded-xl border bg-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-[150px]" />
              <Skeleton className="h-5 w-5" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('w-full space-y-6 animate-pulse', className)}>
        {/* Table Header Area */}
        <div className="flex items-start justify-between px-1">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table Toolbar */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex gap-2 items-center flex-1">
            <Skeleton className="h-10 w-full max-w-[300px]" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table Grid */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b h-12 flex items-center px-4 bg-muted/30">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="border-b h-16 flex items-center px-4 last:border-b-0">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'details') {
    return (
      <div className={cn('space-y-8 animate-pulse', className)}>
        {/* Detail Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Tabs/Sections */}
        <div className="flex gap-4 border-b">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="rounded-xl border p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={cn('space-y-8 animate-pulse', className)}>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('rounded-xl border bg-card p-6 space-y-4 animate-pulse', className)}>
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-4 animate-pulse', className)}>
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

  return <Skeleton className={cn('w-full h-full animate-pulse', className)} />;
}
