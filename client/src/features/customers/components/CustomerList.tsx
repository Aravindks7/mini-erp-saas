import { z } from 'zod';
import { AlertCircle } from 'lucide-react';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { DataTableSearch } from '@/components/shared/data-table/DataTableSearch';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';

import { columns, customerStatusOptions } from './columns';
import { useCustomers } from '../hooks/customers.hooks';
import type { CustomerResponse } from '../api/customers.api';

const searchSchema = z.object({
  companyName: z.string().optional(),
  status: z.string().optional(),
});

interface CustomerListProps {
  onAddClick?: () => void;
}

export function CustomerList({ onAddClick }: CustomerListProps) {
  const { data: customers, isLoading, isError } = useCustomers();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

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
    <EntityTable
      title="Customer Directory"
      description="Manage your business relationships and customer data."
      data={customers || []}
      columns={columns}
      isLoading={isLoading}
      onAddClick={onAddClick}
      viewMode={tableState.viewMode}
      onViewModeChange={tableSetters.setViewMode}
      state={tableState}
      onStateChange={tableSetters}
      onReset={resetAll}
      emptyState={{
        title: 'Customer Directory is empty',
        description: 'You haven\'t added any customers yet. Click "Add Customer" to get started.',
      }}
      bulkActions={[
        {
          label: 'Delete Selected',
          onAction: (rows: CustomerResponse[]) =>
            console.log(
              'Bulk delete:',
              rows.map((r) => r.id),
            ),
          variant: 'destructive',
        },
      ]}
      toolbarContent={(table) => (
        <>
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
        </>
      )}
    />
  );
}
