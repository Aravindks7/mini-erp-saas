import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTenantPath } from '@/hooks/useTenantPath';
import {
  usePermissionSet,
  useCreatePermissionSet,
  useUpdatePermissionSet,
} from '../hooks/permission-sets.hooks';
import { PermissionSetForm } from '../components/PermissionSetForm';
import { APP_PATHS } from '@/lib/paths';
import type { CreatePermissionSetInput } from '@shared/contracts/permission-sets.contract';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';

export default function PermissionSetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const backPath = getPath(APP_PATHS.settings.permissionSets.list());

  const { data: existingSet, isLoading: isFetching } = usePermissionSet(id);
  const createMutation = useCreatePermissionSet();
  const updateMutation = useUpdatePermissionSet(id!);

  const isEditing = !!id;

  const onSubmit = async (data: CreatePermissionSetInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate(backPath);
    } catch (error) {
      console.error('Failed to save permission set:', error);
    }
  };

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title={isEditing ? `Edit ${existingSet?.name || 'Set'}` : 'New Permission Set'}
        backButton={{ href: backPath, label: 'Back to Permission Sets' }}
      />

      <div className="mt-8">
        {isFetching ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <SkeletonLoader variant="form" rows={2} />
              <SkeletonLoader variant="card" />
            </div>
            <SkeletonLoader variant="table" rows={6} />
          </div>
        ) : (
          <PermissionSetForm
            initialData={existingSet}
            onSubmit={onSubmit}
            isPending={createMutation.isPending || updateMutation.isPending}
            backPath={backPath}
          />
        )}
      </div>
    </PageContainer>
  );
}
