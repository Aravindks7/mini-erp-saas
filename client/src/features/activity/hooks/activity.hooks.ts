import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity.api';

export const activityKeys = {
  all: ['activity-logs'] as const,
  entity: (entityType: string, entityId: string) =>
    [...activityKeys.all, 'entity', entityType, entityId] as const,
  global: (filters?: {
    entityType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => [...activityKeys.all, 'global', filters] as const,
};

/**
 * Fetches activity logs for a specific entity (e.g., a single Sales Order).
 * Used for the "Activity" tab on detail pages.
 */
export function useEntityActivity(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: activityKeys.entity(entityType, entityId || ''),
    queryFn: () => activityApi.fetchEntityActivity(entityType, entityId!),
    enabled: !!entityId,
    staleTime: 10_000,
  });
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
  return useInfiniteQuery({
    queryKey: activityKeys.global(filters),
    queryFn: ({ pageParam }) =>
      activityApi.fetchOrganizationActivity({
        ...filters,
        cursor: pageParam as string | undefined,
        limit: 30,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 10_000,
  });
}
