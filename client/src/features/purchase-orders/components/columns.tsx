import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { PurchaseOrderResponse } from '../api/purchase-orders.api';
import { PurchaseOrderRowActions } from './PurchaseOrderRowActions';

export const purchaseOrderStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'info' },
  partially_received: { label: 'Partial', tone: 'warning' },
  received: { label: 'Received', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const purchaseOrderStatusOptions = Object.entries(purchaseOrderStatusMap).map(
  ([value, config]) => ({
    label: config.label,
    value,
  }),
);

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

interface GetColumnsProps {
  onReceive: (po: PurchaseOrderResponse) => void;
}

export const getColumns = ({ onReceive }: GetColumnsProps): ColumnDef<PurchaseOrderResponse>[] => [
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
    accessorKey: 'documentNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="PO Number" />,
    meta: { variant: 'title', label: 'PO Number' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order Date" />,
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
    meta: { variant: 'field', label: 'Order Date' },
  },
  {
    accessorKey: 'supplier.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
    cell: ({ row }) => row.original.supplier.name,
    meta: { variant: 'subtitle', label: 'Supplier' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Amount" />,
    cell: ({ row }) => currencyFormatter.format(Number(row.getValue('totalAmount'))),
    meta: { variant: 'field', label: 'Total' },
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
      return (
        <StatusBadge value={row.getValue('status') as string} statusMap={purchaseOrderStatusMap} />
      );
    },
    meta: { variant: 'field', label: 'Status' },
  },

  {
    id: 'actions',
    cell: ({ row }) => <PurchaseOrderRowActions row={row} onReceive={onReceive} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
