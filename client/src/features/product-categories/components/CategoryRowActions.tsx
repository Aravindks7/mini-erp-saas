import { FileEdit, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { ProductCategoryResponse } from '../api/product-categories.api';
import { useDeleteProductCategory } from '../hooks/product-categories.hooks';

interface CategoryRowActionsProps {
  row: { original: ProductCategoryResponse };
  onEdit: (category: ProductCategoryResponse) => void;
}

export function CategoryRowActions({ row, onEdit }: CategoryRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteCategory, status: deleteStatus } = useDeleteProductCategory();
  const category = row.original;

  const handleDelete = () => {
    deleteCategory(category.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => onEdit(category),
      tooltip: 'Edit Category',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete Category',
    },
  ];

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Category?"
        description={`Are you sure you want to delete "${category.name}"? This action cannot be undone.`}
        isLoading={deleteStatus === 'pending'}
      />
    </>
  );
}
