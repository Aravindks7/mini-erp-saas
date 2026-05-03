import * as React from 'react';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Layers } from 'lucide-react';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { useDataTableState } from '@/hooks/useDataTableState';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/shared/Can';

import { getColumns } from './columns';
import { useProductCategories } from '../hooks/product-categories.hooks';
import type { ProductCategoryResponse } from '../api/product-categories.api';
import { CategoryFormSheet } from './CategoryFormSheet';

const searchSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
});

export function CategoryList() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading, isError } = useProductCategories();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  const [formSheetState, setFormSheetState] = React.useState<{
    isOpen: boolean;
    category?: ProductCategoryResponse;
  }>({
    isOpen: false,
  });

  const handleEdit = (category: ProductCategoryResponse) => {
    setFormSheetState({ isOpen: true, category });
  };

  const handleAddClick = () => {
    setFormSheetState({ isOpen: true, category: undefined });
  };

  const columns = React.useMemo(() => getColumns({ onEdit: handleEdit }), []);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load categories"
        description="We encountered an error while fetching the product categories. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['product-categories'] })}
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

  // Map parent names for the table
  const categoriesWithParent =
    categories?.map((cat) => ({
      ...cat,
      parentName: categories.find((c) => c.id === cat.parentId)?.name,
    })) || [];

  if (!categories || categories.length === 0) {
    return (
      <>
        <PageHeader title="Product Categories" />
        <EmptyState
          title="No categories found"
          description="You haven't added any product categories yet. Organize your inventory by creating your first category."
          icon={Layers}
        >
          <div className="flex items-center justify-center gap-4">
            <Can I={PERMISSIONS.PRODUCTS.CREATE}>
              <Button onClick={handleAddClick} className="shadow-lg shadow-primary/20">
                <Layers className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </Can>
          </div>
        </EmptyState>
        <CategoryFormSheet
          isOpen={formSheetState.isOpen}
          onClose={() => setFormSheetState({ isOpen: false })}
          category={formSheetState.category}
        />
      </>
    );
  }

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Product Categories"
        description="Manage your product hierarchy and categories."
        enableGlobalSearch
        data={categoriesWithParent}
        columns={columns}
        isLoading={isLoading}
        onAddClick={handleAddClick}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <Can I={PERMISSIONS.PRODUCTS.CREATE}>
            <Button onClick={handleAddClick}>
              <Layers className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </Can>
        }
        searchKey="name"
      />

      <CategoryFormSheet
        isOpen={formSheetState.isOpen}
        onClose={() => setFormSheetState({ isOpen: false })}
        category={formSheetState.category}
      />
    </>
  );
}
