import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';

import { useCustomer, useCreateCustomer, useUpdateCustomer } from '../hooks/customers.hooks';
import { CustomerForm } from '../components/CustomerForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

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
        addresses: (customer.addresses || []).map((a) => ({
          ...a,
          addressType: a.addressType || null,
        })),
        contacts: (customer.contacts || []).map((c) => ({
          ...c,
          jobTitle: c.jobTitle || null,
        })),
      });
    }
  }, [customer, form]);

  const onSubmit = async (data: CreateCustomerInput) => {
    try {
      if (isEditing && id) {
        await updateCustomer({ id, data });
      } else {
        await createCustomer(data);
      }
      navigate('/customers');
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate('/customers');
    }
  };

  if (isEditing && isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isEditing && isError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
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

      <CustomerForm form={form as any} onSubmit={onSubmit} formId={FORM_ID} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate('/customers')}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them and leave this page?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </PageContainer>
  );
}
