import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import type { DashboardMetrics } from '@shared/contracts/dashboard.contract';

interface DashboardMetricsCardsProps {
  metrics: DashboardMetrics;
}

/**
 * Renders the top-level KPI cards for the Dashboard.
 * Axiom: Visualizes the Materialized View pre-aggregates.
 */
export function DashboardMetricsCards({ metrics }: DashboardMetricsCardsProps) {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <>
      <StatsCard
        title="Total Sales"
        value={currencyFormatter.format(Number(metrics.totalSales))}
        icon={TrendingUp}
        iconColor="text-emerald-500"
        description="Historical sales total"
      />
      <StatsCard
        title="Total Purchases"
        value={currencyFormatter.format(Number(metrics.totalPurchases))}
        icon={ShoppingCart}
        iconColor="text-blue-500"
        description="Historical purchase total"
      />
      <StatsCard
        title="Active Customers"
        value={metrics.activeCustomers}
        icon={Users}
        iconColor="text-indigo-500"
        description="Total registered customers"
      />
      <StatsCard
        title="Total Products"
        value={metrics.totalProducts}
        icon={Package}
        iconColor="text-amber-500"
        description="Items in catalog"
      />
    </>
  );
}
