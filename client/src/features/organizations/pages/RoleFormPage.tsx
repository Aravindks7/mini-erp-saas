import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save, X } from 'lucide-react';

import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { TransferList } from '@/components/shared/rbac/TransferList';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTenantPath } from '@/hooks/useTenantPath';
import {
  useRole,
  useCreateRole,
  useUpdateRole,
  usePermissionSets,
} from '@/features/auth/hooks/rbac.hooks';
import { createRoleSchema, type CreateRoleInput } from '@shared/index';

export default function RoleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const backPath = getPath('/settings/roles');

  const { data: existingRole, isLoading: isFetchingRole } = useRole(id!);
  const { data: availableSets, isLoading: isFetchingSets } = usePermissionSets();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole(id!);

  const isEditing = !!id;
  const isSystemTemplate =
    isEditing && (existingRole?.organizationId === null || existingRole?.isBaseRole);
  const isForking = isSystemTemplate;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      permissionSetIds: [],
    },
  });

  const selectedSetIds = useWatch({
    control,
    name: 'permissionSetIds',
    defaultValue: [],
  });

  React.useEffect(() => {
    if (existingRole) {
      reset({
        name: isForking ? `${existingRole.name} (Copy)` : existingRole.name,
        permissionSetIds: existingRole.permissionSetIds,
      });
    }
  }, [existingRole, reset, isForking]);

  const onSubmit = async (data: CreateRoleInput) => {
    try {
      if (isEditing && !isForking) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate(backPath);
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  const isFetching = isFetchingRole || isFetchingSets;

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

  const transferItems =
    availableSets?.map((set) => ({
      id: set.id,
      label: set.name,
      description: set.organizationId === null ? 'System Template' : 'Custom Set',
    })) || [];

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title={isEditing ? (isForking ? 'Copy Role' : 'Edit Role') : 'New Role'}
        backButton={{ href: '/settings/roles', label: 'Back to Roles' }}
        actions={[
          {
            label: 'Cancel',
            variant: 'outline',
            onClick: () => navigate(backPath),
            icon: <X className="size-4" />,
            disabled: isPending,
          },
          {
            label: isPending ? 'Saving...' : 'Save Role',
            type: 'submit',
            form: 'role-form',
            icon: <Save className="size-4" />,
            isLoading: isPending,
            disabled: isPending || (isEditing && !isDirty),
          },
        ]}
      />

      {isForking && (
        <Alert variant="default" className="mb-6 bg-muted/40 border-border">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">System Template</AlertTitle>
          <AlertDescription>
            You are editing a <strong>System Template</strong>. A custom copy will be created for
            your organization upon saving.
          </AlertDescription>
        </Alert>
      )}

      <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input id="name" placeholder="e.g., Regional Manager" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-0.5">
            <Label className="text-base">Assigned Permission Sets</Label>
            <p className="text-sm text-muted-foreground">
              Select the permission sets that define this role's capabilities.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <TransferList
              items={transferItems}
              value={selectedSetIds}
              onChange={(ids) => setValue('permissionSetIds', ids, { shouldDirty: true })}
              disabled={isPending}
              leftTitle="Available Sets"
              rightTitle="Assigned Sets"
            />
          </div>
          {errors.permissionSetIds && (
            <p className="text-xs text-destructive font-medium">
              {errors.permissionSetIds.message}
            </p>
          )}
        </div>
      </form>
    </PageContainer>
  );
}
