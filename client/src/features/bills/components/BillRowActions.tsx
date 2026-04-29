import { Eye, FileEdit, Trash2 } from 'lucide-react';
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
}

export function BillRowActions({ row }: BillRowActionsProps) {
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
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
    },
  ];

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
