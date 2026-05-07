import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/contracts/rbac.contract';
import { APP_PATHS } from '@/lib/paths';

import { ErrorState } from '@/components/shared/ErrorState';

import { columns, transferStatusOptions } from './columns';
import { useInventoryTransfers } from '../../hooks/inventory.hooks';

const searchSchema = z.object({
  reference: z.string().optional(),
  status: z.string().optional(),
});

export function TransfersList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: transfers, isLoading, isError } = useInventoryTransfers();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load transfers"
        description="Encountered an error while fetching the transfer history."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers'] })}
      />
    );
  }

  const handleAddClick = () => navigate(getPath(APP_PATHS.inventory.transfers.new()));

  return (
    <EntityTable
      headerVariant="primary"
      title="Warehouse Transfers"
      description="Track and manage stock movements between different warehouse locations."
      enableGlobalSearch
      data={transfers || []}
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
          to={APP_PATHS.inventory.transfers.new()}
          permission={PERMISSIONS.INVENTORY.TRANSFER || PERMISSIONS.INVENTORY.ADJUST}
          label="New Transfer"
        />
      }
      searchKey="reference"
      toolbarFilters={(table) => (
        <DataTableFilter
          column={table.getColumn('status')}
          title="Status"
          options={transferStatusOptions}
        />
      )}
    />
  );
}
