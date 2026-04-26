import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useWarehouse, useCreateWarehouse, useUpdateWarehouse } from '../hooks/warehouses.hooks';
import { WarehouseForm } from '../components/WarehouseForm';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';

import type { CreateWarehouseInput } from '@shared/contracts/warehouses.contract';
import { createWarehouseSchema } from '@shared/contracts/warehouses.contract';

const FORM_ID = 'warehouse-form';

export default function WarehouseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isEditing = !!id;
  const { data: warehouse, isLoading, isError } = useWarehouse(id);
  const { mutateAsync: createWarehouse, status: createStatus } = useCreateWarehouse();
  const { mutateAsync: updateWarehouse, status: updateStatus } = useUpdateWarehouse();

  const isSubmitting = createStatus === 'pending' || updateStatus === 'pending';

  const form = useForm<CreateWarehouseInput>({
    resolver: zodResolver(createWarehouseSchema) as Resolver<CreateWarehouseInput>,
    defaultValues: {
      code: '',
      name: '',
      addresses: [],
      bins: [],
    },
  });

  useEffect(() => {
    if (warehouse) {
      form.reset({
        code: warehouse.code,
        name: warehouse.name,
        addresses: warehouse.addresses || [],
        bins: warehouse.bins || [],
      });
    }
  }, [warehouse, form]);

  const onSubmit = async (data: CreateWarehouseInput) => {
    const toastId = toast.loading(isEditing ? 'Updating warehouse...' : 'Creating warehouse...');
    try {
      if (isEditing && id) {
        await updateWarehouse({ id, data });
        toast.success(`Warehouse ${data.name} updated successfully`, { id: toastId });
        navigate(getPath(`/warehouses/${id}`));
      } else {
        const result = await createWarehouse(data);
        toast.success(`Warehouse ${data.name} created successfully`, { id: toastId });
        navigate(getPath(`/warehouses/${result.id}`));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      toast.error(message, { id: toastId });
      console.error('Submission failed:', error);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate(getPath(isEditing ? `/warehouses/${id}` : '/warehouses'));
    }
  };

  if (isEditing && isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isEditing && isError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Failed to load warehouse</h2>
          <Button variant="outline" onClick={() => navigate(getPath('/warehouses'))}>
            Back to List
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isEditing ? `Edit ${warehouse?.name || 'Warehouse'}` : 'New Warehouse'}
        description={
          isEditing
            ? 'Modify existing warehouse information and manage bins.'
            : 'Set up a new storage facility.'
        }
        backButton={{ onClick: handleCancel }}
        actions={[
          {
            label: 'Cancel',
            variant: 'outline',
            onClick: handleCancel,
            icon: <X className="h-4 w-4" />,
            disabled: isSubmitting,
          },
          {
            label: isSubmitting ? 'Saving...' : 'Save Warehouse',
            variant: 'default',
            type: 'submit',
            form: FORM_ID,
            icon: isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            ),
            disabled: isSubmitting || (isEditing && !form.formState.isDirty),
            className: 'min-w-[140px] shadow-lg shadow-primary/20',
          },
        ]}
      />

      <WarehouseForm form={form} onSubmit={onSubmit} formId={FORM_ID} isEdit={isEditing} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate(getPath(isEditing ? `/warehouses/${id}` : '/warehouses'))}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them and leave this page?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </PageContainer>
  );
}
