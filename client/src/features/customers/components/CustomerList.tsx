import * as React from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Users, Upload } from 'lucide-react';
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

import { columns, customerStatusOptions } from './columns';
import { useCustomers, useBulkDeleteCustomers } from '../hooks/customers.hooks';
import type { CustomerResponse } from '../api/customers.api';
import { PageHeader } from '@/components/shared/PageHeader';

const searchSchema = z.object({
  companyName: z.string().optional(),
  status: z.string().optional(),
});

export function CustomerList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: customers, isLoading, isError } = useCustomers();
  const bulkDeleteMutation = useBulkDeleteCustomers();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  // Bulk Delete State
  const [bulkDeleteState, setBulkDeleteState] = React.useState<{
    isOpen: boolean;
    rows: CustomerResponse[];
    clearSelection: () => void;
  }>({
    isOpen: false,
    rows: [],
    clearSelection: () => {},
  });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load customers"
        description="We encountered an error while fetching the customer directory. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
      />
    );
  }

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = bulkDeleteState.rows.map((r) => r.id);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`Successfully deleted ${ids.length} customer(s)`);
      bulkDeleteState.clearSelection();
      setBulkDeleteState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast.error('Failed to delete selected customers');
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

  if (!customers || customers.length === 0) {
    return (
      <>
        <PageHeader title="Customers" />
        <EmptyState
          title="Customer Directory is empty"
          description="You haven't added any customers yet. Get started by creating a new record or importing your existing clients from a CSV."
          icon={Users}
        >
          <div className="flex items-center justify-center gap-4">
            <ImportModal
              endpoint="/customers/import"
              templateEndpoint="/customers/import/template"
              onSuccess={handleImportSuccess}
              trigger={
                <Button variant="outline" className="px-6">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
              }
            />
            <AddButton
              to="/customers/new"
              permission={PERMISSIONS.CUSTOMERS.CREATE}
              label="Add Customer"
              className="shadow-lg shadow-primary/20"
            />
          </div>
        </EmptyState>
      </>
    );
  }

  const handleAddClick = () => navigate(getPath('/customers/new'));

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Customers"
        description="Manage your client base and their details."
        enableGlobalSearch
        data={customers || []}
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
            <ExportButton endpoint="/customers/export" filename="customers-export.csv" />
            <ImportModal
              endpoint="/customers/import"
              templateEndpoint="/customers/import/template"
              onSuccess={handleImportSuccess}
            />
            <AddButton
              to="/customers/new"
              permission={PERMISSIONS.CUSTOMERS.CREATE}
              label="Add Customer"
            />
          </div>
        }
        bulkActions={[
          {
            label: 'Delete Selected',
            onAction: (rows: CustomerResponse[], clearSelection) => {
              setBulkDeleteState({ isOpen: true, rows, clearSelection });
            },
            variant: 'destructive',
          },
        ]}
        searchKey="companyName"
        toolbarFilters={(table) => (
          <DataTableFilter
            column={table.getColumn('status')}
            title="Status"
            options={customerStatusOptions}
          />
        )}
      />

      <DeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        onClose={() => setBulkDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${bulkDeleteState.rows.length} Customer(s)?`}
        description={`Are you sure you want to delete ${bulkDeleteState.rows.length} selected customer(s)? This action is permanent and cannot be undone.`}
        confirmLabel="Delete Customers"
        isLoading={bulkDeleteMutation.isPending}
      />
    </>
  );
}
