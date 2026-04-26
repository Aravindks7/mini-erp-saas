import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus } from 'lucide-react';
import { z } from 'zod';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

import { columns, adjustmentStatusOptions } from './columns';
import { useInventoryAdjustments } from '../../hooks/inventory.hooks';

const searchSchema = z.object({
  reference: z.string().optional(),
  status: z.string().optional(),
});

export function AdjustmentsList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: adjustments, isLoading, isError } = useInventoryAdjustments();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load adjustments"
        description="Encountered an error while fetching the adjustment history. Please try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['inventory', 'adjustments'] })}
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

  if (!adjustments || adjustments.length === 0) {
    return (
      <>
        <PageHeader title="Inventory Adjustments" />
        <EmptyState
          title="No adjustments recorded"
          description="Track manual stock corrections, cycle counts, and damages here."
          icon={ClipboardList}
        >
          <AddButton
            to="/adjustments/new"
            permission={PERMISSIONS.INVENTORY.ADJUST}
            label="Create Adjustment"
            icon={<Plus className="mr-2 h-4 w-4" />}
          />
        </EmptyState>
      </>
    );
  }

  const handleAddClick = () => navigate(getPath('/adjustments/new'));

  return (
    <EntityTable
      headerVariant="primary"
      title="Inventory Adjustments"
      description="Audit log of all manual stock corrections and variances."
      enableGlobalSearch
      data={adjustments}
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
          to="/adjustments/new"
          permission={PERMISSIONS.INVENTORY.ADJUST}
          label="New Adjustment"
        />
      }
      searchKey="reference"
      toolbarFilters={(table) => (
        <DataTableFilter
          column={table.getColumn('status')}
          title="Status"
          options={adjustmentStatusOptions}
        />
      )}
    />
  );
}
