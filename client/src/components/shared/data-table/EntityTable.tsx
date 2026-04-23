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
import { cn } from '@/lib/utils';

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
  toolbarFilters?: (table: Table<TData>) => React.ReactNode;
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
  searchPlaceholder?: string;
  enableGlobalSearch?: boolean;
  emptyState?: {
    title?: string;
    description?: string;
  };
  headerVariant?: 'default' | 'primary';
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
  toolbarFilters,
  bulkActions,
  onReset,
  state: externalState,
  onStateChange,
  title,
  description,
  searchPlaceholder,
  enableGlobalSearch,
  emptyState,
  headerVariant = 'default',
}: EntityTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

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
      globalFilter,
      ...externalState,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: onStateChange?.onSortingChange || setSorting,
    onColumnFiltersChange: onStateChange?.onColumnFiltersChange || setColumnFilters,
    onColumnVisibilityChange: onStateChange?.onColumnVisibilityChange || setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
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
        <div
          className={cn(
            'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-1',
            headerVariant === 'primary' ? 'mb-8' : 'mb-0',
          )}
        >
          <div className="space-y-1.5 flex-1 min-w-0">
            {title &&
              (headerVariant === 'primary' ? (
                <h1 className="text-2xl font-bold tracking-tight text-foreground truncate leading-tight lg:text-3xl">
                  {title}
                </h1>
              ) : (
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              ))}
            {description && (
              <p
                className={cn(
                  'text-muted-foreground',
                  headerVariant === 'primary'
                    ? 'text-sm leading-relaxed max-w-2xl font-medium'
                    : '',
                )}
              >
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {headerActions}
          </div>
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
          searchKey={enableGlobalSearch ? undefined : searchKey}
          searchNode={
            enableGlobalSearch || searchKey ? (
              <DataTableSearch
                searchKey={searchKey || 'global'}
                value={
                  enableGlobalSearch
                    ? ((table.getState().globalFilter as string) ?? '')
                    : ((table.getColumn(searchKey!)?.getFilterValue() as string) ?? '')
                }
                onChange={(value) =>
                  enableGlobalSearch
                    ? table.setGlobalFilter(value)
                    : table.getColumn(searchKey!)?.setFilterValue(value)
                }
                placeholder={searchPlaceholder}
              />
            ) : undefined
          }
          filterNode={toolbarFilters?.(table)}
        />
      </DataTable>
    </div>
  );
}
