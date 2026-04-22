import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { useRoles, usePermissionSets, useDeleteRole } from '@/features/auth/hooks/rbac.hooks';
import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTenantPath } from '@/hooks/useTenantPath';
import type { RoleResponse } from '@shared/index';

export function RolesTab() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: roles, isLoading } = useRoles();
  const { data: sets } = usePermissionSets();
  const deleteRole = useDeleteRole();

  const [roleToDelete, setRoleToDelete] = React.useState<RoleResponse | null>(null);

  const handleDelete = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole.mutateAsync(roleToDelete.id);
      toast.success('Role deleted successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete role';
      toast.error(errorMessage);
    } finally {
      setRoleToDelete(null);
    }
  };

  const columns: ColumnDef<RoleResponse>[] = [
    {
      accessorKey: 'name',
      header: 'Role Name',
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
      header: 'Permission Sets',
      cell: ({ row }) => {
        const roleSets = sets?.filter((s) => row.original.permissionSetIds.includes(s.id));
        return (
          <div className="flex flex-wrap gap-1">
            {roleSets?.map((s) => (
              <Badge key={s.id} variant="outline">
                {s.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <EntityTable
        data={roles || []}
        columns={columns}
        isLoading={isLoading}
        headerActions={
          <Button onClick={() => navigate(getPath('/settings/roles/new'))}>
            <Plus className="mr-2 h-4 w-4" /> New Role
          </Button>
        }
        actions={{
          onEdit: (role) => navigate(getPath(`/settings/roles/${role.id}`)),
          onDelete: (role) => setRoleToDelete(role),
          deleteLabel: 'Delete Role',
        }}
      />

      <ConfirmDialog
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`}
        variant="destructive"
        isLoading={deleteRole.isPending}
      />
    </div>
  );
}
