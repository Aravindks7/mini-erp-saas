import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRolesQuery, useDeleteRole } from '../hooks/roles.hooks';
import { usePermissionSetsQuery } from '@/features/permission-sets';
import { createColumns } from './columns';
import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';
import type { RoleResponse } from '@shared/contracts/roles.contract';

export function RoleList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: roles, isLoading: isLoadingRoles } = useRolesQuery();
  const { data: sets } = usePermissionSetsQuery();
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

  const columns = React.useMemo(() => createColumns(sets || []), [sets]);

  return (
    <div className="space-y-4">
      <EntityTable
        data={roles || []}
        columns={columns}
        isLoading={isLoadingRoles}
        headerActions={
          <Button onClick={() => navigate(getPath(APP_PATHS.settings.roles.new()))}>
            <Plus className="mr-2 h-4 w-4" /> New Role
          </Button>
        }
        actions={{
          onEdit: (role) => navigate(getPath(APP_PATHS.settings.roles.detail(role.id))),
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
