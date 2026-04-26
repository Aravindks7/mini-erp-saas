import * as React from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Warehouse, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { ExportButton } from '@/components/shared/data-table/ExportButton';
import { ImportModal } from '@/components/shared/data-table/ImportModal';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';

import { columns } from './columns';
import { useWarehouses, useBulkDeleteWarehouses } from '../hooks/warehouses.hooks';
import type { WarehouseResponse } from '../api/warehouses.api';
import { PageHeader } from '@/components/shared/PageHeader';

const searchSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
});

export function WarehouseList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: warehouses, isLoading, isError } = useWarehouses();
  const bulkDeleteMutation = useBulkDeleteWarehouses();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  // Bulk Delete State
  const [bulkDeleteState, setBulkDeleteState] = React.useState<{
    isOpen: boolean;
    rows: WarehouseResponse[];
    clearSelection: () => void;
  }>({
    isOpen: false,
    rows: [],
    clearSelection: () => {},
  });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load warehouses"
        description="We encountered an error while fetching the warehouse list. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['warehouses'] })}
      />
    );
  }

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['warehouses'] });
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = bulkDeleteState.rows.map((r) => r.id);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`Successfully deleted ${ids.length} warehouse(s)`);
      bulkDeleteState.clearSelection();
      setBulkDeleteState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast.error('Failed to delete selected warehouses');
      console.error('Bulk delete error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!warehouses || warehouses.length === 0) {
    return (
      <>
        <PageHeader title="Warehouses" />
        <EmptyState
          title="Warehouse List is empty"
          description="You haven't added any warehouses yet. Get started by creating a new record or importing from a CSV."
          icon={Warehouse}
        >
          <div className="flex items-center justify-center gap-4">
            <ImportModal
              endpoint="/warehouses/import"
              templateEndpoint="/warehouses/import/template"
              onSuccess={handleImportSuccess}
              trigger={
                <Button variant="outline" className="px-6">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
              }
            />
            <AddButton
              to="/warehouses/new"
              permission={PERMISSIONS.WAREHOUSES.CREATE}
              label="Add Warehouse"
              className="shadow-lg shadow-primary/20"
            />
          </div>
        </EmptyState>
      </>
    );
  }

  const handleAddClick = () => navigate(getPath('/warehouses/new'));

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Warehouses"
        description="Manage your storage facilities and locations."
        enableGlobalSearch
        data={warehouses || []}
        columns={columns}
        isLoading={isLoading}
        onAddClick={handleAddClick}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <div className="flex items-center gap-2">
            <ExportButton endpoint="/warehouses/export" filename="warehouses-export.csv" />
            <ImportModal
              endpoint="/warehouses/import"
              templateEndpoint="/warehouses/import/template"
              onSuccess={handleImportSuccess}
            />
            <AddButton
              to="/warehouses/new"
              permission={PERMISSIONS.WAREHOUSES.CREATE}
              label="Add Warehouse"
            />
          </div>
        }
        bulkActions={[
          {
            label: 'Delete Selected',
            onAction: (rows: WarehouseResponse[], clearSelection) => {
              setBulkDeleteState({ isOpen: true, rows, clearSelection });
            },
            variant: 'destructive',
          },
        ]}
        searchKey="name"
      />

      <DeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        onClose={() => setBulkDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${bulkDeleteState.rows.length} Warehouse(s)?`}
        description={`Are you sure you want to delete ${bulkDeleteState.rows.length} selected warehouse(s)? This action is permanent and cannot be undone.`}
        confirmLabel="Delete Warehouses"
        isLoading={bulkDeleteMutation.isPending}
      />
    </>
  );
}
