import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save, X } from 'lucide-react';

import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PermissionTree } from '@/components/shared/rbac/PermissionTree';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTenantPath } from '@/hooks/useTenantPath';
import {
  usePermissionSet,
  useCreatePermissionSet,
  useUpdatePermissionSet,
} from '@/features/auth/hooks/rbac.hooks';
import { createPermissionSetSchema, type CreatePermissionSetInput } from '@shared/index';

export default function PermissionSetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const backPath = getPath('/settings/permission-sets');

  const { data: existingSet, isLoading: isFetching } = usePermissionSet(id!);
  const createMutation = useCreatePermissionSet();
  const updateMutation = useUpdatePermissionSet(id!);

  const isEditing = !!id;
  const isSystemTemplate = isEditing && existingSet?.organizationId === null;
  const isForking = isSystemTemplate;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreatePermissionSetInput>({
    resolver: zodResolver(createPermissionSetSchema),
    defaultValues: {
      name: '',
      permissions: [],
    },
  });

  const selectedPermissions = watch('permissions');

  React.useEffect(() => {
    if (existingSet) {
      reset({
        name: isForking ? `${existingSet.name} (Copy)` : existingSet.name,
        permissions: existingSet.permissions,
      });
    }
  }, [existingSet, reset, isForking]);

  const onSubmit = async (data: CreatePermissionSetInput) => {
    try {
      if (isEditing && !isForking) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate(backPath);
    } catch (error) {
      console.error('Failed to save permission set:', error);
    }
  };

  if (isEditing && isFetching) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title={
          isEditing
            ? isForking
              ? 'Copy Permission Set'
              : 'Edit Permission Set'
            : 'New Permission Set'
        }
        backButton={{ href: '/settings/permission-sets', label: 'Back to Sets' }}
        actions={[
          {
            label: 'Cancel',
            variant: 'outline',
            onClick: () => navigate(backPath),
            icon: <X className="size-4" />,
            disabled: isPending,
          },
          {
            label: isPending ? 'Saving...' : 'Save Permission Set',
            type: 'submit',
            form: 'permission-set-form',
            icon: <Save className="size-4" />,
            isLoading: isPending,
            disabled: isPending || (isEditing && !isDirty),
          },
        ]}
      />

      {isForking && (
        <Alert variant="default" className="mb-6 bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4 stroke-amber-800" />
          <AlertTitle className="font-semibold text-amber-900">System Template</AlertTitle>
          <AlertDescription className="text-amber-800/90">
            You are editing a <strong>System Template</strong>. A custom copy will be created for
            your organization upon saving.
          </AlertDescription>
        </Alert>
      )}

      <form id="permission-set-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="name">Permission Set Name</Label>
            <Input id="name" placeholder="e.g., Inventory Manager" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Granular Permissions</Label>
              <p className="text-sm text-muted-foreground">
                Select the specific actions this set will allow.
              </p>
            </div>
            <Badge variant="outline" className="font-mono">
              {selectedPermissions.length} selected
            </Badge>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <PermissionTree
              selectedPermissions={selectedPermissions}
              onChange={(perms) => setValue('permissions', perms, { shouldDirty: true })}
              disabled={isPending}
            />
          </div>
          {errors.permissions && (
            <p className="text-xs text-destructive font-medium">{errors.permissions.message}</p>
          )}
        </div>
      </form>
    </PageContainer>
  );
}
