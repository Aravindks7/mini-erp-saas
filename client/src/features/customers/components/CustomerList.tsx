import * as React from 'react';
import { z } from 'zod';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { AlertCircle } from 'lucide-react';

import { DataTable } from '@/components/shared/data-table/DataTable';
import { DataTableToolbar } from '@/components/shared/data-table/DataTableToolbar';
import { DataTableSearch } from '@/components/shared/data-table/DataTableSearch';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';

import { columns, customerStatusOptions } from './columns';
import { useCustomers } from '../hooks/customers.hooks';

const searchSchema = z.object({
  companyName: z.string().optional(),
  status: z.string().optional(),
});

export function CustomerList() {
  const { data: customers, isLoading, isError } = useCustomers();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: customers || [],
    columns,
    state: {
      ...tableState,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: tableSetters.onPaginationChange,
    onSortingChange: tableSetters.onSortingChange,
    onColumnFiltersChange: tableSetters.onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-destructive/5 rounded-lg border border-dashed border-destructive/20 animate-in fade-in duration-500">
        <AlertCircle className="h-10 w-10 text-destructive mb-3 opacity-50" />
        <h3 className="text-lg font-bold text-destructive">Failed to load customers</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          We encountered an error while fetching the customer directory. Please check your network
          or try again.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      emptyState={{
        title: 'Customer Directory is empty',
        description: 'You haven\'t added any customers yet. Click "Add Customer" to get started.',
      }}
    >
      <DataTableToolbar
        table={table}
        onReset={resetAll}
        bulkActions={[
          {
            label: 'Delete Selected',
            onAction: (rows) =>
              console.log(
                'Bulk delete:',
                rows.map((r) => (r as any).id),
              ),
            variant: 'destructive',
          },
        ]}
      >
        <DataTableSearch
          searchKey="companyName"
          value={(table.getColumn('companyName')?.getFilterValue() as string) ?? ''}
          onChange={(value) => table.getColumn('companyName')?.setFilterValue(value)}
        />
        <DataTableFilter
          column={table.getColumn('status')}
          title="Status"
          options={customerStatusOptions}
        />
      </DataTableToolbar>
    </DataTable>
  );
}
