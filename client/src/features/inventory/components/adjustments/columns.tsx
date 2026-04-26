import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { InventoryAdjustmentResponse } from '../../api/inventory.api';
import { AdjustmentRowActions } from './AdjustmentRowActions';

const adjustmentStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const adjustmentStatusOptions = Object.entries(adjustmentStatusMap).map(
  ([value, config]) => ({
    label: config.label,
    value,
  }),
);

export const columns: ColumnDef<InventoryAdjustmentResponse>[] = [
  {
    accessorKey: 'reference',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
    meta: { variant: 'title', label: 'Reference' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'reason',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reason" />,
    meta: { variant: 'subtitle', label: 'Reason' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      return (
        <StatusBadge value={row.getValue('status') as string} statusMap={adjustmentStatusMap} />
      );
    },
    meta: { variant: 'field', label: 'Status' },
  },
  {
    accessorKey: 'adjustmentDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Adjustment Date" />,
    cell: ({ row }) => formatDate(row.getValue('adjustmentDate')),
    meta: { variant: 'field', label: 'Date' },
  },
  {
    accessorKey: 'lines',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lines" />,
    cell: ({ row }) => (row.original.lines?.length || 0).toString(),
    meta: { variant: 'field', label: 'Lines' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <AdjustmentRowActions row={row} />,
    meta: { variant: 'actions' },
  },
];
