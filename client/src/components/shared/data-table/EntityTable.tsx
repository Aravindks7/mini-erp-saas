import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
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
import { DataTable } from './DataTable';

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
  /** High-level action configuration for standard ERP operations */
  actions?: EntityActionConfig<TData>;
  /** Escape hatch for custom row actions or additional menu items */
  renderRowActions?: (data: TData) => React.ReactNode;
  /** Global table actions (e.g., Add New, Export) */
  headerActions?: React.ReactNode;
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
  actions,
  renderRowActions,
  headerActions,
  title,
  description,
  emptyState,
}: EntityTableProps<TData, TValue>) {
  // Memoize augmented columns to include the global Actions column
  const augmentedColumns = React.useMemo(() => {
    const hasActions = !!actions || !!renderRowActions;

    if (!hasActions) return columns;

    const actionColumn: ColumnDef<TData, any> = {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const entity = row.original;

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

              {renderRowActions?.(entity)}

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
        columns={augmentedColumns}
        data={data}
        searchKey={searchKey}
        isLoading={isLoading}
        emptyState={emptyState}
      />
    </div>
  );
}
