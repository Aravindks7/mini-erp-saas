import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

import { useCreatePayment } from '../hooks/payments.hooks';
import { PaymentForm } from '../components/PaymentForm';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTenantPath } from '@/hooks/useTenantPath';

import type { CreatePaymentInput } from '@shared/contracts/payments.contract';
import { createPaymentSchema } from '@shared/contracts/payments.contract';

const FORM_ID = 'payment-form';

export default function PaymentFormPage() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { mutateAsync: createPayment, status: createStatus } = useCreatePayment();

  const isSubmitting = createStatus === 'pending';

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema) as Resolver<CreatePaymentInput>,
    defaultValues: {
      paymentType: 'inbound',
      paymentMethod: 'cash',
      amount: '',
      paymentDate: new Date(),
      referenceNumber: '',
      notes: '',
      customerId: null,
      supplierId: null,
      invoiceId: null,
      billId: null,
    },
  });

  const onSubmit = async (data: CreatePaymentInput) => {
    const toastId = toast.loading('Recording payment...');
    try {
      const result = await createPayment(data);
      toast.success('Payment recorded successfully', { id: toastId });
      navigate(getPath(`/payments/${result.id}`));
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
      navigate(getPath('/payments'));
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Record Payment"
        description="Capture inbound or outbound payment details and link them to documents."
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
            label: isSubmitting ? 'Recording...' : 'Record Payment',
            variant: 'default',
            type: 'submit',
            form: FORM_ID,
            icon: isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            ),
            disabled: isSubmitting,
            className: 'min-w-[160px] shadow-lg shadow-primary/20',
          },
        ]}
      />

      <PaymentForm form={form} onSubmit={onSubmit} formId={FORM_ID} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate(getPath('/payments'))}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them and leave this page?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </PageContainer>
  );
}
