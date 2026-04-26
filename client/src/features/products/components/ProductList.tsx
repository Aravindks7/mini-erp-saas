import * as React from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { toast } from 'sonner';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';

import { columns, productStatusOptions } from './columns';
import { useProducts, useBulkDeleteProducts } from '../hooks/products.hooks';
import type { ProductResponse } from '../api/products.api';
import { PageHeader } from '@/components/shared/PageHeader';

const searchSchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional(),
  status: z.string().optional(),
});

export function ProductList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: products, isLoading, isError } = useProducts();
  const bulkDeleteMutation = useBulkDeleteProducts();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  // Bulk Delete State
  const [bulkDeleteState, setBulkDeleteState] = React.useState<{
    isOpen: boolean;
    rows: ProductResponse[];
    clearSelection: () => void;
  }>({
    isOpen: false,
    rows: [],
    clearSelection: () => {},
  });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load products"
        description="We encountered an error while fetching the product catalog. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
      />
    );
  }

  const handleBulkDeleteConfirm = async () => {
    const ids = bulkDeleteState.rows.map((r) => r.id);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`Successfully deleted ${ids.length} product(s)`);
      bulkDeleteState.clearSelection();
      setBulkDeleteState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast.error('Failed to delete selected products');
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

  if (!products || products.length === 0) {
    return (
      <>
        <PageHeader title="Products" />
        <EmptyState
          title="Product Catalog is empty"
          description="You haven't added any products yet. Get started by creating your first product record."
          icon={Package}
        >
          <div className="flex items-center justify-center gap-4">
            <AddButton
              to="/products/new"
              permission={PERMISSIONS.PRODUCTS.CREATE}
              label="Add Product"
              className="shadow-lg shadow-primary/20"
            />
          </div>
        </EmptyState>
      </>
    );
  }

  const handleAddClick = () => navigate(getPath('/products/new'));

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Products"
        description="Manage your product catalog, pricing, and taxes."
        enableGlobalSearch
        data={products || []}
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
            <AddButton
              to="/products/new"
              permission={PERMISSIONS.PRODUCTS.CREATE}
              label="Add Product"
            />
          </div>
        }
        bulkActions={[
          {
            label: 'Delete Selected',
            onAction: (rows: ProductResponse[], clearSelection) => {
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
            options={productStatusOptions}
          />
        )}
      />

      <DeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        onClose={() => setBulkDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${bulkDeleteState.rows.length} Product(s)?`}
        description={`Are you sure you want to delete ${bulkDeleteState.rows.length} selected product(s)? This action is permanent and cannot be undone.`}
        confirmLabel="Delete Products"
        isLoading={bulkDeleteMutation.isPending}
      />
    </>
  );
}
