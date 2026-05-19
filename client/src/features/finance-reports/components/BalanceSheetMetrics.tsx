import { ShieldCheck, ShieldAlert, PieChart, Landmark, Scale } from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import DashboardGrid from '@/components/shared/DashboardGrid';
import { cn } from '@/lib/utils';

interface BalanceSheetMetricsProps {
  assets: number;
  liabilities: number;
  equity: number;
  isBalanced: boolean;
}

/**
 * Balance Sheet Metrics Grid.
 * Axiom: Visualizes the fundamental accounting equation (A = L + E).
 */
export function BalanceSheetMetrics({
  assets,
  liabilities,
  equity,
  isBalanced,
}: BalanceSheetMetricsProps) {
  const formatCurrency = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <DashboardGrid className="mb-8">
      <StatsCard
        title="Total Assets"
        value={`$${formatCurrency(assets)}`}
        icon={Landmark}
        iconColor="text-success"
        description="Current and fixed assets"
      />
      <StatsCard
        title="Total Liabilities"
        value={`$${formatCurrency(liabilities)}`}
        icon={Scale}
        iconColor="text-destructive"
        description="Short and long-term debt"
      />
      <StatsCard
        title="Total Equity"
        value={`$${formatCurrency(equity)}`}
        icon={PieChart}
        iconColor="text-primary"
        description="Owner's stake & earnings"
      />
      <div
        className={cn(
          'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 shadow-sm',
          isBalanced
            ? 'bg-success/5 border-success/20 text-success'
            : 'bg-destructive/5 border-destructive/20 text-destructive animate-pulse',
        )}
      >
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
          Ledger Health
        </span>
        {isBalanced ? (
          <>
            <ShieldCheck className="h-8 w-8 mb-1" />
            <span className="text-xs font-bold uppercase">Balanced</span>
          </>
        ) : (
          <>
            <ShieldAlert className="h-8 w-8 mb-1" />
            <span className="text-xs font-bold uppercase">Unbalanced</span>
          </>
        )}
      </div>
    </DashboardGrid>
  );
}
