import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { format } from 'date-fns';

import type { JournalEntryResponse } from '../api/journal-entries.api';
import { JournalEntryRowActions } from './JournalEntryRowActions';

const journalStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  posted: { label: 'Posted', tone: 'success' },
  void: { label: 'Voided', tone: 'danger' },
};

export const columns: ColumnDef<JournalEntryResponse>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => format(new Date(row.original.date), 'dd/MM/yyyy'),
    meta: { variant: 'title', label: 'Date' },
  },
  {
    accessorKey: 'reference',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
    meta: { variant: 'field', label: 'Reference' },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    meta: { variant: 'field', label: 'Description' },
  },
  {
    id: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const totalDebit =
        row.original.lines?.reduce((sum, line) => sum + Number(line.debit), 0) || 0;
      return (
        <span className="font-mono font-bold">
          {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      );
    },
    meta: { variant: 'field', label: 'Total Amount' },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      return <StatusBadge value={row.getValue('status') as string} statusMap={journalStatusMap} />;
    },
    meta: { variant: 'field', label: 'Status' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <JournalEntryRowActions row={row} />,
    meta: { variant: 'actions' },
  },
];
