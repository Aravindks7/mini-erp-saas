import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X, LayoutList } from 'lucide-react';
import { toast } from 'sonner';

import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { useTenantPath } from '@/hooks/useTenantPath';

import { SalesOrderForm } from '../components/SalesOrderForm';
import {
  useCreateSalesOrder,
  useSalesOrder,
  useUpdateSalesOrder,
} from '../hooks/sales-orders.hooks';
import {
  createSalesOrderSchema,
  type CreateSalesOrderInput,
} from '@shared/contracts/sales-orders.contract';

const FORM_ID = 'sales-order-form';

export default function SalesOrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isEditing = !!id;
  const { data: so, isLoading, isError } = useSalesOrder(id);
  const { mutateAsync: createSO, status: createStatus } = useCreateSalesOrder();
  const { mutateAsync: updateSO, status: updateStatus } = useUpdateSalesOrder();

  const isSubmitting = createStatus === 'pending' || updateStatus === 'pending';

  const form = useForm<CreateSalesOrderInput>({
    resolver: zodResolver(createSalesOrderSchema) as Resolver<CreateSalesOrderInput>,
    defaultValues: {
      customerId: '',
      lines: [
        {
          productId: '',
          quantity: '1',
          unitPrice: '0',
          taxRateAtOrder: '0',
          taxAmount: '0',
        },
      ],
    },
  });

  useEffect(() => {
    if (so) {
      form.reset({
        customerId: so.customerId,
        lines: so.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRateAtOrder: l.taxRateAtOrder,
          taxAmount: l.taxAmount,
        })),
      });
    }
  }, [so, form]);

  const onSubmit = async (data: CreateSalesOrderInput) => {
    const toastId = toast.loading(
      isEditing ? 'Updating sales order...' : 'Creating sales order...',
    );
    try {
      if (isEditing && id) {
        await updateSO({ id, data });
        toast.success('Sales order updated successfully', { id: toastId });
        navigate(getPath(`/sales-orders/${id}`));
      } else {
        const result = await createSO(data);
        toast.success('Sales order created successfully', { id: toastId });
        navigate(getPath(`/sales-orders/${result.id}`));
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
      navigate(getPath(isEditing ? `/sales-orders/${id}` : '/sales-orders'));
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
          <LayoutList className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Failed to load sales order</h2>
          <Button variant="outline" onClick={() => navigate(getPath('/sales-orders'))}>
            Back to List
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isEditing ? `Edit SO ${so?.documentNumber}` : 'New Sales Order'}
        description={
          isEditing
            ? 'Modify existing sales order details.'
            : 'Fill out the details to create a new customer sales order.'
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
            label: isSubmitting ? 'Saving...' : 'Save Order',
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

      <SalesOrderForm form={form} onSubmit={onSubmit} formId={FORM_ID} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate(getPath(isEditing ? `/sales-orders/${id}` : '/sales-orders'))}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them and leave this page?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </PageContainer>
  );
}
