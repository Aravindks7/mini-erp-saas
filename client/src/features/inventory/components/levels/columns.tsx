import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';

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
    accessorKey: 'quantityAllocated',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Allocated" />,
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">
        {Number(row.original.quantityAllocated).toLocaleString()}
      </span>
    ),
    meta: { variant: 'field', label: 'Allocated' },
  },
  {
    id: 'available',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Available" />,
    cell: ({ row }) => {
      const onHand = Number(row.original.quantityOnHand);
      const allocated = Number(row.original.quantityAllocated);
      const available = onHand - allocated;
      return <span className="font-mono font-bold text-success">{available.toLocaleString()}</span>;
    },
    meta: { variant: 'field', label: 'Available' },
  },
  {
    id: 'uom',
    header: ({ column }) => <DataTableColumnHeader column={column} title="UoM" />,
    cell: ({ row }) => row.original.product.baseUom?.code || '-',
    meta: { variant: 'field', label: 'UoM' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <InventoryLevelRowActions row={row} />,
    meta: { variant: 'actions' },
  },
];
