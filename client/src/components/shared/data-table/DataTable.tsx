'use no memo';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { DataTablePagination } from './DataTablePagination';

export interface BulkAction<TData> {
  label: string;
  onAction: (rows: TData[]) => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
}

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  isLoading?: boolean;
  emptyState?: {
    title?: string;
    description?: string;
  };
  onRowClick?: (data: TData) => void;
  children?: React.ReactNode;
}

export function DataTable<TData>({
  table,
  isLoading,
  emptyState,
  onRowClick,
  children,
}: DataTableProps<TData>) {
  if (isLoading) {
    return <SkeletonLoader variant="table" rows={5} />;
  }

  const isActuallyEmpty =
    table.getCoreRowModel().rows.length === 0 && table.getState().columnFilters.length === 0;

  return (
    <div className="space-y-4">
      {children}
      <div className="rounded-md border bg-background overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/30">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="h-10 text-xs uppercase font-bold tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    'group transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-primary/5' : 'hover:bg-muted/50',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-64 text-center border-none"
                >
                  <EmptyState
                    title={
                      isActuallyEmpty
                        ? emptyState?.title || 'No data found'
                        : 'No results match your search'
                    }
                    description={
                      isActuallyEmpty
                        ? emptyState?.description || 'Get started by creating a new record.'
                        : 'Try adjusting your filters or search terms to find what you are looking for.'
                    }
                    className="border-none bg-transparent"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
