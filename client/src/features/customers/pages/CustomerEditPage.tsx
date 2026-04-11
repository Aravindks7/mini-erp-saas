import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useCustomer, useCreateCustomer, useUpdateCustomer } from '../hooks/customers.hooks';
import { CustomerForm } from '../components/CustomerForm';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';

import type { CreateCustomerInput } from '@shared/contracts/customers.contract';
import { createCustomerSchema } from '@shared/contracts/customers.contract';

const FORM_ID = 'customer-edit-form';

export default function CustomerEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isEditing = !!id;
  const { data: customer, isLoading, isError } = useCustomer(id);
  const { mutateAsync: createCustomer, status: createStatus } = useCreateCustomer();
  const { mutateAsync: updateCustomer, status: updateStatus } = useUpdateCustomer();

  const isSubmitting = createStatus === 'pending' || updateStatus === 'pending';

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema) as Resolver<CreateCustomerInput>,
    defaultValues: {
      companyName: '',
      status: 'active',
      taxNumber: '',
      addresses: [],
      contacts: [],
    },
  });

  // Reset form when customer data is loaded
  useEffect(() => {
    if (customer) {
      form.reset({
        companyName: customer.companyName,
        status: customer.status as CreateCustomerInput['status'],
        taxNumber: customer.taxNumber || '',
        addresses: customer.addresses || [],
        contacts: customer.contacts || [],
      });
    }
  }, [customer, form]);

  const onSubmit = async (data: CreateCustomerInput) => {
    const toastId = toast.loading(isEditing ? 'Updating customer...' : 'Creating customer...');
    try {
      if (isEditing && id) {
        await updateCustomer({ id, data });
        toast.success(`Customer ${data.companyName} updated successfully`, { id: toastId });
        navigate(`/customers/${id}`);
      } else {
        const result = await createCustomer(data);
        toast.success(`Customer ${data.companyName} created successfully`, { id: toastId });
        navigate(`/customers/${result.id}`);
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
      navigate(isEditing ? `/customers/${id}` : '/customers');
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
          <h2 className="text-xl font-bold">Failed to load customer</h2>
          <Button variant="outline" onClick={() => navigate('/customers')}>
            Back to List
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isEditing ? `Edit ${customer?.companyName || 'Customer'}` : 'New Customer'}
        description={
          isEditing
            ? 'Modify existing customer information and manage associations.'
            : 'Onboard a new customer to the platform.'
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
            label: isSubmitting ? 'Saving...' : 'Save Customer',
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

      <CustomerForm form={form} onSubmit={onSubmit} formId={FORM_ID} isEdit={isEditing} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate(isEditing ? `/customers/${id}` : '/customers')}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them and leave this page?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </PageContainer>
  );
}
