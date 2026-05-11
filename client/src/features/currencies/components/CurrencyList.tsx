import * as React from 'react';
import { z } from 'zod';
import { Coins, Plus } from 'lucide-react';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { useDataTableState } from '@/hooks/useDataTableState';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/shared/Can';
import { usePermissionsStatus } from '@/hooks/usePermission';
import { DataTableSkeleton } from '@/components/shared/data-table/DataTableSkeleton';

import { getColumns } from './columns';
import { useCurrencies } from '../hooks/currencies.hooks';
import type { CurrencyResponse } from '@shared/contracts/currencies.contract';
import { CurrencyFormSheet } from './CurrencyFormSheet';

const searchSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
});

export function CurrencyList() {
  const { data: currencies, isLoading: isDataLoading, isError, refetch } = useCurrencies();
  const { isLoading: isPermissionsLoading } = usePermissionsStatus();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  const [formSheetState, setFormSheetState] = React.useState<{
    isOpen: boolean;
    currency?: CurrencyResponse;
  }>({
    isOpen: false,
  });

  const handleEdit = (currency: CurrencyResponse) => {
    setFormSheetState({ isOpen: true, currency });
  };

  const handleAdd = () => {
    setFormSheetState({ isOpen: true, currency: undefined });
  };

  const columns = React.useMemo(() => getColumns({ onEdit: handleEdit }), []);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load currencies"
        description="We encountered an error while fetching the currencies. Please check your network or try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (isDataLoading || isPermissionsLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} />;
  }

  if (!currencies || currencies.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Currencies" />
        <EmptyState
          title="No Currencies found"
          description="You haven't added any currencies yet. Currencies are used for all financial transactions in your ERP."
          icon={Coins}
        >
          <Can I={PERMISSIONS.ORGANIZATION.SETTINGS}>
            <Button onClick={handleAdd} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Add Currency
            </Button>
          </Can>
        </EmptyState>
        <CurrencyFormSheet
          isOpen={formSheetState.isOpen}
          onClose={() => setFormSheetState({ isOpen: false })}
          currency={formSheetState.currency}
        />
      </div>
    );
  }

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Currencies"
        description="Manage the currencies used for your business transactions."
        enableGlobalSearch
        data={currencies || []}
        columns={columns}
        isLoading={isDataLoading}
        onAddClick={handleAdd}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <Can I={PERMISSIONS.ORGANIZATION.SETTINGS}>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Currency
            </Button>
          </Can>
        }
        searchKey="name"
      />

      <CurrencyFormSheet
        isOpen={formSheetState.isOpen}
        onClose={() => setFormSheetState({ isOpen: false })}
        currency={formSheetState.currency}
      />
    </>
  );
}
