import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { PaymentResponse } from '../api/payments.api';
import { PaymentRowActions } from './PaymentRowActions';

const paymentStatusMap: StatusMap<string> = {
  pending: { label: 'Pending', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

const paymentTypeMap: StatusMap<string> = {
  inbound: { label: 'Inbound', tone: 'success' },
  outbound: { label: 'Outbound', tone: 'neutral' },
};

export const paymentStatusOptions = Object.entries(paymentStatusMap).map(([value, config]) => ({
  label: config.label,
  value,
}));

export const paymentTypeOptions = Object.entries(paymentTypeMap).map(([value, config]) => ({
  label: config.label,
  value,
}));

export const columns: ColumnDef<PaymentResponse>[] = [
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
    accessorKey: 'paymentDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => formatDate(row.getValue('paymentDate')),
    meta: { variant: 'title', label: 'Date' },
  },
  {
    accessorKey: 'paymentType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <StatusBadge value={row.getValue('paymentType') as string} statusMap={paymentTypeMap} />
    ),
    meta: { variant: 'field', label: 'Type' },
  },
  {
    id: 'entity',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Payee/Payer" />,
    cell: ({ row }) => {
      const payment = row.original;
      return payment.customer?.companyName || payment.supplier?.name || '-';
    },
    meta: { variant: 'subtitle', label: 'Entity' },
  },
  {
    id: 'document',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
    cell: ({ row }) => {
      const payment = row.original;
      return payment.invoice?.documentNumber || payment.bill?.documentNumber || '-';
    },
    meta: { variant: 'field', label: 'Document' },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const amount = Number(row.getValue('amount'));
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    },
    meta: { variant: 'title', label: 'Amount' },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      return <StatusBadge value={row.getValue('status') as string} statusMap={paymentStatusMap} />;
    },
    meta: { variant: 'field', label: 'Status' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <PaymentRowActions row={row} />,
    meta: { variant: 'actions' },
  },
];
