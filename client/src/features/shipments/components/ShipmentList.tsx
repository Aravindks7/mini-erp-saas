import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Truck } from 'lucide-react';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';

import { columns, shipmentStatusOptions } from './columns';
import { useShipments } from '../hooks/shipments.hooks';
import { PageHeader } from '@/components/shared/PageHeader';

const searchSchema = z.object({
  shipmentNumber: z.string().optional(),
  reference: z.string().optional(),
  status: z.string().optional(),
});

export function ShipmentList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: shipments, isLoading, isError } = useShipments();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load shipments"
        description="We encountered an error while fetching the shipment list. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['shipments'] })}
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
              to="/shipments/new"
              permission={PERMISSIONS.SHIPMENTS.CREATE}
              label="Create Shipment"
              className="shadow-lg shadow-primary/20"
            />
          </div>
        </EmptyState>
      </>
    );
  }

  const handleAddClick = () => navigate(getPath('/shipments/new'));

  return (
    <EntityTable
      headerVariant="primary"
      title="Shipments"
      description="Manage and track your outbound logistics and customer shipments."
      enableGlobalSearch
      data={shipments || []}
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
          to="/shipments/new"
          permission={PERMISSIONS.SHIPMENTS.CREATE}
          label="Create Shipment"
        />
      }
      searchKey="shipmentNumber"
      toolbarFilters={(table) => (
        <DataTableFilter
          column={table.getColumn('status')}
          title="Status"
          options={shipmentStatusOptions}
        />
      )}
    />
  );
}
