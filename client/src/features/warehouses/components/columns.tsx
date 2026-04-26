import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { formatDate } from '@shared/utils/date';
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
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => {
      return formatDate(row.getValue('createdAt'));
    },
    meta: { variant: 'field', label: 'Created' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <WarehouseRowActions row={row} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
