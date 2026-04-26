import { FileEdit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { ProductResponse } from '../api/products.api';
import { useDeleteProduct } from '../hooks/products.hooks';
import { useTenantPath } from '@/hooks/useTenantPath';

interface ProductRowActionsProps {
  row: { original: ProductResponse };
}

export function ProductRowActions({ row }: ProductRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteProduct, status: deleteStatus } = useDeleteProduct();
  const product = row.original;

  const handleDelete = () => {
    deleteProduct(product.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/products/${product.id}`)),
      tooltip: 'View Details',
    },
    {
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/products/${product.id}/edit`)),
      tooltip: 'Edit Product',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete Product',
    },
  ];

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete ${product.name}? This action cannot be undone.`}
        isLoading={deleteStatus === 'pending'}
      />
    </>
  );
}
