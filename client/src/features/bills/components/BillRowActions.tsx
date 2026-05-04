import { Eye, FileEdit, Trash2, DollarSign, Ban, Send } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Row } from '@tanstack/react-table';

import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTenantPath } from '@/hooks/useTenantPath';
import { useDeleteBill } from '../hooks/bills.hooks';
import type { BillResponse } from '../api/bills.api';

interface BillRowActionsProps {
  row: Row<BillResponse>;
  onPayBill?: (bill: BillResponse) => void;
}

export function BillRowActions({ row, onPayBill }: BillRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteBill } = useDeleteBill();

  const bill = row.original;
  const isDraft = bill.status === 'draft';
  const actionLabel = isDraft ? 'Delete' : 'Void';

  const handleDelete = () => {
    deleteBill(bill.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const actions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/bills/${bill.id}`)),
      tooltip: 'View Details',
    },
  ];

  if (isDraft) {
    actions.push(
      {
        label: 'Edit',
        icon: <FileEdit className="h-4 w-4" />,
        onClick: () => navigate(getPath(`/bills/${bill.id}/edit`)),
        tooltip: 'Edit Bill',
      },
      {
        label: 'Post Bill',
        icon: <Send className="h-4 w-4" />,
        onClick: () => {}, // TODO: Implement post logic
        tooltip: 'Post to Ledger',
      },
    );
  }

  if (onPayBill && bill.status === 'open') {
    actions.push({
      label: 'Pay Bill',
      icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
      onClick: () => onPayBill(bill),
      tooltip: 'Pay Bill',
    });
  }

  if (bill.status !== 'void' && bill.status !== 'paid') {
    actions.push({
      label: actionLabel,
      icon: isDraft ? <Trash2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: `${actionLabel} Bill`,
    });
  }

  return (
    <>
      <DataTableRowActions primaryActions={actions} />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`${actionLabel} Bill`}
        description={
          isDraft
            ? `Are you sure you want to delete bill ${bill.referenceNumber}? This action cannot be undone.`
            : `Are you sure you want to void bill ${bill.referenceNumber}? This action will reverse any ledger entries and mark the bill as void. This cannot be undone.`
        }
        confirmLabel={`${actionLabel} Bill`}
        variant={isDraft ? 'destructive' : 'default'}
      />
    </>
  );
}
