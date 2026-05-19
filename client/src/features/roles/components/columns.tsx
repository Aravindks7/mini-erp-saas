import type { ColumnDef } from '@tanstack/react-table';
import { ShieldCheck, Lock } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/shared/data-table/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import type { RoleResponse } from '@shared/contracts/roles.contract';
import type { PermissionSetResponse } from '@shared/contracts/permission-sets.contract';

export const createColumns = (
  permissionSets: PermissionSetResponse[] = [],
): ColumnDef<RoleResponse>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="font-medium">{row.original.name}</span>
        {row.original.isBaseRole && (
          <Badge variant="secondary" className="text-[10px] h-5">
            <Lock className="mr-1 h-3 w-3" /> System
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: 'permissionSets',
    header: 'Permission Sets',
    cell: ({ row }) => {
      const roleSets = permissionSets.filter((s) => row.original.permissionSetIds.includes(s.id));
      return (
        <div className="flex flex-wrap gap-1">
          {roleSets.map((s) => (
            <Badge key={s.id} variant="outline">
              {s.name}
            </Badge>
          ))}
        </div>
      );
    },
  },
];
