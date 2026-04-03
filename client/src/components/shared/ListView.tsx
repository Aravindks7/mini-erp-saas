import { cn } from '@/lib/utils';
import { SkeletonLoader } from './SkeletonLoader';
import { EmptyState } from './EmptyState';

interface ListViewProps<T> {
  /** The data to render. */
  data: T[];
  /** Function to render each item. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Loading state flag. */
  isLoading?: boolean;
  /** Optional configuration for the empty state. */
  emptyState?: {
    title?: string;
    description?: string;
  };
  /** Additional classes for the container. */
  className?: string;
  /** Whether to use a grid layout. */
  grid?: boolean;
  /** Custom grid classes (e.g., "grid-cols-1 md:grid-cols-2"). */
  gridClassName?: string;
}

/**
 * ListView Component
 * A polymorphic, mobile-friendly data display component.
 * Serves as a high-leverage alternative to EntityTable for simpler or responsive views.
 */
export function ListView<T>({
  data,
  renderItem,
  isLoading,
  emptyState,
  className,
  grid = false,
  gridClassName = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
}: ListViewProps<T>) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', grid && 'grid ' + gridClassName, className)}>
        {[...Array(3)].map((_, i) => (
          <SkeletonLoader key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyState?.title || 'No items found'}
        description={emptyState?.description || 'There are no records to display at this time.'}
        className={cn('min-h-[200px]', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'w-full',
        grid ? cn('grid', gridClassName) : 'flex flex-col space-y-4',
        className,
      )}
    >
      {data.map((item, index) => renderItem(item, index))}
    </div>
  );
}
