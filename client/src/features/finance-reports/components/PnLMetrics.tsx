import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import DashboardGrid from '@/components/shared/DashboardGrid';

interface PnLMetricsProps {
  revenue: number;
  expenses: number;
  netIncome: number;
}

/**
 * P&L Metrics Grid.
 * Axiom: Provides an immediate executive summary of profitability.
 */
export function PnLMetrics({ revenue, expenses, netIncome }: PnLMetricsProps) {
  const formatCurrency = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const netMargin = revenue > 0 ? ((netIncome / revenue) * 100).toFixed(1) : '0';

  return (
    <DashboardGrid className="mb-8">
      <StatsCard
        title="Total Revenue"
        value={`$${formatCurrency(revenue)}`}
        icon={TrendingUp}
        iconColor="text-success"
        description="Gross operating income"
      />
      <StatsCard
        title="Total Expenses"
        value={`$${formatCurrency(expenses)}`}
        icon={TrendingDown}
        iconColor="text-destructive"
        description="Operating costs and COGS"
      />
      <StatsCard
        title="Net Income"
        value={`$${formatCurrency(netIncome)}`}
        icon={Wallet}
        iconColor="text-primary"
        description={`${netMargin}% net profit margin`}
        className={
          netIncome >= 0
            ? 'border-success/20 bg-success/5'
            : 'border-destructive/20 bg-destructive/5'
        }
      />
    </DashboardGrid>
  );
}
