import { FileEdit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { WarehouseResponse } from '../api/warehouses.api';
import { useDeleteWarehouse } from '../hooks/warehouses.hooks';
import { useTenantPath } from '@/hooks/useTenantPath';

interface WarehouseRowActionsProps {
  row: { original: WarehouseResponse };
}

export function WarehouseRowActions({ row }: WarehouseRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteWarehouse, status: deleteStatus } = useDeleteWarehouse();
  const warehouse = row.original;

  const handleDelete = () => {
    deleteWarehouse(warehouse.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/warehouses/${warehouse.id}`)),
      tooltip: 'View Details',
    },
    {
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/warehouses/${warehouse.id}/edit`)),
      tooltip: 'Edit Warehouse',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete Warehouse',
    },
  ];

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Warehouse"
        description={`Are you sure you want to delete ${warehouse.name}? This action cannot be undone and will remove all associated bin data.`}
        isLoading={deleteStatus === 'pending'}
      />
    </>
  );
}
