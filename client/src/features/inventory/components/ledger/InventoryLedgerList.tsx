import { History } from 'lucide-react';
import { z } from 'zod';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { useDataTableState } from '@/hooks/useDataTableState';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { usePermissionsStatus } from '@/hooks/usePermission';

import { columns } from './columns';
import { useInventoryLedgerQuery, useInventoryLedgerActions } from '../../hooks/inventory.hooks';

const searchSchema = z.object({
  'product.name': z.string().optional(),
});

export function InventoryLedgerList() {
  const { data: ledger, isLoading: isDataLoading, isError } = useInventoryLedgerQuery();
  const { isLoading: isPermissionsLoading } = usePermissionsStatus();
  const { invalidateLedger } = useInventoryLedgerActions();

  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load inventory ledger"
        description="Encountered an error while fetching the movement history. Please try again."
        onRetry={invalidateLedger}
      />
    );
  }

  const isLoading = isDataLoading || isPermissionsLoading;

  if (!isLoading && (!ledger || ledger.length === 0)) {
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
      data={ledger || []}
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
