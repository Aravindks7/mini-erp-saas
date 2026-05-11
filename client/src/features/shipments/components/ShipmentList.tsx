import * as React from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';
import { APP_PATHS } from '@/lib/paths';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import { usePermissionsStatus } from '@/hooks/usePermission';
import { DataTableSkeleton } from '@/components/shared/data-table/DataTableSkeleton';

import { columns, shipmentStatusOptions } from './columns';
import {
  useShipmentsQuery,
  useBulkDeleteShipments,
  useShipmentsActions,
} from '../hooks/shipments.hooks';
import { PageHeader } from '@/components/shared/PageHeader';
import type { ShipmentResponse } from '../api/shipments.api';

const searchSchema = z.object({
  shipmentNumber: z.string().optional(),
  reference: z.string().optional(),
  status: z.string().optional(),
});

export function ShipmentList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: shipments, isLoading: isDataLoading, isError } = useShipmentsQuery();
  const { isLoading: isPermissionsLoading } = usePermissionsStatus();
  const { invalidateShipments } = useShipmentsActions();
  const bulkDeleteMutation = useBulkDeleteShipments();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  // Bulk Delete State
  const [bulkDeleteState, setBulkDeleteState] = React.useState<{
    isOpen: boolean;
    rows: ShipmentResponse[];
    clearSelection: () => void;
  }>({
    isOpen: false,
    rows: [],
    clearSelection: () => {},
  });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load shipments"
        description="We encountered an error while fetching the shipment list. Please check your network or try again."
        onRetry={invalidateShipments}
      />
    );
  }

  const handleBulkDeleteConfirm = async () => {
    const ids = bulkDeleteState.rows.map((r) => r.id);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`Successfully deleted ${ids.length} shipment(s)`);
      bulkDeleteState.clearSelection();
      setBulkDeleteState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast.error('Failed to delete selected shipments');
      console.error('Bulk delete error:', error);
    }
  };

  if (isDataLoading || isPermissionsLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} />;
  }

  if (!shipments || shipments.length === 0) {
    return (
      <>
        <PageHeader title="Shipments" />
        <EmptyState
          title="No shipments found"
          description="You haven't recorded any shipments yet. Get started by fulfilling a sales order."
          icon={Truck}
        >
          <div className="flex items-center justify-center gap-4">
            <AddButton
              to={APP_PATHS.sales.shipments.new()}
              permission={PERMISSIONS.SHIPMENTS.CREATE}
              label="Create Shipment"
              className="shadow-lg shadow-primary/20"
            />
          </div>
        </EmptyState>
      </>
    );
  }

  const handleAddClick = () => navigate(getPath(APP_PATHS.sales.shipments.new()));

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Shipments"
        description="Manage and track your outbound logistics and customer shipments."
        enableGlobalSearch
        data={shipments || []}
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
            to={APP_PATHS.sales.shipments.new()}
            permission={PERMISSIONS.SHIPMENTS.CREATE}
            label="Create Shipment"
          />
        }
        bulkActions={[
          {
            label: 'Delete Selected',
            onAction: (rows: ShipmentResponse[], clearSelection) => {
              setBulkDeleteState({ isOpen: true, rows, clearSelection });
            },
            variant: 'destructive',
          },
        ]}
        searchKey="shipmentNumber"
        toolbarFilters={(table) => (
          <DataTableFilter
            column={table.getColumn('status')}
            title="Status"
            options={shipmentStatusOptions}
          />
        )}
      />

      <DeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        onClose={() => setBulkDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${bulkDeleteState.rows.length} Shipment(s)?`}
        description={`Are you sure you want to delete ${bulkDeleteState.rows.length} selected shipment(s)? This will reverse all associated inventory movements.`}
        confirmLabel="Delete Shipments"
        isLoading={bulkDeleteMutation.isPending}
      />
    </>
  );
}
