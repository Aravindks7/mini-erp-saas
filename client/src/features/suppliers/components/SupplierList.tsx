import * as React from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Truck, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { ExportButton } from '@/components/shared/data-table/ExportButton';
import { ImportModal } from '@/components/shared/data-table/ImportModal';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';

import { columns, supplierStatusOptions } from './columns';
import { useSuppliers, useBulkDeleteSuppliers } from '../hooks/suppliers.hooks';
import type { SupplierResponse } from '../api/suppliers.api';
import { PageHeader } from '@/components/shared/PageHeader';

const searchSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
});

export function SupplierList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: suppliers, isLoading, isError } = useSuppliers();
  const bulkDeleteMutation = useBulkDeleteSuppliers();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  // Bulk Delete State
  const [bulkDeleteState, setBulkDeleteState] = React.useState<{
    isOpen: boolean;
    rows: SupplierResponse[];
    clearSelection: () => void;
  }>({
    isOpen: false,
    rows: [],
    clearSelection: () => {},
  });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load suppliers"
        description="We encountered an error while fetching the supplier directory. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })}
      />
    );
  }

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = bulkDeleteState.rows.map((r) => r.id);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`Successfully deleted ${ids.length} supplier(s)`);
      bulkDeleteState.clearSelection();
      setBulkDeleteState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast.error('Failed to delete selected suppliers');
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

  if (!suppliers || suppliers.length === 0) {
    return (
      <>
        <PageHeader title="Suppliers" />
        <EmptyState
          title="Supplier Directory is empty"
          description="You haven't added any suppliers yet. Get started by creating a new record or importing your existing vendors from a CSV."
          icon={Truck}
        >
          <div className="flex items-center justify-center gap-4">
            <ImportModal
              endpoint="/suppliers/import"
              templateEndpoint="/suppliers/import/template"
              onSuccess={handleImportSuccess}
              trigger={
                <Button variant="outline" className="px-6">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
              }
            />
            <AddButton
              to="/suppliers/new"
              permission={PERMISSIONS.SUPPLIERS.CREATE}
              label="Add Supplier"
              className="shadow-lg shadow-primary/20"
            />
          </div>
        </EmptyState>
      </>
    );
  }

  const handleAddClick = () => navigate(getPath('/suppliers/new'));

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Suppliers"
        description="Manage your vendor base and their details."
        enableGlobalSearch
        data={suppliers || []}
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
            <ExportButton endpoint="/suppliers/export" filename="suppliers-export.csv" />
            <ImportModal
              endpoint="/suppliers/import"
              templateEndpoint="/suppliers/import/template"
              onSuccess={handleImportSuccess}
            />
            <AddButton
              to="/suppliers/new"
              permission={PERMISSIONS.SUPPLIERS.CREATE}
              label="Add Supplier"
            />
          </div>
        }
        bulkActions={[
          {
            label: 'Delete Selected',
            onAction: (rows: SupplierResponse[], clearSelection) => {
              setBulkDeleteState({ isOpen: true, rows, clearSelection });
            },
            variant: 'destructive',
          },
        ]}
        searchKey="name"
        toolbarFilters={(table) => (
          <DataTableFilter
            column={table.getColumn('status')}
            title="Status"
            options={supplierStatusOptions}
          />
        )}
      />

      <DeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        onClose={() => setBulkDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${bulkDeleteState.rows.length} Supplier(s)?`}
        description={`Are you sure you want to delete ${bulkDeleteState.rows.length} selected supplier(s)? This action is permanent and cannot be undone.`}
        confirmLabel="Delete Suppliers"
        isLoading={bulkDeleteMutation.isPending}
      />
    </>
  );
}
