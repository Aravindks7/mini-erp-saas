import { FileEdit, Eye, Truck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';
import { useTenantPath } from '@/hooks/useTenantPath';
import type { SalesOrderResponse } from '../api/sales-orders.api';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import { useDeleteSalesOrder } from '../hooks/sales-orders.hooks';

interface SalesOrderRowActionsProps {
  row: { original: SalesOrderResponse };
  onFulfill: (so: SalesOrderResponse) => void;
}

export function SalesOrderRowActions({ row, onFulfill }: SalesOrderRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteSO, isPending: isDeleting } = useDeleteSalesOrder();
  const so = row.original;

  const handleDelete = () => {
    deleteSO(so.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/sales-orders/${so.id}`)),
      tooltip: 'View Details',
    },
  ];

  if (so.status === 'approved' || so.status === 'partially_shipped') {
    primaryActions.push({
      label: 'Ship',
      icon: <Truck className="h-4 w-4" />,
      onClick: () => onFulfill(so),
      tooltip: 'Ship Items',
    });
  }

  if (so.status === 'draft') {
    primaryActions.push({
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/sales-orders/${so.id}/edit`)),
      tooltip: 'Edit Sales Order',
    });

    primaryActions.push({
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete Sales Order',
    });
  }

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Sales Order"
        description={`Are you sure you want to delete ${so.documentNumber}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
}
