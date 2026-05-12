import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PermissionTree } from '@/components/shared/rbac/PermissionTree';
import { SearchInput } from '@/components/shared/SearchInput';
import {
  createPermissionSetSchema,
  type CreatePermissionSetInput,
  type PermissionSetResponse,
} from '@shared/contracts/permission-sets.contract';

interface PermissionSetFormProps {
  initialData?: PermissionSetResponse;
  onSubmit: (data: CreatePermissionSetInput) => Promise<void>;
  isPending: boolean;
  backPath: string;
}

export function PermissionSetForm({
  initialData,
  onSubmit,
  isPending,
  backPath,
}: PermissionSetFormProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const isEditing = !!initialData;
  const isSystemTemplate =
    isEditing && (initialData.organizationId === null || initialData.isBaseSet);
  const isForking = isSystemTemplate;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreatePermissionSetInput>({
    resolver: zodResolver(createPermissionSetSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  const selectedPermissions = useWatch({
    control,
    name: 'permissions',
    defaultValue: [],
  });

  React.useEffect(() => {
    if (initialData) {
      reset({
        name: isForking ? `${initialData.name} (Copy)` : initialData.name,
        description: initialData.description || '',
        permissions: initialData.permissions,
      });
    }
  }, [initialData, reset, isForking]);

  return (
    <form id="permission-set-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Set Name</Label>
            <Input id="name" placeholder="e.g., Sales Management" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this permission set allows..."
              className="resize-none"
              rows={4}
              {...register('description')}
            />
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <div className="bg-muted/30 p-4 rounded-lg border border-dashed text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">About Permission Sets</p>
            Permission sets are building blocks for roles. They group granular actions (like "create
            customer" or "view reports") into logical bundles that can be reused across different
            roles.
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-0.5">
            <Label className="text-lg font-semibold">Configure Permissions</Label>
            <p className="text-sm text-muted-foreground">
              Select the specific actions included in this set.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <SearchInput
              placeholder="Filter actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
        </div>

        <div className="min-h-[400px]">
          <PermissionTree
            selectedPermissions={selectedPermissions}
            onChange={(perms) => setValue('permissions', perms, { shouldDirty: true })}
            disabled={isPending}
            searchQuery={searchQuery}
          />
        </div>
        {errors.permissions && (
          <p className="text-xs text-destructive font-medium">{errors.permissions.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t sticky bottom-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-4 z-10">
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
          {isPending ? 'Saving...' : 'Save Permission Set'}
        </Button>
      </div>
    </form>
  );
}
