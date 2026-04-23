'use no memo';

import * as React from 'react';
import type { Table } from '@tanstack/react-table';
import { X, Trash2, ListFilter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { BulkAction } from './DataTable';
import { DataViewToggle } from './DataViewToggle';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchNode?: React.ReactNode;
  filterNode?: React.ReactNode;
  searchKey?: string;
  bulkActions?: BulkAction<TData>[];
  onReset?: () => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (view: 'list' | 'grid') => void;
}

export function DataTableToolbar<TData>({
  table,
  searchNode,
  filterNode,
  searchKey,
  bulkActions = [],
  onReset,
  viewMode,
  onViewModeChange,
}: DataTableToolbarProps<TData>) {
  const [isFilterVisible, setIsFilterVisible] = React.useState(false);
  const columnFilters = table.getState().columnFilters;
  const isFiltered = columnFilters.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  const activeFiltersCount = React.useMemo(() => {
    return columnFilters.filter((f) => (searchKey ? f.id !== searchKey : true)).length;
  }, [columnFilters, searchKey]);

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      table.resetColumnFilters();
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 w-full">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
          {searchNode}

          {filterNode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className={`h-8 ${isFilterVisible ? 'bg-muted' : ''}`}
            >
              <ListFilter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-normal">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          )}

          {viewMode && onViewModeChange && (
            <DataViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-foreground shrink-0"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {hasSelection && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground mr-2 px-2 py-1 bg-muted rounded-md whitespace-nowrap">
                {selectedRows.length} selected
              </span>
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                {bulkActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() =>
                      action.onAction(
                        selectedRows.map((r) => r.original),
                        () => table.resetRowSelection(),
                      )
                    }
                    className="h-8 gap-2 font-medium"
                  >
                    {action.icon ||
                      (action.variant === 'destructive' && <Trash2 className="h-3.5 w-3.5" />)}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isFilterVisible && filterNode && (
        <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 w-full flex-wrap border-t pt-3 mt-1">
          {filterNode}
        </div>
      )}
    </div>
  );
}
