import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  searchable?: boolean;
  filterable?: boolean;
  showTitle?: boolean;
  className?: string;
}

/**
 * DataTableSkeleton
 * Specifically designed to mimic the EntityTable structure.
 */
export function DataTableSkeleton({
  columnCount = 5,
  rowCount = 10,
  searchable = true,
  filterable = true,
  showTitle = true,
  className,
}: DataTableSkeletonProps) {
  return (
    <div className={cn('w-full space-y-6 animate-pulse', className)}>
      {showTitle && (
        <div className="flex items-start justify-between px-1">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex gap-2 items-center flex-1">
          {searchable && <Skeleton className="h-10 w-full max-w-[300px]" />}
          {filterable && <Skeleton className="h-10 w-24" />}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b h-12 flex items-center px-4 bg-muted/30">
          <div className="flex items-center gap-4 w-full">
            <Skeleton className="h-4 w-4" />
            {Array.from({ length: columnCount }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="border-b h-16 flex items-center px-4 last:border-b-0">
            <div className="flex items-center gap-4 w-full">
              <Skeleton className="h-4 w-4" />
              {Array.from({ length: columnCount }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
