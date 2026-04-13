'use no memo';

import * as React from 'react';
import type { Table as TanstackTable } from '@tanstack/react-table';

import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { DataTablePagination } from './DataTablePagination';
import { DataTableView } from './DataTableView';
import { DataCardView } from './DataCardView';

export interface BulkAction<TData> {
  label: string;
  onAction: (rows: TData[]) => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
}

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  isLoading?: boolean;
  viewMode?: 'list' | 'grid';
  onAddClick?: () => void;
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
  viewMode = 'list',
  onAddClick,
  emptyState,
  onRowClick,
  children,
}: DataTableProps<TData>) {
  if (isLoading) {
    if (viewMode === 'grid') {
      return (
        <div className="space-y-4">
          {children}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" />
            ))}
          </div>
        </div>
      );
    }
    return <SkeletonLoader variant="table" rows={5} />;
  }

  return (
    <div className="space-y-4">
      {children}
      {viewMode === 'grid' ? (
        <DataCardView
          table={table}
          onRowClick={onRowClick}
          emptyState={emptyState}
          onAddClick={onAddClick}
        />
      ) : (
        <DataTableView
          table={table}
          onRowClick={onRowClick}
          onAddClick={onAddClick}
          emptyState={emptyState}
        />
      )}
      <DataTablePagination table={table} />
    </div>
  );
}
