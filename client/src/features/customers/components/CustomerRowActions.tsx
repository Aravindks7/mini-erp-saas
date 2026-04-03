import { MoreHorizontal, FileEdit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { CustomerResponse } from '../api/customers';
import { useDeleteCustomer } from '../api/customers';

interface CustomerRowActionsProps {
  row: { original: CustomerResponse };
}

export function CustomerRowActions({ row }: CustomerRowActionsProps) {
  const navigate = useNavigate();
  const { mutate: deleteCustomer } = useDeleteCustomer();
  const customer = row.original;

  return (
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
          className="text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this customer?')) {
              deleteCustomer(customer.id);
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
