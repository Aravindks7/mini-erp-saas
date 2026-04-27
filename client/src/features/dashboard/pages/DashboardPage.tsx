import { RefreshCcw } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import DashboardGrid from '@/components/shared/DashboardGrid';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { PERMISSIONS } from '@shared/index';
import { useDashboard, useRefreshDashboard } from '../api/queries';
import { DashboardMetricsCards } from '../components/DashboardMetricsCards';
import { LowStockWidget } from '../components/LowStockWidget';
import { RecentActivityWidget } from '../components/RecentActivityWidget';

import { usePermission } from '@/hooks/usePermission';

/**
 * Main Dashboard Entry Point.
 * Axiom: Orchestrates pre-aggregated KPIs and real-time operational alerts.
 */
export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const refreshMutation = useRefreshDashboard();
  const canRefresh = usePermission(PERMISSIONS.ORGANIZATION.SETTINGS);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Overview of your business performance" />
        <SkeletonLoader variant="dashboard" />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" />
        <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed text-muted-foreground">
          Failed to load dashboard data. Please try again later.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your business performance"
        actions={[
          {
            label: 'Refresh Metrics',
            onClick: () => refreshMutation.mutate(),
            icon: (
              <RefreshCcw
                className={refreshMutation.isPending ? 'animate-spin h-4 w-4' : 'h-4 w-4'}
              />
            ),
            variant: 'outline',
            isLoading: refreshMutation.isPending,
            hidden: !canRefresh,
          },
        ]}
      />

      <div className="space-y-8">
        {/* KPI Section */}
        <DashboardGrid>
          <DashboardMetricsCards metrics={data.metrics} />
        </DashboardGrid>

        {/* Operational Intelligence Section */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <RecentActivityWidget activity={data.recentActivity} />
          <LowStockWidget items={data.lowStockItems} />
        </div>
      </div>
    </PageContainer>
  );
}
