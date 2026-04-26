import { FileEdit, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { UomResponse } from '../api/uoms.api';
import { useDeleteUom } from '../hooks/uoms.hooks';

interface UomRowActionsProps {
  row: { original: UomResponse };
  onEdit: (uom: UomResponse) => void;
}

export function UomRowActions({ row, onEdit }: UomRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteUom, status: deleteStatus } = useDeleteUom();
  const uom = row.original;

  const handleDelete = () => {
    deleteUom(uom.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => onEdit(uom),
      tooltip: 'Edit UoM',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete UoM',
    },
  ];

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Unit of Measure"
        description={`Are you sure you want to delete ${uom.name} (${uom.code})? This action cannot be undone.`}
        isLoading={deleteStatus === 'pending'}
      />
    </>
  );
}
