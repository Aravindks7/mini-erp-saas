import { FileEdit, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { TaxResponse } from '../api/taxes.api';
import { useDeleteTax } from '../hooks/taxes.hooks';

interface TaxRowActionsProps {
  row: { original: TaxResponse };
  onEdit: (tax: TaxResponse) => void;
}

export function TaxRowActions({ row, onEdit }: TaxRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteTax, status: deleteStatus } = useDeleteTax();
  const tax = row.original;

  const handleDelete = () => {
    deleteTax(tax.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => onEdit(tax),
      tooltip: 'Edit Tax',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete Tax',
    },
  ];

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Tax"
        description={`Are you sure you want to delete ${tax.name} (${tax.rate}%)? This action cannot be undone.`}
        isLoading={deleteStatus === 'pending'}
      />
    </>
  );
}
