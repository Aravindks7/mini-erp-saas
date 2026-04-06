import { MoreHorizontal, FileEdit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';

import type { CustomerResponse } from '../api/customers.api';
import { useDeleteCustomer } from '../hooks/customers.hooks';

interface CustomerRowActionsProps {
  row: { original: CustomerResponse };
}

export function CustomerRowActions({ row }: CustomerRowActionsProps) {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteCustomer, status: deleteStatus } = useDeleteCustomer();
  const customer = row.original;

  const handleDelete = () => {
    deleteCustomer(customer.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}`)}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}/edit`)}>
            <FileEdit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
