import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@shared/contracts/dashboard.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const dashboardApi = {
  /**
   * Fetches consolidated dashboard metrics and activity.
   */
  fetchSummary: () => apiFetch<DashboardResponse>(API_ENDPOINTS.dashboard.base),

  /**
   * Manually triggers a materialized view refresh for dashboard metrics.
   */
  refreshDashboard: () =>
    apiFetch<{ status: string; message: string }>(API_ENDPOINTS.dashboard.refresh, {
      method: 'POST',
    }),
};
