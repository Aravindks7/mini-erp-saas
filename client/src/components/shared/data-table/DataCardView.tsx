'use no memo';

import * as React from 'react';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/shared/EmptyState';
import { useBreakpoints } from '@/hooks/useBreakpoint';

interface DataCardViewProps<TData> {
  table: TanstackTable<TData>;
  onRowClick?: (data: TData) => void;
  onAddClick?: () => void;
  emptyState?: {
    title?: string;
    description?: string;
  };
}

export function DataCardView<TData>({
  table,
  onRowClick,
  onAddClick,
  emptyState,
}: DataCardViewProps<TData>) {
  const { sm, lg } = useBreakpoints();
  const isActuallyEmpty =
    table.getCoreRowModel().rows.length === 0 && table.getState().columnFilters.length === 0;

  const rows = table.getRowModel().rows;
  const selectColumn = table.getColumn('select');

  const colCount = React.useMemo(() => {
    if (lg) return 3;
    if (sm) return 2;
    return 1;
  }, [sm, lg]);

  const remainingCols = React.useMemo(() => {
    const remainder = rows.length % colCount;
    return colCount - remainder;
  }, [rows.length, colCount]);

  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-background overflow-hidden p-8">
        <EmptyState
          title={
            isActuallyEmpty ? emptyState?.title || 'No data found' : 'No results match your search'
          }
          description={
            isActuallyEmpty
              ? emptyState?.description || 'Get started by creating a new record.'
              : 'Try adjusting your filters or search terms to find what you are looking for.'
          }
          action={
            isActuallyEmpty && onAddClick
              ? {
                  label: 'Add New',
                  onClick: onAddClick,
                }
              : undefined
          }
          className="border-none bg-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectColumn && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded-md border border-dashed border-muted-foreground/20 w-fit animate-in fade-in slide-in-from-top-1 duration-300">
          <Checkbox
            id="select-all"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
          <label
            htmlFor="select-all"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer"
          >
            Select All
          </label>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const visibleCells = row.getVisibleCells();

          const titleCell = visibleCells.find(
            (cell) => cell.column.columnDef.meta?.variant === 'title',
          );
          const subtitleCell = visibleCells.find(
            (cell) => cell.column.columnDef.meta?.variant === 'subtitle',
          );
          const actionCell = visibleCells.find(
            (cell) =>
              cell.column.columnDef.meta?.variant === 'actions' || cell.column.id === 'actions',
          );
          const selectCell = visibleCells.find((cell) => cell.column.id === 'select');
          const fieldCells = visibleCells.filter(
            (cell) =>
              (cell.column.columnDef.meta?.variant === 'field' ||
                !cell.column.columnDef.meta?.variant) &&
              cell.column.id !== 'actions' &&
              cell.column.id !== 'select',
          );

          const isSelected = row.getIsSelected();

          return (
            <Card
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={cn(
                'transition-all hover:shadow-md relative h-full',
                onRowClick ? 'cursor-pointer hover:border-primary/50' : '',
                isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : '',
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-start gap-3 overflow-hidden">
                  {selectCell && (
                    <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                      {flexRender(selectCell.column.columnDef.cell, selectCell.getContext())}
                    </div>
                  )}
                  <div className="space-y-1 overflow-hidden">
                    <CardTitle className="text-base font-bold truncate">
                      {titleCell
                        ? flexRender(titleCell.column.columnDef.cell, titleCell.getContext())
                        : 'No Title'}
                    </CardTitle>
                    {subtitleCell && (
                      <CardDescription className="truncate">
                        {flexRender(subtitleCell.column.columnDef.cell, subtitleCell.getContext())}
                      </CardDescription>
                    )}
                  </div>
                </div>
                {actionCell && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  {fieldCells.map((cell) => (
                    <div key={cell.id} className="flex justify-between items-center gap-4">
                      <span className="text-muted-foreground font-medium shrink-0 text-xs">
                        {cell.column.columnDef.meta?.label || cell.column.id}:
                      </span>
                      <span className="truncate text-right">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add New Card Slot */}
        {onAddClick && (
          <Card
            onClick={onAddClick}
            className={cn(
              'flex flex-col items-center justify-center min-h-[160px] border-dashed border-2 bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all cursor-pointer group',
            )}
            style={{
              gridColumn:
                remainingCols > 1 ? `span ${remainingCols} / span ${remainingCols}` : undefined,
            }}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <div className="p-3 rounded-full bg-background border border-dashed group-hover:border-primary/50">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider">Add New</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
