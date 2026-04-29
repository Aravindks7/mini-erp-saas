import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { ShipmentResponse } from '../api/shipments.api';
import { ShipmentRowActions } from './ShipmentRowActions';
import { Checkbox } from '@/components/ui/checkbox';

const shipmentStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  shipped: { label: 'Shipped', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const shipmentStatusOptions = Object.entries(shipmentStatusMap).map(([value, config]) => ({
  label: config.label,
  value,
}));

export const columns: ColumnDef<ShipmentResponse>[] = [
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
    accessorKey: 'shipmentNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Shipment #" />,
    meta: { variant: 'title', label: 'Shipment Number' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'shipmentDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Shipment Date" />,
    cell: ({ row }) => formatDate(row.getValue('shipmentDate')),
    meta: { variant: 'subtitle', label: 'Shipment Date' },
  },
  {
    accessorKey: 'reference',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
    cell: ({ row }) => row.getValue('reference') || '-',
    meta: { variant: 'field', label: 'Reference' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'salesOrder.documentNumber',
    id: 'salesOrderNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="SO #" />,
    cell: ({ row }) => row.original.salesOrder?.documentNumber || '-',
    meta: { variant: 'field', label: 'SO Number' },
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
      return <StatusBadge value={row.getValue('status') as string} statusMap={shipmentStatusMap} />;
    },
    meta: { variant: 'field', label: 'Status' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ShipmentRowActions row={row} />,
    meta: { variant: 'actions' },
  },
];
