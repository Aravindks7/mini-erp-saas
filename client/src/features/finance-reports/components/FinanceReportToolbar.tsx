import { DateRangePicker } from '@/components/shared/form/DateRangePicker';
import { DatePicker } from '@/components/shared/form/DatePicker';
import { ExportButton } from '@/components/shared/data-table/ExportButton';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface FinanceReportToolbarProps {
  mode: 'pnl' | 'balance-sheet';
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  endDate?: Date;
  onEndDateChange?: (date: Date | undefined) => void;
  exportEndpoint: string;
  exportFilename: string;
  onReset?: () => void;
  isDirty?: boolean;
}

/**
 * Unified Toolbar for Financial Reports.
 * Axiom: Simplifies the orchestration of date-based filtering and data extraction.
 */
export function FinanceReportToolbar({
  mode,
  dateRange,
  onDateRangeChange,
  endDate,
  onEndDateChange,
  exportEndpoint,
  exportFilename,
  onReset,
  isDirty = false,
}: FinanceReportToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
      {mode === 'pnl' && onDateRangeChange && (
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      )}
      {mode === 'balance-sheet' && onEndDateChange && (
        <DatePicker date={endDate} onChange={onEndDateChange} placeholder="As of date" />
      )}
      <div className="flex items-center gap-2">
        {onReset && isDirty && (
          <Button variant="outline" size="icon" onClick={onReset} title="Reset filters">
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        <ExportButton endpoint={exportEndpoint} filename={exportFilename} />
      </div>
    </div>
  );
}
