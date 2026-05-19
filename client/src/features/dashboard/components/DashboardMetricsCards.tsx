import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import type { DashboardMetrics } from '@shared/contracts/dashboard.contract';

interface DashboardMetricsCardsProps {
  metrics: DashboardMetrics;
}

import { useCurrency } from '@/features/currencies/hooks/use-currency';

/**
 * Renders the top-level KPI cards for the Dashboard.
 * Axiom: Visualizes the Materialized View pre-aggregates.
 */
export function DashboardMetricsCards({ metrics }: DashboardMetricsCardsProps) {
  const { format: formatCurrency } = useCurrency();

  return (
    <>
      <StatsCard
        title="Total Sales"
        value={formatCurrency(Number(metrics.totalSales))}
        icon={TrendingUp}
        iconColor="text-emerald-500"
        trend={metrics.totalSalesTrend}
        description="Historical sales total"
      />
      <StatsCard
        title="Total Purchases"
        value={formatCurrency(Number(metrics.totalPurchases))}
        icon={ShoppingCart}
        iconColor="text-blue-500"
        trend={metrics.totalPurchasesTrend}
        description="Historical purchase total"
      />
      <StatsCard
        title="Active Customers"
        value={metrics.activeCustomers}
        icon={Users}
        iconColor="text-indigo-500"
        trend={metrics.activeCustomersTrend}
        description="Total registered customers"
      />
      <StatsCard
        title="Total Products"
        value={metrics.totalProducts}
        icon={Package}
        iconColor="text-amber-500"
        trend={metrics.totalProductsTrend}
        description="Items in catalog"
      />
    </>
  );
}
