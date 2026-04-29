import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Package2 } from 'lucide-react';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';

import { columns, receiptStatusOptions } from './columns';
import { useReceipts } from '../hooks/receipts.hooks';
import { PageHeader } from '@/components/shared/PageHeader';

const searchSchema = z.object({
  receiptNumber: z.string().optional(),
  reference: z.string().optional(),
  status: z.string().optional(),
});

export function ReceiptList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: receipts, isLoading, isError } = useReceipts();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load receipts"
        description="We encountered an error while fetching the receipt list. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['receipts'] })}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!receipts || receipts.length === 0) {
    return (
      <>
        <PageHeader title="Receipts" />
        <EmptyState
          title="No receipts found"
          description="You haven't recorded any receipts yet. Get started by creating a new receipt for your inbound logistics."
          icon={Package2}
        >
          <div className="flex items-center justify-center gap-4">
            <AddButton
              to="/receipts/new"
              permission={PERMISSIONS.INVENTORY.RECEIVE}
              label="Create Receipt"
              className="shadow-lg shadow-primary/20"
            />
          </div>
        </EmptyState>
      </>
    );
  }

  const handleAddClick = () => navigate(getPath('/receipts/new'));

  return (
    <EntityTable
      headerVariant="primary"
      title="Receipts"
      description="Manage and track your inbound shipments and warehouse receipts."
      enableGlobalSearch
      data={receipts || []}
      columns={columns}
      isLoading={isLoading}
      onAddClick={handleAddClick}
      viewMode={tableState.viewMode}
      onViewModeChange={tableSetters.setViewMode}
      state={tableState}
      onStateChange={tableSetters}
      onReset={resetAll}
      headerActions={
        <AddButton
          to="/receipts/new"
          permission={PERMISSIONS.INVENTORY.RECEIVE}
          label="Create Receipt"
        />
      }
      searchKey="receiptNumber"
      toolbarFilters={(table) => (
        <DataTableFilter
          column={table.getColumn('status')}
          title="Status"
          options={receiptStatusOptions}
        />
      )}
    />
  );
}
