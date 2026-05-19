import { FileEdit, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { CurrencyResponse } from '@shared/contracts/currencies.contract';
import { useDeleteCurrency } from '../hooks/currencies.hooks';

interface CurrencyRowActionsProps {
  row: { original: CurrencyResponse };
  onEdit: (currency: CurrencyResponse) => void;
}

export function CurrencyRowActions({ row, onEdit }: CurrencyRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteCurrency, status: deleteStatus } = useDeleteCurrency();
  const currency = row.original;

  const handleDelete = () => {
    deleteCurrency(currency.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => onEdit(currency),
      tooltip: 'Edit Currency',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete Currency',
    },
  ];

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Currency"
        description={`Are you sure you want to delete ${currency.name} (${currency.code})? This action cannot be undone.`}
        isLoading={deleteStatus === 'pending'}
      />
    </>
  );
}
