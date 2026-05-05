import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteScrollTriggerProps {
  onIntersect: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  className?: string;
}

/**
 * InfiniteScrollTrigger: A domain-agnostic observer component.
 * Triggers the onIntersect callback when it enters the viewport.
 * Standardizes the loading state UI at the bottom of lists.
 */
export function InfiniteScrollTrigger({
  onIntersect,
  hasNextPage,
  isFetchingNextPage,
  className,
}: InfiniteScrollTriggerProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '200px', // Trigger slightly before it comes into full view
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onIntersect();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onIntersect]);

  if (!hasNextPage) return null;

  return (
    <div ref={ref} className={cn('flex items-center justify-center py-10 w-full', className)}>
      {isFetchingNextPage ? (
        <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm font-medium">Loading more activities...</span>
        </div>
      ) : (
        <div className="h-4 w-full" /> // Invisible spacer to trigger intersection
      )}
    </div>
  );
}
