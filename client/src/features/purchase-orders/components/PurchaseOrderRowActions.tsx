import { FileEdit, Eye, Package, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';
import { useTenantPath } from '@/hooks/useTenantPath';
import type { PurchaseOrderResponse } from '../api/purchase-orders.api';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import { useDeletePurchaseOrder } from '../hooks/purchase-orders.hooks';

interface PurchaseOrderRowActionsProps {
  row: { original: PurchaseOrderResponse };
  onReceive: (po: PurchaseOrderResponse) => void;
}

export function PurchaseOrderRowActions({ row, onReceive }: PurchaseOrderRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deletePO, isPending: isDeleting } = useDeletePurchaseOrder();
  const po = row.original;

  const handleDelete = () => {
    deletePO(po.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/purchase-orders/${po.id}`)),
      tooltip: 'View Details',
    },
  ];

  if (po.status === 'draft' || po.status === 'sent' || po.status === 'partially_received') {
    primaryActions.push({
      label: 'Receive',
      icon: <Package className="h-4 w-4" />,
      onClick: () => onReceive(po),
      tooltip: 'Receive Items',
    });
  }

  if (po.status === 'draft') {
    primaryActions.push({
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/purchase-orders/${po.id}/edit`)),
      tooltip: 'Edit Purchase Order',
    });

    primaryActions.push({
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete Purchase Order',
    });
  }

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Purchase Order"
        description={`Are you sure you want to delete ${po.documentNumber}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
}
