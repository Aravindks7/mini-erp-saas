import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import type { ProductResponse } from '../api/products.api';
import { ProductRowActions } from './ProductRowActions';

const productStatusMap: StatusMap<string> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
};

export const productStatusOptions = Object.entries(productStatusMap).map(([value, config]) => ({
  label: config.label,
  value,
}));

export const columns: ColumnDef<ProductResponse>[] = [
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
    accessorKey: 'sku',
    header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
    meta: { variant: 'title', label: 'SKU' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product Name" />,
    meta: { variant: 'subtitle', label: 'Name' },
    enableGlobalFilter: true,
  },
  {
    accessorKey: 'basePrice',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('basePrice'));
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    },
    meta: { variant: 'field', label: 'Price' },
  },
  {
    accessorKey: 'baseUom',
    header: ({ column }) => <DataTableColumnHeader column={column} title="UoM" />,
    cell: ({ row }) => {
      const uom = row.original.baseUom;
      return uom ? `${uom.name} (${uom.code})` : '-';
    },
    meta: { variant: 'field', label: 'UoM' },
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
      return <StatusBadge value={row.getValue('status') as string} statusMap={productStatusMap} />;
    },
    meta: { variant: 'field', label: 'Status' },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => {
      return formatDate(row.getValue('createdAt'));
    },
    meta: { variant: 'field', label: 'Created' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ProductRowActions row={row} />,
    meta: { variant: 'actions' },
    enableGlobalFilter: false,
  },
];
