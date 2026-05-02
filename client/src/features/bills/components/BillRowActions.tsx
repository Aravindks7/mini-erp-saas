import { Eye, FileEdit, Trash2, DollarSign } from 'lucide-react';
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
    },
    {
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/bills/${bill.id}/edit`)),
      hidden: bill.status === 'paid' || bill.status === 'void',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
    },
  ];

  if (onPayBill && bill.status === 'open') {
    actions.unshift({
      label: 'Pay Bill',
      icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
      onClick: () => onPayBill(bill),
      tooltip: 'Pay Bill',
    });
  }

  return (
    <>
      <DataTableRowActions primaryActions={actions} />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Bill"
        description={`Are you sure you want to delete bill ${bill.referenceNumber}? This action cannot be undone.`}
        confirmLabel="Delete Bill"
        variant="destructive"
      />
    </>
  );
}
