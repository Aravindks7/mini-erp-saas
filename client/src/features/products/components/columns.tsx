import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getStatusOptions } from '@/lib/status-registry';
import type { ProductResponse } from '../api/products.api';
import { ProductRowActions } from './ProductRowActions';
import { useCurrency } from '@/features/currencies/hooks/use-currency';

export const productStatusOptions = getStatusOptions('product');

export function useProductColumns(): ColumnDef<ProductResponse>[] {
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
        accessorKey: 'category',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        cell: ({ row }) => {
          const category = row.original.category;
          return category ? category.name : '-';
        },
        meta: { variant: 'field', label: 'Category' },
      },
      {
        accessorKey: 'basePrice',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
        cell: ({ row }) => {
          const price = parseFloat(row.getValue('basePrice'));
          return formatCurrency(price);
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
          return <StatusBadge value={row.getValue('status') as string} entityType="product" />;
        },

        meta: { variant: 'field', label: 'Status' },
      },
      {
        id: 'actions',
        cell: ({ row }) => <ProductRowActions row={row} />,
        meta: { variant: 'actions' },
        enableGlobalFilter: false,
      },
    ],
    [formatCurrency],
  );
}
