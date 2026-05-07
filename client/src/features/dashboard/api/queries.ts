import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@shared/contracts/dashboard.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const dashboardKeys = {
  all: ['dashboard'] as const,
};

/**
 * Hook to fetch consolidated dashboard metrics and activity.
 * Axiom: Aligned with the 5-minute background refresh interval on the backend.
 */
export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: dashboardKeys.all,
    queryFn: () => apiFetch<DashboardResponse>(API_ENDPOINTS.dashboard.base),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Mutation to manually trigger a materialized view refresh.
 * Only intended for administrative users.
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ status: string; message: string }>(API_ENDPOINTS.dashboard.refresh, {
        method: 'POST',
      }),
    onSuccess: () => {
      // Invalidate the dashboard query to pull fresh pre-aggregated metrics.
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
