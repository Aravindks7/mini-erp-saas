import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { ReceiptResponse } from '../api/receipts.api';
import { ReceiptRowActions } from './ReceiptRowActions';
import { Checkbox } from '@/components/ui/checkbox';

const receiptStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  received: { label: 'Received', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const receiptStatusOptions = Object.entries(receiptStatusMap).map(([value, config]) => ({
  label: config.label,
  value,
}));

export const columns: ColumnDef<ReceiptResponse>[] = [
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
    accessorKey: 'receiptNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Receipt #" />,
    meta: { variant: 'title', label: 'Receipt Number' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'receivedDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Received Date" />,
    cell: ({ row }) => formatDate(row.getValue('receivedDate')),
    meta: { variant: 'subtitle', label: 'Received Date' },
  },
  {
    accessorKey: 'reference',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
    cell: ({ row }) => row.getValue('reference') || '-',
    meta: { variant: 'field', label: 'Reference' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'purchaseOrder.documentNumber',
    id: 'purchaseOrderNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="PO #" />,
    cell: ({ row }) => row.original.purchaseOrder?.documentNumber || '-',
    meta: { variant: 'field', label: 'PO Number' },
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
      return <StatusBadge value={row.getValue('status') as string} statusMap={receiptStatusMap} />;
    },
    meta: { variant: 'field', label: 'Status' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ReceiptRowActions row={row} />,
    meta: { variant: 'actions' },
  },
];
