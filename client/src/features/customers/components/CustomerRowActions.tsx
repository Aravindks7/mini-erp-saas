import { FileEdit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { CustomerResponse } from '../api/customers.api';
import { useDeleteCustomer } from '../hooks/customers.hooks';
import { useTenantPath } from '@/hooks/useTenantPath';

interface CustomerRowActionsProps {
  row: { original: CustomerResponse };
}

export function CustomerRowActions({ row }: CustomerRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteCustomer, status: deleteStatus } = useDeleteCustomer();
  const customer = row.original;

  const handleDelete = () => {
    deleteCustomer(customer.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/customers/${customer.id}`)),
      tooltip: 'View Details',
    },
    {
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/customers/${customer.id}/edit`)),
      tooltip: 'Edit Customer',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete Customer',
    },
  ];

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customer.companyName}? This action cannot be undone and will remove all associated contact and address data.`}
        isLoading={deleteStatus === 'pending'}
      />
    </>
  );
}
