import { FileEdit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { SupplierResponse } from '../api/suppliers.api';
import { useDeleteSupplier } from '../hooks/suppliers.hooks';
import { useTenantPath } from '@/hooks/useTenantPath';

interface SupplierRowActionsProps {
  row: { original: SupplierResponse };
}

export function SupplierRowActions({ row }: SupplierRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteSupplier, status: deleteStatus } = useDeleteSupplier();
  const supplier = row.original;

  const handleDelete = () => {
    deleteSupplier(supplier.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/suppliers/${supplier.id}`)),
      tooltip: 'View Details',
    },
    {
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/suppliers/${supplier.id}/edit`)),
      tooltip: 'Edit Supplier',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete Supplier',
    },
  ];

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        description={`Are you sure you want to delete ${supplier.name}? This action cannot be undone and will remove all associated contact and address data.`}
        isLoading={deleteStatus === 'pending'}
      />
    </>
  );
}
