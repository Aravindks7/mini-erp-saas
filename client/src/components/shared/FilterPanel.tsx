import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Filter, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Table } from '@tanstack/react-table';

interface FilterPanelProps<TData> {
  /** The TanStack Table instance for query state. */
  table: Table<TData>;
  /** Form fields for specific filters (Selects, DatePickers, etc.). */
  children: React.ReactNode;
  /** Optional handler when filters are cleared. */
  onClear?: () => void;
  /** Label for the trigger button. */
  label?: string;
  className?: string;
}

/**
 * FilterPanel Component
 * A Drawer/Sheet-based abstraction for complex ERP queries.
 * Provides a dedicated workspace for filtering without obstructing the main data view.
 */
export function FilterPanel<TData>({
  table,
  children,
  onClear,
  label = 'Filters',
  className,
}: FilterPanelProps<TData>) {
  const activeFiltersCount = table.getState().columnFilters.length;

  const handleReset = () => {
    table.resetColumnFilters();
    onClear?.();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-8 flex gap-2 relative', className)}>
          <Filter className="h-4 w-4" />
          {label}
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[350px] sm:w-[450px] flex flex-col">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Advanced Filters
            </SheetTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Refine your results by selecting criteria below.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-8 no-scrollbar">{children}</div>

        <SheetFooter className="border-t pt-6 flex flex-col gap-3">
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReset}
              disabled={activeFiltersCount === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <SheetClose asChild>
              <Button className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
