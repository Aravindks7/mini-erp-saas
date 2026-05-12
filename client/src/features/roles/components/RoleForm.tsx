import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TransferList } from '@/components/shared/rbac/TransferList';
import {
  createRoleSchema,
  type CreateRoleInput,
  type RoleResponse,
} from '@shared/contracts/roles.contract';
import type { PermissionSetResponse } from '@shared/contracts/permission-sets.contract';

interface RoleFormProps {
  initialData?: RoleResponse;
  availableSets: PermissionSetResponse[];
  onSubmit: (data: CreateRoleInput) => Promise<void>;
  isPending: boolean;
  backPath: string;
}

export function RoleForm({
  initialData,
  availableSets,
  onSubmit,
  isPending,
  backPath,
}: RoleFormProps) {
  const navigate = useNavigate();

  const isEditing = !!initialData;
  const isSystemTemplate =
    isEditing && (initialData.organizationId === null || initialData.isBaseRole);
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
    if (initialData) {
      reset({
        name: isForking ? `${initialData.name} (Copy)` : initialData.name,
        permissionSetIds: initialData.permissionSetIds,
      });
    }
  }, [initialData, reset, isForking]);

  const transferItems = React.useMemo(
    () =>
      availableSets.map((set) => ({
        id: set.id,
        label: set.name,
        description: set.organizationId === null ? 'System Template' : 'Custom Set',
      })),
    [availableSets],
  );

  return (
    <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
          <p className="text-xs text-destructive font-medium">{errors.permissionSetIds.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(backPath)}
          disabled={isPending}
        >
          <X className="mr-2 size-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || (isEditing && !isDirty)}>
          <Save className="mr-2 size-4" />
          {isPending ? 'Saving...' : 'Save Role'}
        </Button>
      </div>
    </form>
  );
}
