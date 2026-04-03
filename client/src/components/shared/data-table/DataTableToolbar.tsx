'use no memo';

import type { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
}

export function DataTableToolbar<TData>({ table, searchKey }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && (
          <Input
            placeholder="Search..."
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Container for future bulk actions */}
      <div className="flex items-center space-x-2">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex items-center space-x-2">
            {/* Dynamic bulk actions would go here */}
          </div>
        )}
      </div>
    </div>
  );
}
