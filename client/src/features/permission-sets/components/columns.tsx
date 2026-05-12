import type { ColumnDef } from '@tanstack/react-table';
import { KeyRound, Lock } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import type { PermissionSetResponse } from '@shared/contracts/permission-sets.contract';

export const columns: ColumnDef<PermissionSetResponse>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Set Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <span className="font-medium">{row.original.name}</span>
        {row.original.organizationId === null && (
          <Badge variant="secondary" className="text-[10px] h-5">
            <Lock className="mr-1 h-3 w-3" /> System
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1">
        {row.original.description || '-'}
      </span>
    ),
  },
  {
    id: 'permissionsCount',
    header: 'Permissions',
    cell: ({ row }) => <Badge variant="outline">{row.original.permissions.length} actions</Badge>,
  },
];
