import { apiFetch } from '@/lib/api';
import type { ActivityLogResponse } from '@shared/contracts/activity-logs.contract';

export interface PaginatedActivityResponse {
  items: ActivityLogResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const activityApi = {
  /**
   * Fetches activity logs for a specific entity (e.g., a single Sales Order).
   */
  fetchEntityActivity: (entityType: string, entityId: string) =>
    apiFetch<ActivityLogResponse[]>(
      `/activity-logs?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
    ),

  /**
   * Fetches organization-wide activity with cursor-based pagination.
   */
  fetchOrganizationActivity: (params?: {
    entityType?: string;
    cursor?: string;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.entityType) searchParams.set('entityType', params.entityType);
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const query = searchParams.toString();
    return apiFetch<PaginatedActivityResponse>(`/activity-logs${query ? `?${query}` : ''}`);
  },
};
