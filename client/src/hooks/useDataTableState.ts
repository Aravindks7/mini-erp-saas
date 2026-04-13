import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  Updater,
} from '@tanstack/react-table';
import * as React from 'react';
import { useMemo, useCallback } from 'react';

// Base schema that all table states will extend
const baseSchema = z.object({
  page: z.coerce.number().catch(1),
  pageSize: z.coerce.number().catch(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  view: z.enum(['list', 'grid']).catch('list'),
});

/**
 * useDataTableState: Centralized state-layer for table synchronization with URL.
 *
 * Architectural Highlights:
 * 1. URL-Backed: The single source of truth for filters, sorting, and pagination is the URL.
 * 2. Throttled Updates: Filter changes are automatically debounced at the state layer to
 *    optimize performance and eliminate race conditions during reset.
 * 3. Immediate Pagination: Navigation and sorting updates are applied immediately.
 * 4. Automatic Cleanup: Pending debounced updates are cleared on unmount and during resets.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDataTableState<T extends z.ZodObject<any, any>>(schema: T) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const combinedSchema = useMemo(() => baseSchema.merge(schema), [schema]);

  const parsedParams = useMemo(() => {
    const params = Object.fromEntries(searchParams.entries());
    const result = combinedSchema.safeParse(params);
    const data = result.success ? result.data : combinedSchema.parse({});
    return data as z.infer<typeof baseSchema> & Record<string, unknown>;
  }, [searchParams, combinedSchema]);

  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: Math.max(0, parsedParams.page - 1),
      pageSize: parsedParams.pageSize,
    }),
    [parsedParams.page, parsedParams.pageSize],
  );

  const sorting: SortingState = useMemo(
    () =>
      parsedParams.sort ? [{ id: parsedParams.sort, desc: parsedParams.order === 'desc' }] : [],
    [parsedParams.sort, parsedParams.order],
  );

  const columnFilters: ColumnFiltersState = useMemo(() => {
    const filters: ColumnFiltersState = [];
    const baseKeys = ['page', 'pageSize', 'sort', 'order', 'view'];
    Object.keys(parsedParams).forEach((key) => {
      if (!baseKeys.includes(key) && parsedParams[key] !== undefined && parsedParams[key] !== '') {
        filters.push({ id: key, value: parsedParams[key] });
      }
    });
    return filters;
  }, [parsedParams]);

  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, []);

  const updateUrl = useCallback(
    (
      updates: Record<string, string | undefined>,
      options: { replace?: boolean; debounce?: boolean } = {},
    ) => {
      const { replace = true, debounce = false } = options;

      const performUpdate = () => {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            let hasChanges = false;
            let shouldResetPage = false;

            Object.entries(updates).forEach(([key, value]) => {
              const currentValue = prev.get(key) ?? '';
              const newValue = value ?? '';

              if (currentValue !== newValue) {
                hasChanges = true;
                if (value === undefined || value === '') {
                  next.delete(key);
                } else {
                  next.set(key, value);
                }

                // If any non-pagination/non-view key changes, we should reset page
                if (key !== 'page' && key !== 'pageSize' && key !== 'view') {
                  shouldResetPage = true;
                }
              }
            });

            if (!hasChanges) return prev;

            if (shouldResetPage && !('page' in updates)) {
              next.set('page', '1');
            }

            return next;
          },
          { replace },
        );
      };

      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);

      if (debounce) {
        filterTimeoutRef.current = setTimeout(performUpdate, 300);
      } else {
        performUpdate();
      }
    },
    [setSearchParams],
  );

  const onPaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const nextPagination = typeof updater === 'function' ? updater(pagination) : updater;
      updateUrl({
        page: (nextPagination.pageIndex + 1).toString(),
        pageSize: nextPagination.pageSize.toString(),
      });
    },
    [pagination, updateUrl],
  );

  const onSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const nextSorting = typeof updater === 'function' ? updater(sorting) : updater;
      if (nextSorting.length > 0) {
        updateUrl({ sort: nextSorting[0].id, order: nextSorting[0].desc ? 'desc' : 'asc' });
      } else {
        updateUrl({ sort: undefined, order: undefined });
      }
    },
    [sorting, updateUrl],
  );

  const onColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const nextFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
      const filterUpdates: Record<string, string | undefined> = {};

      // Clear all existing custom filters in URL first
      columnFilters.forEach((f) => {
        filterUpdates[f.id] = undefined;
      });

      // Apply new filters
      nextFilters.forEach((f) => {
        if (Array.isArray(f.value)) {
          filterUpdates[f.id] = f.value.join(',');
        } else {
          filterUpdates[f.id] = f.value !== undefined ? String(f.value) : undefined;
        }
      });

      // Centralized debouncing for filter updates
      updateUrl(filterUpdates, { debounce: true });
    },
    [columnFilters, updateUrl],
  );

  const resetAll = useCallback(() => {
    // Immediate cleanup of any pending debounced filter updates
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        // Remove all custom filters
        columnFilters.forEach((f) => {
          next.delete(f.id);
        });
        // Remove sort/order
        next.delete('sort');
        next.delete('order');
        // Reset page
        next.set('page', '1');
        return next;
      },
      { replace: true },
    );
  }, [columnFilters, setSearchParams]);

  const setViewMode = useCallback(
    (view: 'list' | 'grid') => {
      updateUrl({ view, page: parsedParams.page.toString() }, { replace: true });
    },
    [parsedParams.page, updateUrl],
  );

  return {
    parsedParams,
    tableState: {
      pagination,
      sorting,
      columnFilters,
      viewMode: parsedParams.view as 'list' | 'grid',
    },
    tableSetters: { onPaginationChange, onSortingChange, onColumnFiltersChange, setViewMode },
    resetAll,
  };
}
