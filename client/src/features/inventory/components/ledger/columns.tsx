import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { formatDate } from '@shared/utils/date';
import type { InventoryLedgerResponse } from '../../api/inventory.api';
import { Badge } from '@/components/ui/badge';

const referenceTypeMap: Record<string, string> = {
  po_receipt: 'PO Receipt',
  so_shipment: 'SO Shipment',
  adjustment: 'Adjustment',
  transfer: 'Transfer',
  stock_count: 'Stock Count',
};

export const columns: ColumnDef<InventoryLedgerResponse>[] = [
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date & Time" />,
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
    meta: { variant: 'field', label: 'Date' },
  },
  {
    accessorKey: 'product.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.product.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.product.sku}</span>
      </div>
    ),
    meta: { variant: 'title', label: 'Product' },
  },
  {
    accessorKey: 'warehouse.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Warehouse" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.warehouse.name}</span>
        {row.original.bin && (
          <span className="text-xs text-muted-foreground">Bin: {row.original.bin.name}</span>
        )}
      </div>
    ),
    meta: { variant: 'field', label: 'Location' },
  },
  {
    accessorKey: 'referenceType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
    cell: ({ row }) => (
      <Badge variant="outline">
        {referenceTypeMap[row.original.referenceType] || row.original.referenceType}
      </Badge>
    ),
    meta: { variant: 'field', label: 'Ref Type' },
  },
  {
    accessorKey: 'quantityChange',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Change" />,
    cell: ({ row }) => {
      const val = Number(row.original.quantityChange);
      return (
        <span className={val > 0 ? 'text-success font-bold' : 'text-destructive font-bold'}>
          {val > 0 ? `+${val}` : val}
        </span>
      );
    },
    meta: { variant: 'field', label: 'Change' },
  },
];
