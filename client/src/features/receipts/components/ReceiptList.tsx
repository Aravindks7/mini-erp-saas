import * as React from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Package2 } from 'lucide-react';
import { toast } from 'sonner';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import { usePermissionsStatus } from '@/hooks/usePermission';
import { DataTableSkeleton } from '@/components/shared/data-table/DataTableSkeleton';

import { columns, receiptStatusOptions } from './columns';
import {
  useReceiptsQuery,
  useBulkDeleteReceipts,
  useReceiptsActions,
} from '../hooks/receipts.hooks';
import { PageHeader } from '@/components/shared/PageHeader';
import type { ReceiptResponse } from '../api/receipts.api';
import { APP_PATHS } from '@/lib/paths';

const searchSchema = z.object({
  receiptNumber: z.string().optional(),
  reference: z.string().optional(),
  status: z.string().optional(),
});

export function ReceiptList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: receipts, isLoading: isDataLoading, isError } = useReceiptsQuery();
  const { isLoading: isPermissionsLoading } = usePermissionsStatus();
  const { invalidateReceipts } = useReceiptsActions();
  const bulkDeleteMutation = useBulkDeleteReceipts();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  // Bulk Delete State
  const [bulkDeleteState, setBulkDeleteState] = React.useState<{
    isOpen: boolean;
    rows: ReceiptResponse[];
    clearSelection: () => void;
  }>({
    isOpen: false,
    rows: [],
    clearSelection: () => {},
  });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load receipts"
        description="We encountered an error while fetching the receipt list. Please check your network or try again."
        onRetry={invalidateReceipts}
      />
    );
  }

  if (isDataLoading || isPermissionsLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} />;
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
              to={APP_PATHS.purchasing.receipts.new()}
              permission={PERMISSIONS.INVENTORY.RECEIVE}
              label="Create Receipt"
              className="shadow-lg shadow-primary/20"
            />
          </div>
        </EmptyState>
      </>
    );
  }

  const handleBulkDeleteConfirm = async () => {
    const ids = bulkDeleteState.rows.map((r) => r.id);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`Successfully deleted ${ids.length} receipt(s)`);
      bulkDeleteState.clearSelection();
      setBulkDeleteState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast.error('Failed to delete selected receipts');
      console.error('Bulk delete error:', error);
    }
  };

  const handleAddClick = () => navigate(getPath(APP_PATHS.purchasing.receipts.new()));

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Receipts"
        description="Manage and track your inbound shipments and warehouse receipts."
        enableGlobalSearch
        data={receipts || []}
        columns={columns}
        isLoading={isDataLoading}
        onAddClick={handleAddClick}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <AddButton
            to={APP_PATHS.purchasing.receipts.new()}
            permission={PERMISSIONS.INVENTORY.RECEIVE}
            label="Create Receipt"
          />
        }
        bulkActions={[
          {
            label: 'Delete Selected',
            onAction: (rows: ReceiptResponse[], clearSelection) => {
              setBulkDeleteState({ isOpen: true, rows, clearSelection });
            },
            variant: 'destructive',
          },
        ]}
        searchKey="receiptNumber"
        toolbarFilters={(table) => (
          <DataTableFilter
            column={table.getColumn('status')}
            title="Status"
            options={receiptStatusOptions}
          />
        )}
      />

      <DeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        onClose={() => setBulkDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${bulkDeleteState.rows.length} Receipt(s)?`}
        description={`Are you sure you want to delete ${bulkDeleteState.rows.length} selected receipt(s)? This will reverse all associated inventory movements.`}
        confirmLabel="Delete Receipts"
        isLoading={bulkDeleteMutation.isPending}
      />
    </>
  );
}
