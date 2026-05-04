import { FileEdit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { AccountResponse } from '../api/accounts.api';
import { useDeleteAccount } from '../hooks/accounts.hooks';
import { useTenantPath } from '@/hooks/useTenantPath';

interface AccountRowActionsProps {
  row: { original: AccountResponse };
  onEdit: (account: AccountResponse) => void;
}

export function AccountRowActions({ row, onEdit }: AccountRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteAccount, status: deleteStatus } = useDeleteAccount();
  const account = row.original;

  const handleDelete = () => {
    deleteAccount(account.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/finance/accounts/${account.id}`)),
      tooltip: 'View Details',
    },
    {
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => onEdit(account),
      tooltip: 'Edit Account',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Delete Account',
      disabled: account.isSystem, // Prevent deleting system accounts
    },
  ];

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Account"
        description={`Are you sure you want to delete account ${account.code} - ${account.name}? This action cannot be undone.`}
        isLoading={deleteStatus === 'pending'}
      />
    </>
  );
}
