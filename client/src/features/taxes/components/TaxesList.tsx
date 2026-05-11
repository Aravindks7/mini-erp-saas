import * as React from 'react';
import { z } from 'zod';
import { Percent, Plus } from 'lucide-react';

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
import { useTaxesQuery, useTaxesActions } from '../hooks/taxes.hooks';
import type { TaxResponse } from '../api/taxes.api';
import { TaxFormSheet } from './TaxFormSheet';

const searchSchema = z.object({
  name: z.string().optional(),
});

export function TaxesList() {
  const { data: taxes, isLoading: isDataLoading, isError } = useTaxesQuery();
  const { isLoading: isPermissionsLoading } = usePermissionsStatus();
  const { invalidateTaxes } = useTaxesActions();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  const [formSheetState, setFormSheetState] = React.useState<{
    isOpen: boolean;
    tax?: TaxResponse;
  }>({
    isOpen: false,
  });

  const handleEdit = (tax: TaxResponse) => {
    setFormSheetState({ isOpen: true, tax });
  };

  const handleAdd = () => {
    setFormSheetState({ isOpen: true, tax: undefined });
  };

  const columns = React.useMemo(() => getColumns({ onEdit: handleEdit }), []);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load taxes"
        description="We encountered an error while fetching the taxes. Please check your network or try again."
        onRetry={invalidateTaxes}
      />
    );
  }

  if (isDataLoading || isPermissionsLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} />;
  }

  if (!taxes || taxes.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Taxes" />
        <EmptyState
          title="No Taxes found"
          description="You haven't added any taxes yet. Taxes are used for your products and services."
          icon={Percent}
        >
          <Can I={PERMISSIONS.TAXES.CREATE}>
            <Button onClick={handleAdd} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Add Tax
            </Button>
          </Can>
        </EmptyState>
        <TaxFormSheet
          isOpen={formSheetState.isOpen}
          onClose={() => setFormSheetState({ isOpen: false })}
          tax={formSheetState.tax}
        />
      </div>
    );
  }

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Taxes"
        description="Manage the taxes used for your inventory and products."
        enableGlobalSearch
        data={taxes || []}
        columns={columns}
        isLoading={isDataLoading}
        onAddClick={handleAdd}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <Can I={PERMISSIONS.TAXES.CREATE}>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tax
            </Button>
          </Can>
        }
        searchKey="name"
      />

      <TaxFormSheet
        isOpen={formSheetState.isOpen}
        onClose={() => setFormSheetState({ isOpen: false })}
        tax={formSheetState.tax}
      />
    </>
  );
}
