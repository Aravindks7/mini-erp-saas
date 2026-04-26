import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { formatDate } from '@shared/utils/date';
import type { InventoryLevelResponse } from '../../api/inventory.api';
import { InventoryLevelRowActions } from './InventoryLevelRowActions';

export const columns: ColumnDef<InventoryLevelResponse>[] = [
  {
    accessorKey: 'product.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{row.original.product.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.product.sku}</span>
      </div>
    ),
    meta: { variant: 'title', label: 'Product' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'warehouse.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Warehouse" />,
    meta: { variant: 'field', label: 'Warehouse' },
  },
  {
    accessorKey: 'bin.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bin" />,
    cell: ({ row }) => row.original.bin?.name || '-',
    meta: { variant: 'field', label: 'Bin' },
  },
  {
    accessorKey: 'quantityOnHand',
    header: ({ column }) => <DataTableColumnHeader column={column} title="On Hand" />,
    cell: ({ row }) => (
      <span className="font-mono font-bold text-primary">
        {Number(row.original.quantityOnHand).toLocaleString()}
      </span>
    ),
    meta: { variant: 'field', label: 'Quantity' },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }) => formatDate(row.getValue('updatedAt')),
    meta: { variant: 'field', label: 'Last Updated' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <InventoryLevelRowActions row={row} />,
    meta: { variant: 'actions' },
  },
];
