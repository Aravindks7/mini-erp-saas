import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { InventoryTransferResponse } from '../../api/inventory.api';
import { getStatusOptions } from '@/lib/status-registry';

export const transferStatusOptions = getStatusOptions('inventory_transfer');

import { ReferenceCell } from './ReferenceCell';

export const columns: ColumnDef<InventoryTransferResponse>[] = [
  {
    accessorKey: 'reference',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
    cell: (props) => <ReferenceCell row={props.row} />,
    meta: { variant: 'title', label: 'Reference' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'transferDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => formatDate(row.getValue('transferDate')),
    meta: { variant: 'field', label: 'Date' },
  },
  {
    accessorKey: 'fromWarehouse',
    header: ({ column }) => <DataTableColumnHeader column={column} title="From Warehouse" />,
    cell: ({ row }) => row.original.fromWarehouse.name,
    meta: { variant: 'field', label: 'From Warehouse' },
  },
  {
    accessorKey: 'toWarehouse',
    header: ({ column }) => <DataTableColumnHeader column={column} title="To Warehouse" />,
    cell: ({ row }) => row.original.toWarehouse.name,
    meta: { variant: 'field', label: 'To Warehouse' },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      return (
        <StatusBadge value={row.getValue('status') as string} entityType="inventory_transfer" />
      );
    },
    meta: { variant: 'field', label: 'Status' },
  },
  {
    accessorKey: 'lines',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lines" />,
    cell: ({ row }) => (row.original.lines?.length || 0).toString(),
    meta: { variant: 'field', label: 'Lines' },
  },
];
