import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useSupplier, useCreateSupplier, useUpdateSupplier } from '../hooks/suppliers.hooks';
import { SupplierForm } from '../components/SupplierForm';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';

import type { CreateSupplierInput } from '@shared/contracts/suppliers.contract';
import { createSupplierSchema } from '@shared/contracts/suppliers.contract';

const FORM_ID = 'supplier-form';

export default function SupplierFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isEditing = !!id;
  const { data: supplier, isLoading, isError } = useSupplier(id);
  const { mutateAsync: createSupplier, status: createStatus } = useCreateSupplier();
  const { mutateAsync: updateSupplier, status: updateStatus } = useUpdateSupplier();

  const isSubmitting = createStatus === 'pending' || updateStatus === 'pending';

  const form = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema) as Resolver<CreateSupplierInput>,
    defaultValues: {
      name: '',
      status: 'active',
      taxNumber: '',
      addresses: [],
      contacts: [],
    },
  });

  // Reset form when supplier data is loaded
  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        status: supplier.status as CreateSupplierInput['status'],
        taxNumber: supplier.taxNumber || '',
        addresses: supplier.addresses || [],
        contacts: supplier.contacts || [],
      });
    }
  }, [supplier, form]);

  const onSubmit = async (data: CreateSupplierInput) => {
    const toastId = toast.loading(isEditing ? 'Updating supplier...' : 'Creating supplier...');
    try {
      if (isEditing && id) {
        await updateSupplier({ id, data });
        toast.success(`Supplier ${data.name} updated successfully`, { id: toastId });
        navigate(getPath(`/suppliers/${id}`));
      } else {
        const result = await createSupplier(data);
        toast.success(`Supplier ${data.name} created successfully`, { id: toastId });
        navigate(getPath(`/suppliers/${result.id}`));
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
      navigate(getPath(isEditing ? `/suppliers/${id}` : '/suppliers'));
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
          <h2 className="text-xl font-bold">Failed to load supplier</h2>
          <Button variant="outline" onClick={() => navigate(getPath('/suppliers'))}>
            Back to List
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isEditing ? `Edit ${supplier?.name || 'Supplier'}` : 'New Supplier'}
        description={
          isEditing
            ? 'Modify existing supplier information and manage associations.'
            : 'Onboard a new supplier to the platform.'
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
            label: isSubmitting ? 'Saving...' : 'Save Supplier',
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

      <SupplierForm form={form} onSubmit={onSubmit} formId={FORM_ID} isEdit={isEditing} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate(getPath(isEditing ? `/suppliers/${id}` : '/suppliers'))}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them and leave this page?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </PageContainer>
  );
}
