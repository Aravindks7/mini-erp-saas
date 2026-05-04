import { Eye, Trash2, Ban, FileEdit, PackageSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';
import type { ReceiptResponse } from '../api/receipts.api';
import { useTenantPath } from '@/hooks/useTenantPath';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import { useDeleteReceipt } from '../hooks/receipts.hooks';

interface ReceiptRowActionsProps {
  row: { original: ReceiptResponse };
}

export function ReceiptRowActions({ row }: ReceiptRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteReceipt, isPending: isDeleting } = useDeleteReceipt();
  const receipt = row.original;

  const isDraft = receipt.status === 'draft';
  const actionLabel = isDraft ? 'Delete' : 'Cancel';
  const dialogDescription = isDraft
    ? `Are you sure you want to permanently delete draft receipt ${receipt.receiptNumber}?`
    : `Are you sure you want to cancel receipt ${receipt.receiptNumber}? This will reverse the associated inventory movements.`;

  const handleDelete = () => {
    deleteReceipt(receipt.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/receipts/${receipt.id}`)),
      tooltip: 'View Details',
    },
  ];

  if (isDraft) {
    primaryActions.push(
      {
        label: 'Edit',
        icon: <FileEdit className="h-4 w-4" />,
        onClick: () => navigate(getPath(`/receipts/${receipt.id}/edit`)),
        tooltip: 'Edit Receipt',
      },
      {
        label: 'Receive',
        icon: <PackageSearch className="h-4 w-4" />,
        onClick: () => {}, // TODO: Implement receive logic
        tooltip: 'Mark as Received',
      },
    );
  }

  if (receipt.status !== 'cancelled') {
    primaryActions.push({
      label: actionLabel,
      icon: isDraft ? <Trash2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: `${actionLabel} Receipt`,
    });
  }

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`${actionLabel} Receipt`}
        description={dialogDescription}
        confirmLabel={actionLabel}
        isLoading={isDeleting}
        variant={isDraft ? 'destructive' : 'default'}
      />
    </>
  );
}
