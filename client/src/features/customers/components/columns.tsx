import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

import type { CustomerResponse } from '../api/customers.api';
import { CustomerRowActions } from './CustomerRowActions';

import { getStatusOptions } from '@/lib/status-registry';

export const customerStatusOptions = getStatusOptions('customer');

export const columns: ColumnDef<CustomerResponse>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableGlobalFilter: false,
  },
  {
    accessorKey: 'companyName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company Name" />,
    meta: { variant: 'title', label: 'Company' },
    enableGlobalFilter: true,
  },
  {
    id: 'contactPerson',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact Person" />,
    accessorFn: (row) => {
      const primaryContact = row.contacts?.find((c) => c.isPrimary) || row.contacts?.[0];
      return primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : '';
    },
    cell: ({ row }) => {
      const primaryContact =
        row.original.contacts?.find((c) => c.isPrimary) || row.original.contacts?.[0];
      return primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : '-';
    },
    meta: { variant: 'field', label: 'Contact Person' },
    enableGlobalFilter: true,
  },
  {
    id: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    accessorFn: (row) => {
      const primaryContact = row.contacts?.find((c) => c.isPrimary) || row.contacts?.[0];
      return primaryContact?.email || '';
    },
    cell: ({ row }) => {
      const primaryContact =
        row.original.contacts?.find((c) => c.isPrimary) || row.original.contacts?.[0];
      return primaryContact?.email || '-';
    },
    meta: { variant: 'field', label: 'Email' },
    enableGlobalFilter: true,
  },
  {
    id: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    accessorFn: (row) => {
      const primaryContact = row.contacts?.find((c) => c.isPrimary) || row.contacts?.[0];
      return primaryContact?.phone || '';
    },
    cell: ({ row }) => {
      const primaryContact =
        row.original.contacts?.find((c) => c.isPrimary) || row.original.contacts?.[0];
      return primaryContact?.phone || '-';
    },
    meta: { variant: 'field', label: 'Phone' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id) as string;
      const selectedValues = typeof value === 'string' ? value.split(',') : value;
      return Array.isArray(selectedValues) ? selectedValues.includes(rowValue) : false;
    },
    cell: ({ row }) => {
      return <StatusBadge value={row.getValue('status') as string} entityType="customer" />;
    },

    meta: { variant: 'field', label: 'Status' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CustomerRowActions row={row} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
