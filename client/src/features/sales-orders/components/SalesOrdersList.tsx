import * as React from 'react';
import { z } from 'zod';
import { LayoutList, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/shared/Can';
import { useTenantPath } from '@/hooks/useTenantPath';
import { usePermissionsStatus } from '@/hooks/usePermission';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import { DataTableSkeleton } from '@/components/shared/data-table/DataTableSkeleton';

import { useSalesOrderColumns, salesOrderStatusOptions } from './columns';
import {
  useSalesOrdersQuery,
  useBulkDeleteSalesOrders,
  useSalesOrdersActions,
} from '../hooks/sales-orders.hooks';
import type { SalesOrderResponse } from '../api/sales-orders.api';
import { FulfillSalesOrderSheet } from './FulfillSalesOrderSheet';
import { APP_PATHS } from '@/lib/paths';

const searchSchema = z.object({
  documentNumber: z.string().optional(),
  status: z.string().optional(),
});

export function SalesOrdersList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: sos, isLoading: isDataLoading, isError } = useSalesOrdersQuery();
  const { isLoading: isPermissionsLoading } = usePermissionsStatus();
  const { invalidateSalesOrders } = useSalesOrdersActions();
  const bulkDeleteMutation = useBulkDeleteSalesOrders();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  // Fulfillment State
  const [fulfillState, setFulfillState] = React.useState<{
    isOpen: boolean;
    so?: SalesOrderResponse;
  }>({
    isOpen: false,
  });

  // Bulk Delete State
  const [bulkDeleteState, setBulkDeleteState] = React.useState<{
    isOpen: boolean;
    rows: SalesOrderResponse[];
    clearSelection: () => void;
  }>({
    isOpen: false,
    rows: [],
    clearSelection: () => {},
  });

  const handleFulfill = React.useCallback((so: SalesOrderResponse) => {
    setFulfillState({ isOpen: true, so });
  }, []);

  const handleAdd = () => {
    navigate(getPath(APP_PATHS.sales.orders.new()));
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = bulkDeleteState.rows.map((r) => r.id);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`Successfully deleted ${ids.length} order(s)`);
      bulkDeleteState.clearSelection();
      setBulkDeleteState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast.error('Failed to delete selected orders');
      console.error('Bulk delete error:', error);
    }
  };

  const columns = useSalesOrderColumns({ onFulfill: handleFulfill });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load sales orders"
        description="We encountered an error while fetching the sales orders. Please check your network or try again."
        onRetry={invalidateSalesOrders}
      />
    );
  }

  if (isDataLoading || isPermissionsLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} />;
  }

  if (!sos || sos.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Sales Orders" />
        <EmptyState
          title="No Sales Orders found"
          description="Start by creating your first sales order to capture customer demand."
          icon={LayoutList}
        >
          <Can I={PERMISSIONS.SALES_ORDERS.CREATE}>
            <Button onClick={handleAdd} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Can>
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Sales Orders"
        description="Manage customer orders and fulfillment workflows."
        enableGlobalSearch
        data={sos || []}
        columns={columns}
        isLoading={isDataLoading}
        onAddClick={handleAdd}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <Can I={PERMISSIONS.SALES_ORDERS.CREATE}>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Can>
        }
        bulkActions={[
          {
            label: 'Delete Selected',
            onAction: (rows: SalesOrderResponse[], clearSelection) => {
              const nonDraft = rows.find((r) => r.status !== 'draft');
              if (nonDraft) {
                toast.error('Only draft orders can be deleted');
                return;
              }
              setBulkDeleteState({ isOpen: true, rows, clearSelection });
            },
            variant: 'destructive',
          },
        ]}
        searchKey="documentNumber"
        toolbarFilters={(table) => (
          <DataTableFilter
            column={table.getColumn('status')}
            title="Status"
            options={salesOrderStatusOptions}
          />
        )}
      />

      <DeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        onClose={() => setBulkDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${bulkDeleteState.rows.length} Order(s)?`}
        description={`Are you sure you want to delete ${bulkDeleteState.rows.length} selected order(s)? Only draft orders will be removed.`}
        confirmLabel="Delete Orders"
        isLoading={bulkDeleteMutation.isPending}
      />

      <FulfillSalesOrderSheet
        isOpen={fulfillState.isOpen}
        onClose={() => setFulfillState({ isOpen: false })}
        so={fulfillState.so}
      />
    </>
  );
}
