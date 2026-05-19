import * as React from 'react';
import { format, startOfYear, isSameDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useProfitAndLoss } from '../hooks/finance-reports.hooks';
import { PnLMetrics } from '../components/PnLMetrics';
import { PnLTable } from '../components/PnLTable';
import { FinanceReportToolbar } from '../components/FinanceReportToolbar';

/**
 * Profit & Loss Report Page.
 * Axiom: Orchestrates income statement generation across arbitrary time periods.
 */
export default function ProfitAndLossPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: new Date(),
  });

  // Convert DateRange to API-friendly strings
  const params = React.useMemo(
    () => ({
      startDate: dateRange?.from
        ? format(dateRange.from, 'yyyy-MM-dd')
        : format(startOfYear(new Date()), 'yyyy-MM-dd'),
      endDate: dateRange?.to
        ? format(dateRange.to, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    }),
    [dateRange],
  );

  const { data, isLoading } = useProfitAndLoss(params);

  const defaultRange = React.useMemo(
    () => ({
      from: startOfYear(new Date()),
      to: new Date(),
    }),
    [],
  );

  const isDirty = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return true;
    return (
      !isSameDay(dateRange.from, defaultRange.from) || !isSameDay(dateRange.to, defaultRange.to)
    );
  }, [dateRange, defaultRange]);

  const handleReset = () => {
    setDateRange(defaultRange);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Profit & Loss"
        description="Monitor your organization's revenue, expenses, and net profitability over time."
      >
        <FinanceReportToolbar
          mode="pnl"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onReset={handleReset}
          isDirty={isDirty}
          exportEndpoint={`/finance/reports/profit-and-loss?startDate=${params.startDate}&endDate=${params.endDate}`}
          exportFilename={`profit-and-loss-${params.startDate}-to-${params.endDate}.csv`}
        />
      </PageHeader>

      {isLoading ? (
        <SkeletonLoader variant="dashboard" />
      ) : data ? (
        <>
          <PnLMetrics revenue={data.revenue} expenses={data.expenses} netIncome={data.netIncome} />
          <PnLTable data={data} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">No financial data found for the selected period.</p>
        </div>
      )}
    </PageContainer>
  );
}
