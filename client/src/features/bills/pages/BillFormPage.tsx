import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useBill, useCreateBill, useUpdateBill } from '../hooks/bills.hooks';
import { BillForm } from '../components/BillForm';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';

import type { CreateBillInput } from '@shared/contracts/bills.contract';
import { createBillSchema } from '@shared/contracts/bills.contract';

const FORM_ID = 'bill-form';

export default function BillFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isEditing = !!id;
  const { data: bill, isLoading, isError } = useBill(id);
  const { mutateAsync: createBill, status: createStatus } = useCreateBill();
  const { mutateAsync: updateBill, status: updateStatus } = useUpdateBill();

  const isSubmitting = createStatus === 'pending' || updateStatus === 'pending';

  const form = useForm<CreateBillInput>({
    resolver: zodResolver(createBillSchema) as Resolver<CreateBillInput>,
    defaultValues: {
      supplierId: '',
      referenceNumber: '',
      issueDate: new Date(),
      dueDate: new Date(),
      lines: [],
      notes: '',
      status: 'draft',
    } as any,
  });

  useEffect(() => {
    if (bill) {
      form.reset({
        supplierId: bill.supplierId,
        referenceNumber: bill.referenceNumber,
        issueDate: new Date(bill.issueDate),
        dueDate: new Date(bill.dueDate),
        lines: bill.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRateAtOrder: line.taxRateAtOrder,
          taxAmount: line.taxAmount,
          lineTotal: line.lineTotal,
        })),
        notes: bill.notes || '',
        status: bill.status as CreateBillInput['status'],
      } as any);
    }
  }, [bill, form]);

  const onSubmit = async (data: CreateBillInput) => {
    const toastId = toast.loading(isEditing ? 'Updating bill...' : 'Creating bill...');
    try {
      if (isEditing && id) {
        await updateBill({ id, data });
        toast.success(`Bill ${data.referenceNumber} updated successfully`, { id: toastId });
        navigate(getPath(`/bills/${id}`));
      } else {
        const result = await createBill(data);
        toast.success(`Bill ${data.referenceNumber} created successfully`, { id: toastId });
        navigate(getPath(`/bills/${result.id}`));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      toast.error(message, { id: toastId });
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate(getPath(isEditing ? `/bills/${id}` : '/bills'));
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
          <h2 className="text-xl font-bold">Failed to load bill</h2>
          <Button variant="outline" onClick={() => navigate(getPath('/bills'))}>
            Back to List
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isEditing ? `Edit Bill ${bill?.referenceNumber || ''}` : 'New Bill'}
        description={
          isEditing ? 'Modify existing vendor bill information.' : 'Record a new vendor bill.'
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
            label: isSubmitting ? 'Saving...' : 'Save Bill',
            variant: 'default',
            type: 'submit',
            form: FORM_ID,
            icon: isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            ),
            disabled: isSubmitting || (isEditing && !form.formState.isDirty),
          },
        ]}
      />

      <BillForm form={form} onSubmit={onSubmit} formId={FORM_ID} isEdit={isEditing} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate(getPath(isEditing ? `/bills/${id}` : '/bills'))}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </PageContainer>
  );
}
