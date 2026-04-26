import * as React from 'react';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Ruler, Plus } from 'lucide-react';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { useDataTableState } from '@/hooks/useDataTableState';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/shared/Can';

import { getColumns } from './columns';
import { useUoms } from '../hooks/uoms.hooks';
import type { UomResponse } from '../api/uoms.api';
import { UomFormSheet } from './UomFormSheet';

const searchSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
});

export function UomList() {
  const queryClient = useQueryClient();
  const { data: uoms, isLoading, isError } = useUoms();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  const [formSheetState, setFormSheetState] = React.useState<{
    isOpen: boolean;
    uom?: UomResponse;
  }>({
    isOpen: false,
  });

  const handleEdit = (uom: UomResponse) => {
    setFormSheetState({ isOpen: true, uom });
  };

  const handleAdd = () => {
    setFormSheetState({ isOpen: true, uom: undefined });
  };

  const columns = React.useMemo(() => getColumns({ onEdit: handleEdit }), []);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load units of measure"
        description="We encountered an error while fetching the units of measure. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['uoms'] })}
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

  if (!uoms || uoms.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Units of Measure" />
        <EmptyState
          title="No Units of Measure found"
          description="You haven't added any units of measure yet. Units of measure are used to define quantities for your products (e.g., PCS, KG, L)."
          icon={Ruler}
        >
          <Can I={PERMISSIONS.UOM.CREATE}>
            <Button onClick={handleAdd} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Add Unit of Measure
            </Button>
          </Can>
        </EmptyState>
        <UomFormSheet
          isOpen={formSheetState.isOpen}
          onClose={() => setFormSheetState({ isOpen: false })}
          uom={formSheetState.uom}
        />
      </div>
    );
  }

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Units of Measure"
        description="Manage the units used for your inventory and products."
        enableGlobalSearch
        data={uoms || []}
        columns={columns}
        isLoading={isLoading}
        onAddClick={handleAdd}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <Can I={PERMISSIONS.UOM.CREATE}>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Unit of Measure
            </Button>
          </Can>
        }
        searchKey="name"
      />

      <UomFormSheet
        isOpen={formSheetState.isOpen}
        onClose={() => setFormSheetState({ isOpen: false })}
        uom={formSheetState.uom}
      />
    </>
  );
}
