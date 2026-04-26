import { useQueryClient } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { useDataTableState } from '@/hooks/useDataTableState';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

import { columns } from './columns';
import { useInventoryLedger } from '../../hooks/inventory.hooks';

const searchSchema = z.object({
  'product.name': z.string().optional(),
});

export function InventoryLedgerList() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') || undefined;
  const warehouseId = searchParams.get('warehouseId') || undefined;
  const binId = searchParams.get('binId') || undefined;

  const queryClient = useQueryClient();
  const {
    data: ledger,
    isLoading,
    isError,
  } = useInventoryLedger({
    productId,
    warehouseId,
    binId,
  });

  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load inventory ledger"
        description="Encountered an error while fetching the movement history. Please try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['inventory', 'ledger'] })}
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

  if (!ledger || ledger.length === 0) {
    return (
      <>
        <PageHeader title="Inventory Ledger" />
        <EmptyState
          title="No movements recorded"
          description="There are no historical movements for the selected criteria."
          icon={History}
        />
      </>
    );
  }

  return (
    <EntityTable
      headerVariant="primary"
      title="Inventory Ledger"
      description="Full audit trail of every stock addition and deduction."
      enableGlobalSearch
      data={ledger}
      columns={columns}
      isLoading={isLoading}
      viewMode={tableState.viewMode}
      onViewModeChange={tableSetters.setViewMode}
      state={tableState}
      onStateChange={tableSetters}
      onReset={resetAll}
      searchKey="product.name"
    />
  );
}
