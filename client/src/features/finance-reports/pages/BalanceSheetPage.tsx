import * as React from 'react';
import { format, isSameDay } from 'date-fns';

import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useBalanceSheet } from '../hooks/finance-reports.hooks';
import { BalanceSheetMetrics } from '../components/BalanceSheetMetrics';
import { BalanceSheetTable } from '../components/BalanceSheetTable';
import { FinanceReportToolbar } from '../components/FinanceReportToolbar';

/**
 * Balance Sheet Report Page.
 * Axiom: Orchestrates the point-in-time financial snapshot of the organization.
 */
export default function BalanceSheetPage() {
  const [endDate, setEndDate] = React.useState<Date | undefined>(new Date());

  const params = React.useMemo(
    () => ({
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    }),
    [endDate],
  );

  const { data, isLoading } = useBalanceSheet(params);

  const defaultEndDate = React.useMemo(() => new Date(), []);

  const isDirty = React.useMemo(() => {
    return !endDate || !isSameDay(endDate, defaultEndDate);
  }, [endDate, defaultEndDate]);

  const handleReset = () => {
    setEndDate(defaultEndDate);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Balance Sheet"
        description="A snapshot of your organization's financial position at a specific point in time."
      >
        <FinanceReportToolbar
          mode="balance-sheet"
          endDate={endDate}
          onEndDateChange={setEndDate}
          onReset={handleReset}
          isDirty={isDirty}
          exportEndpoint={`/finance/reports/balance-sheet?endDate=${params.endDate}`}
          exportFilename={`balance-sheet-${params.endDate}.csv`}
        />
      </PageHeader>

      {isLoading ? (
        <SkeletonLoader variant="dashboard" />
      ) : data ? (
        <>
          <BalanceSheetMetrics
            assets={data.assets}
            liabilities={data.liabilities}
            equity={data.equity}
            isBalanced={data.isBalanced}
          />
          <BalanceSheetTable data={data} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">No financial data found for the selected date.</p>
        </div>
      )}
    </PageContainer>
  );
}
