import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';

import type { ProductCategoryResponse } from '../api/product-categories.api';
import { CategoryRowActions } from './CategoryRowActions';

export interface ProductCategoryWithParent extends ProductCategoryResponse {
  parentName?: string | null;
}

export const getColumns = ({
  onEdit,
}: {
  onEdit: (category: ProductCategoryResponse) => void;
}): ColumnDef<ProductCategoryWithParent>[] => [
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
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
    meta: { variant: 'subtitle', label: 'Code' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'parentName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Parent Category" />,
    cell: ({ row }) => row.getValue('parentName') || '-',
    meta: { variant: 'field', label: 'Parent' },
    enableGlobalFilter: true,
  },

  {
    id: 'actions',
    cell: ({ row }) => <CategoryRowActions row={row} onEdit={onEdit} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
