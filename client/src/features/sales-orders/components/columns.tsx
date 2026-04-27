import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { SalesOrderResponse } from '../api/sales-orders.api';
import { SalesOrderRowActions } from './SalesOrderRowActions';

export const salesOrderStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'info' },
  shipped: { label: 'Shipped', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const salesOrderStatusOptions = Object.entries(salesOrderStatusMap).map(
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
  onFulfill: (so: SalesOrderResponse) => void;
}

export const getColumns = ({ onFulfill }: GetColumnsProps): ColumnDef<SalesOrderResponse>[] => [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Document #" />,
    meta: { variant: 'title', label: 'Document' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'customer.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => row.original.customer.name,
    meta: { variant: 'subtitle', label: 'Customer' },
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
        <StatusBadge value={row.getValue('status') as string} statusMap={salesOrderStatusMap} />
      );
    },
    meta: { variant: 'field', label: 'Status' },
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
    cell: ({ row }) => <SalesOrderRowActions row={row} onFulfill={onFulfill} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
