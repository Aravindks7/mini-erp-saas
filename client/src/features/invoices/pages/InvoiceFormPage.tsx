import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTenantPath } from '@/hooks/useTenantPath';

import { InvoiceForm } from '../components/InvoiceForm';
import { useCreateInvoice } from '../hooks/invoices.hooks';
import { createInvoiceSchema, type CreateInvoiceInput } from '@shared/contracts/invoices.contract';
import { addDays } from 'date-fns';

const FORM_ID = 'invoice-form';

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { mutateAsync: createInvoice, status: createStatus } = useCreateInvoice();

  const isSubmitting = createStatus === 'pending';

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema) as Resolver<CreateInvoiceInput>,
    defaultValues: {
      customerId: '',
      issueDate: new Date(),
      dueDate: addDays(new Date(), 30),
      lines: [
        {
          productId: '',
          quantity: '1',
          unitPrice: '0',
          taxRateAtOrder: '0',
          taxAmount: '0',
          lineTotal: '0',
        },
      ],
      notes: '',
    },
  });

  const onSubmit = async (data: CreateInvoiceInput) => {
    const toastId = toast.loading('Creating invoice...');

    try {
      // Enrichment: Calculate line totals for the backend
      const enrichedData: CreateInvoiceInput = {
        ...data,
        lines: data.lines.map((line) => ({
          ...line,
          lineTotal: (
            Number(line.quantity) * Number(line.unitPrice) +
            Number(line.taxAmount)
          ).toString(),
        })),
      };

      const result = await createInvoice(enrichedData);
      toast.success('Invoice created successfully', { id: toastId });
      navigate(getPath(`/invoices/${result.id}`));
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
      navigate(getPath('/invoices'));
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="New Invoice"
        description="Fill out the details to create a new customer invoice."
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
            label: isSubmitting ? 'Saving...' : 'Save Invoice',
            variant: 'default',
            type: 'submit',
            form: FORM_ID,
            icon: isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            ),
            disabled: isSubmitting,
            className: 'min-w-[140px] shadow-lg shadow-primary/20',
          },
        ]}
      />

      <InvoiceForm form={form} onSubmit={onSubmit} formId={FORM_ID} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate(getPath('/invoices'))}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them and leave this page?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </PageContainer>
  );
}
