import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';

import { formatDate } from '@shared/utils/date';
import type { BillResponse } from '../api/bills.api';
import { BillRowActions } from './BillRowActions';
import { useCurrency } from '@/features/currencies/hooks/use-currency';

import { getStatusOptions } from '@/lib/status-registry';

export const billStatusOptions = getStatusOptions('bill');

interface GetColumnsProps {
  onPayBill?: (bill: BillResponse) => void;
}

export function useBillColumns({ onPayBill }: GetColumnsProps = {}): ColumnDef<BillResponse>[] {
  const { format: formatCurrency } = useCurrency();

  return React.useMemo(
    () => [
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
        cell: ({ row }) => formatCurrency(Number(row.getValue('totalAmount'))),
        meta: { variant: 'field', label: 'Total Amount' },
      },
      {
        accessorKey: 'balanceDue',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Balance Due" />,
        cell: ({ row }) => {
          const balance = Number(row.getValue('balanceDue'));
          return (
            <span className={balance > 0 ? 'text-destructive font-medium' : ''}>
              {formatCurrency(balance)}
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
          return <StatusBadge value={row.getValue('status') as string} entityType="bill" />;
        },

        meta: { variant: 'field', label: 'Status' },
      },
      {
        id: 'actions',
        cell: ({ row }) => <BillRowActions row={row} onPayBill={onPayBill} />,
        meta: { variant: 'actions' },
        enableGlobalFilter: false,
      },
    ],
    [onPayBill, formatCurrency],
  );
}
