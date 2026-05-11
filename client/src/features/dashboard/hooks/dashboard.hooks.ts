import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: {
    all: () => [...dashboardKeys.all, 'metrics'] as const,
    summary: () => [...dashboardKeys.metrics.all(), 'summary'] as const,
  },
};

// --- Dashboard Queries ---

export const dashboardSummaryQuery = () =>
  queryOptions({
    queryKey: dashboardKeys.metrics.summary(),
    queryFn: dashboardApi.fetchSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes (Backend-aligned materialized refresh interval)
  });

// --- Hooks ---

/**
 * Hook to fetch consolidated dashboard metrics and activity.
 */
export function useDashboard() {
  return useQuery(dashboardSummaryQuery());
}

/**
 * Mutation to manually trigger a materialized view refresh.
 * Only intended for administrative users.
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dashboardApi.refreshDashboard,
    onSuccess: () => {
      // Invalidate the dashboard metrics to pull fresh pre-aggregated data.
      queryClient.invalidateQueries({ queryKey: dashboardKeys.metrics.all() });
    },
  });
}
