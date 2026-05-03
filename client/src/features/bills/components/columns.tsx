import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { BillResponse } from '../api/bills.api';
import { BillRowActions } from './BillRowActions';

export const billStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  open: { label: 'Open', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  void: { label: 'Void', tone: 'danger' },
};

export const billStatusOptions = Object.entries(billStatusMap).map(([value, config]) => ({
  label: config.label,
  value,
}));

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

interface GetColumnsProps {
  onPayBill?: (bill: BillResponse) => void;
}

export const getColumns = ({ onPayBill }: GetColumnsProps = {}): ColumnDef<BillResponse>[] => [
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
    accessorKey: 'referenceNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bill Number" />,
    meta: { variant: 'title', label: 'Bill Number' },
    enableGlobalFilter: true,
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
    accessorKey: 'supplier.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
    cell: ({ row }) => row.original.supplier?.name || '—',
    meta: { variant: 'subtitle', label: 'Supplier' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Amount" />,
    cell: ({ row }) => currencyFormatter.format(Number(row.getValue('totalAmount'))),
    meta: { variant: 'field', label: 'Total Amount' },
  },
  {
    accessorKey: 'balanceDue',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Balance Due" />,
    cell: ({ row }) => {
      const balance = Number(row.getValue('balanceDue'));
      return (
        <span className={balance > 0 ? 'text-destructive font-medium' : ''}>
          {currencyFormatter.format(balance)}
        </span>
      );
    },
    meta: { variant: 'field', label: 'Balance Due' },
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
      return <StatusBadge value={row.getValue('status') as string} statusMap={billStatusMap} />;
    },
    meta: { variant: 'field', label: 'Status' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <BillRowActions row={row} onPayBill={onPayBill} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
