import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Boxes, Plus } from 'lucide-react';
import { z } from 'zod';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

import { columns } from './columns';
import { useInventoryLevels } from '../../hooks/inventory.hooks';

const searchSchema = z.object({
  'product.name': z.string().optional(),
});

export function InventoryLevelsList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: levels, isLoading, isError } = useInventoryLevels();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load inventory levels"
        description="Encountered an error while fetching the current stock status. Please try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['inventory', 'levels'] })}
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

  if (!levels || levels.length === 0) {
    return (
      <>
        <PageHeader title="Inventory Levels" />
        <EmptyState
          title="No stock records found"
          description="You haven't recorded any inventory levels yet. Start by creating an inventory adjustment."
          icon={Boxes}
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
      title="Inventory Levels"
      description="Real-time visibility of stock across all warehouses and bins."
      enableGlobalSearch
      data={levels}
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
      searchKey="product.name"
    />
  );
}
