import {
  useQuery,
  useInfiniteQuery,
  queryOptions,
  infiniteQueryOptions,
} from '@tanstack/react-query';
import { activityApi, type PaginatedActivityResponse } from '../api/activity.api';

export const activityKeys = {
  all: ['activity-logs'] as const,
  lists: {
    all: () => [...activityKeys.all, 'list'] as const,
    global: (filters?: {
      entityType?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    }) => [...activityKeys.lists.all(), 'global', filters] as const,
    entity: (entityType: string, entityId: string) =>
      [...activityKeys.lists.all(), 'entity', entityType, entityId] as const,
  },
};

// --- Activity Queries ---

/**
 * Query options for fetching activity logs for a specific entity.
 */
export const entityActivityQuery = (entityType: string, entityId: string | undefined) =>
  queryOptions({
    queryKey: activityKeys.lists.entity(entityType, entityId || ''),
    queryFn: () => activityApi.fetchEntityActivity(entityType, entityId!),
    enabled: !!entityId,
    staleTime: 10_000,
  });

/**
 * Infinite query options for organization-wide activity.
 */
export const globalActivityQuery = (filters?: {
  entityType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) =>
  infiniteQueryOptions({
    queryKey: activityKeys.lists.global(filters),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      activityApi.fetchOrganizationActivity({
        ...filters,
        cursor: pageParam,
        limit: 30,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedActivityResponse) => lastPage.nextCursor ?? undefined,
    staleTime: 10_000,
  });

// --- Hooks ---

/**
 * Fetches activity logs for a specific entity (e.g., a single Sales Order).
 * Used for the "Activity" tab on detail pages.
 */
export function useEntityActivity(entityType: string, entityId: string | undefined) {
  return useQuery(entityActivityQuery(entityType, entityId));
}

/**
 * Fetches organization-wide activity with infinite scrolling.
 * Used for the global Activity page.
 */
export function useOrganizationActivity(filters?: {
  entityType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useInfiniteQuery(globalActivityQuery(filters));
}
