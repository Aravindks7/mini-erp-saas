'use no memo';

import * as React from 'react';
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table,
  OnChangeFn,
  PaginationState,
  TableState,
} from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DataTable, type BulkAction } from './DataTable';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTableSearch } from './DataTableSearch';

/**
 * Standard action configuration for EntityTable rows.
 */
export interface EntityActionConfig<TData> {
  onView?: (data: TData) => void;
  onEdit?: (data: TData) => void;
  onDelete?: (data: TData) => void;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
}

interface EntityTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  isLoading?: boolean;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (view: 'list' | 'grid') => void;
  onAddClick?: () => void;
  /** High-level action configuration for standard ERP operations */
  actions?: EntityActionConfig<TData>;
  /** Escape hatch for custom row actions or additional menu items */
  renderRowActions?: (data: TData) => React.ReactNode;
  /** Global table actions (e.g., Add New, Export) */
  headerActions?: React.ReactNode;
  /** Custom content to inject into the toolbar (e.g., specialized filters) */
  toolbarContent?: (table: Table<TData>) => React.ReactNode;
  /** Actions that can be performed on multiple selected rows */
  bulkActions?: BulkAction<TData>[];
  /** Callback for when the table state is reset */
  onReset?: () => void;
  /** External state override for controlled tables (e.g., URL-synced) */
  state?: Partial<TableState>;
  /** External state setters for controlled tables */
  onStateChange?: {
    onPaginationChange?: OnChangeFn<PaginationState>;
    onSortingChange?: OnChangeFn<SortingState>;
    onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  };
  title?: string;
  description?: string;
  emptyState?: {
    title?: string;
    description?: string;
  };
}

/**
 * EntityTable Component
 * A high-leverage "Smart Component" that wraps DataTable with standardized ERP features.
 * Implements a hybrid action system (Config-driven + Escape hatch).
 */
export function EntityTable<TData, TValue>({
  columns,
  data,
  searchKey,
  isLoading,
  viewMode,
  onViewModeChange,
  onAddClick,
  actions,
  renderRowActions,
  headerActions,
  toolbarContent,
  bulkActions,
  onReset,
  state: externalState,
  onStateChange,
  title,
  description,
  emptyState,
}: EntityTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Memoize augmented columns to include the global Actions column
  const augmentedColumns = React.useMemo(() => {
    const hasActions = !!actions || !!renderRowActions;

    if (!hasActions) return columns;

    const actionColumn: ColumnDef<TData, unknown> = {
      id: 'actions',
      enableHiding: false,
      meta: {
        variant: 'actions',
      },
      cell: ({ row }) => {
        const entity = row.original;
        const rowActions = renderRowActions?.(entity);

        // Determine if we have any actions to show
        const hasStandardActions = !!(actions?.onView || actions?.onEdit || actions?.onDelete);
        const hasCustomActions = !!rowActions;

        if (!hasStandardActions && !hasCustomActions) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {actions?.onView && (
                <DropdownMenuItem onClick={() => actions.onView?.(entity)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {actions.viewLabel || 'View'}
                </DropdownMenuItem>
              )}

              {actions?.onEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit?.(entity)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {actions.editLabel || 'Edit'}
                </DropdownMenuItem>
              )}

              {rowActions}

              {actions?.onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => actions.onDelete?.(entity)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {actions.deleteLabel || 'Delete'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    };

    return [...columns, actionColumn];
  }, [columns, actions, renderRowActions]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: augmentedColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      ...externalState,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: onStateChange?.onSortingChange || setSorting,
    onColumnFiltersChange: onStateChange?.onColumnFiltersChange || setColumnFilters,
    onColumnVisibilityChange: onStateChange?.onColumnVisibilityChange || setColumnVisibility,
    onPaginationChange: onStateChange?.onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    autoResetPageIndex: externalState?.pagination ? false : undefined,
  });

  return (
    <div className="space-y-4">
      {(title || description || headerActions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
          <div>
            {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          <div className="flex items-center gap-2">{headerActions}</div>
        </div>
      )}

      <DataTable
        table={table}
        isLoading={isLoading}
        emptyState={emptyState}
        viewMode={viewMode}
        onAddClick={onAddClick}
      >
        <DataTableToolbar
          table={table}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          bulkActions={bulkActions}
          onReset={onReset}
        >
          {toolbarContent?.(table)}
          {searchKey && !toolbarContent && (
            <DataTableSearch
              searchKey={searchKey}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(value) => table.getColumn(searchKey)?.setFilterValue(value)}
            />
          )}
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
