import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { formatDate } from '@shared/utils/date';
import { Badge } from '@/components/ui/badge';
import type { UomResponse } from '../api/uoms.api';
import { UomRowActions } from './UomRowActions';

export interface ColumnProps {
  onEdit: (uom: UomResponse) => void;
}

export const getColumns = ({ onEdit }: ColumnProps): ColumnDef<UomResponse>[] => [
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
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => row.getValue('description') || '-',
    meta: { variant: 'field', label: 'Description' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'isDefault',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Default" />,
    cell: ({ row }) => {
      const isDefault = row.getValue('isDefault') as boolean;
      return isDefault ? (
        <Badge variant="outline" className="border-primary text-primary">
          Default
        </Badge>
      ) : (
        '-'
      );
    },
    meta: { variant: 'field', label: 'Default' },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
    meta: { variant: 'field', label: 'Created' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <UomRowActions row={row} onEdit={onEdit} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
