import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import type { CurrencyResponse } from '@shared/contracts/currencies.contract';
import { CurrencyRowActions } from './CurrencyRowActions';

export interface ColumnProps {
  onEdit: (currency: CurrencyResponse) => void;
}

export const getColumns = ({ onEdit }: ColumnProps): ColumnDef<CurrencyResponse>[] => [
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
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
    meta: { variant: 'title', label: 'Code' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    meta: { variant: 'subtitle', label: 'Name' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'symbol',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Symbol" />,
    meta: { variant: 'field', label: 'Symbol' },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean;
      return <StatusBadge value={isActive ? 'active' : 'inactive'} entityType="currency" />;
    },
    meta: { variant: 'field', label: 'Status' },
  },

  {
    accessorKey: 'isDefault',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Default" />,
    cell: ({ row }) => {
      const isDefault = row.getValue('isDefault') as boolean;
      return isDefault ? <Badge>Default</Badge> : '-';
    },
    meta: { variant: 'field', label: 'Default' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CurrencyRowActions row={row} onEdit={onEdit} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
