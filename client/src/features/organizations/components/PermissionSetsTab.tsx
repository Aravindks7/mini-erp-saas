import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, KeyRound, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { usePermissionSets, useDeletePermissionSet } from '@/features/auth/hooks/rbac.hooks';
import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTenantPath } from '@/hooks/useTenantPath';
import type { PermissionSetResponse } from '@shared/index';

export function PermissionSetsTab() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: sets, isLoading } = usePermissionSets();
  const deleteSet = useDeletePermissionSet();

  const [setToDelete, setSetToDelete] = React.useState<PermissionSetResponse | null>(null);

  const handleDelete = async () => {
    if (!setToDelete) return;
    try {
      await deleteSet.mutateAsync(setToDelete.id);
      toast.success('Permission set deleted successfully');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete permission set';
      toast.error(errorMessage);
    } finally {
      setSetToDelete(null);
    }
  };

  const columns: ColumnDef<PermissionSetResponse>[] = [
    {
      accessorKey: 'name',
      header: 'Set Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <span className="font-medium">{row.original.name}</span>
          {!row.original.organizationId && (
            <Badge variant="secondary" className="text-[10px] h-5">
              <Lock className="mr-1 h-3 w-3" /> System
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.permissions.map((p) => (
            <Badge key={p} variant="secondary" className="font-mono text-[10px]">
              {p}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <EntityTable
        data={sets || []}
        columns={columns}
        isLoading={isLoading}
        headerActions={
          <Button onClick={() => navigate(getPath('/settings/permission-sets/new'))}>
            <Plus className="mr-2 h-4 w-4" /> New Set
          </Button>
        }
        actions={{
          onEdit: (set) => navigate(getPath(`/settings/permission-sets/${set.id}`)),
          onDelete: (set) => setSetToDelete(set),
          deleteLabel: 'Delete Set',
        }}
      />

      <ConfirmDialog
        isOpen={!!setToDelete}
        onClose={() => setSetToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Permission Set"
        description={`Are you sure you want to delete the permission set "${setToDelete?.name}"? This action cannot be undone and will fail if the set is currently assigned to any roles.`}
        variant="destructive"
        isLoading={deleteSet.isPending}
      />
    </div>
  );
}
