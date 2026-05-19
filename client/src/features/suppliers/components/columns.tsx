import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

import type { SupplierResponse } from '../api/suppliers.api';
import { SupplierRowActions } from './SupplierRowActions';

import { getStatusOptions } from '@/lib/status-registry';

export const supplierStatusOptions = getStatusOptions('supplier');

export const columns: ColumnDef<SupplierResponse>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier Name" />,
    meta: { variant: 'title', label: 'Supplier' },
    enableGlobalFilter: true,
  },
  {
    id: 'contactPerson',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact Person" />,
    cell: ({ row }) => {
      const primaryContact =
        row.original.contacts?.find((c) => c.isPrimary) || row.original.contacts?.[0];
      return primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : '-';
    },
    meta: { variant: 'field', label: 'Contact Person' },
  },
  {
    id: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => {
      const primaryContact =
        row.original.contacts?.find((c) => c.isPrimary) || row.original.contacts?.[0];
      return primaryContact?.email || '-';
    },
    meta: { variant: 'field', label: 'Email' },
  },
  {
    id: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => {
      const primaryContact =
        row.original.contacts?.find((c) => c.isPrimary) || row.original.contacts?.[0];
      return primaryContact?.phone || '-';
    },
    meta: { variant: 'field', label: 'Phone' },
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
      return <StatusBadge value={row.getValue('status') as string} entityType="supplier" />;
    },

    meta: { variant: 'field', label: 'Status' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <SupplierRowActions row={row} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
