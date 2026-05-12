import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { useRole, useCreateRole, useUpdateRole } from '../hooks/roles.hooks';
import { usePermissionSetsQuery } from '@/features/permission-sets';
import { RoleForm } from '../components/RoleForm';
import { APP_PATHS } from '@/lib/paths';
import type { CreateRoleInput } from '@shared/contracts/roles.contract';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';

export default function RoleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const backPath = getPath(APP_PATHS.settings.roles.list());

  const { data: existingRole, isLoading: isFetchingRole } = useRole(id);
  const { data: availableSets, isLoading: isFetchingSets } = usePermissionSetsQuery();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole(id!);

  const isEditing = !!id;
  const isFetching = (isEditing && isFetchingRole) || isFetchingSets;

  const onSubmit = async (data: CreateRoleInput) => {
    try {
      const isSystemTemplate =
        isEditing && (existingRole?.organizationId === null || existingRole?.isBaseRole);

      if (isEditing && !isSystemTemplate) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate(backPath);
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title={
          isEditing
            ? existingRole?.organizationId === null || existingRole?.isBaseRole
              ? 'Copy Role'
              : 'Edit Role'
            : 'New Role'
        }
        backButton={{ href: backPath, label: 'Back to Roles' }}
      />

      <div className="mt-8">
        {isFetching ? (
          <div className="space-y-6">
            <SkeletonLoader variant="form" rows={3} />
            <SkeletonLoader variant="card" />
          </div>
        ) : (
          <RoleForm
            initialData={existingRole}
            availableSets={availableSets || []}
            onSubmit={onSubmit}
            isPending={createMutation.isPending || updateMutation.isPending}
            backPath={backPath}
          />
        )}
      </div>
    </PageContainer>
  );
}
