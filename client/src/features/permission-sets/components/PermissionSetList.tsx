import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissionSetsQuery, useDeletePermissionSet } from '../hooks/permission-sets.hooks';
import { columns } from './columns';
import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';
import type { PermissionSetResponse } from '@shared/contracts/permission-sets.contract';

export function PermissionSetList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: sets, isLoading } = usePermissionSetsQuery();
  const deleteMutation = useDeletePermissionSet();

  const [setToDelete, setSetToDelete] = React.useState<PermissionSetResponse | null>(null);

  const handleDelete = async () => {
    if (!setToDelete) return;
    try {
      await deleteMutation.mutateAsync(setToDelete.id);
      toast.success('Permission set deleted');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete set';
      toast.error(errorMessage);
    } finally {
      setSetToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <EntityTable
        data={sets || []}
        columns={columns}
        isLoading={isLoading}
        headerActions={
          <Button onClick={() => navigate(getPath(APP_PATHS.settings.permissionSets.new()))}>
            <Plus className="mr-2 h-4 w-4" /> New Permission Set
          </Button>
        }
        actions={{
          onEdit: (set) => navigate(getPath(APP_PATHS.settings.permissionSets.detail(set.id))),
          onDelete: (set) => setSetToDelete(set),
          deleteLabel: 'Delete Set',
        }}
      />

      <ConfirmDialog
        isOpen={!!setToDelete}
        onClose={() => setSetToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Permission Set"
        description={`Are you sure you want to delete "${setToDelete?.name}"? This action cannot be undone and may affect roles using this set.`}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
