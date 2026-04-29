import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { InvoiceResponse } from '../api/invoices.api';
import { InvoiceRowActions } from './InvoiceRowActions';

export const invoiceStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  open: { label: 'Open', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
  void: { label: 'Void', tone: 'danger' },
};

export const invoiceStatusOptions = Object.entries(invoiceStatusMap).map(([value, config]) => ({
  label: config.label,
  value,
}));

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const columns: ColumnDef<InvoiceResponse>[] = [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
    meta: { variant: 'title', label: 'Invoice' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'customer.companyName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => row.original.customer.companyName,
    meta: { variant: 'subtitle', label: 'Customer' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
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
      return <StatusBadge value={row.getValue('status') as string} statusMap={invoiceStatusMap} />;
    },
    meta: { variant: 'field', label: 'Status' },
  },
  {
    accessorKey: 'issueDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Issue Date" />,
    cell: ({ row }) => formatDate(row.getValue('issueDate')),
    meta: { variant: 'field', label: 'Issue Date' },
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
    cell: ({ row }) => formatDate(row.getValue('dueDate')),
    meta: { variant: 'field', label: 'Due Date' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <InvoiceRowActions row={row} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
