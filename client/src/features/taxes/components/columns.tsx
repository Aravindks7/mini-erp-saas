import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';

import type { TaxResponse } from '../api/taxes.api';
import { TaxRowActions } from './TaxRowActions';

export interface ColumnProps {
  onEdit: (tax: TaxResponse) => void;
}

export const getColumns = ({ onEdit }: ColumnProps): ColumnDef<TaxResponse>[] => [
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
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    meta: { variant: 'title', label: 'Name' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'rate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rate (%)" />,
    cell: ({ row }) => `${row.getValue('rate')}%`,
    meta: { variant: 'subtitle', label: 'Rate' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => row.getValue('description') || '-',
    meta: { variant: 'field', label: 'Description' },
    enableGlobalFilter: true,
  },

  {
    id: 'actions',
    cell: ({ row }) => <TaxRowActions row={row} onEdit={onEdit} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
