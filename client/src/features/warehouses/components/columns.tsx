import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';

import type { WarehouseResponse } from '../api/warehouses.api';
import { WarehouseRowActions } from './WarehouseRowActions';

export const columns: ColumnDef<WarehouseResponse>[] = [
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
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
    meta: { variant: 'title', label: 'Code' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    meta: { variant: 'subtitle', label: 'Name' },
    enableGlobalFilter: true,
  },
  {
    id: 'address',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Address" />,
    cell: ({ row }) => {
      const primaryAddress =
        row.original.addresses?.find((a) => a.isPrimary) || row.original.addresses?.[0];
      if (!primaryAddress) return '-';
      const parts = [
        primaryAddress.addressLine1,
        primaryAddress.addressLine2,
        primaryAddress.city,
        primaryAddress.state,
        primaryAddress.postalCode,
        primaryAddress.country,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : '-';
    },
    meta: { variant: 'field', label: 'Address' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <WarehouseRowActions row={row} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
