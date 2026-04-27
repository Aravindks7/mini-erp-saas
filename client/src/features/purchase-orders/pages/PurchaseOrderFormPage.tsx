import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { useTenantPath } from '@/hooks/useTenantPath';

import { PurchaseOrderForm } from '../components/PurchaseOrderForm';
import {
  useCreatePurchaseOrder,
  usePurchaseOrder,
  useUpdatePurchaseOrder,
} from '../hooks/purchase-orders.hooks';
import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderInput,
} from '@shared/contracts/purchase-orders.contract';

const FORM_ID = 'purchase-order-form';

export default function PurchaseOrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isEditing = !!id;
  const { data: po, isLoading, isError } = usePurchaseOrder(id);
  const { mutateAsync: createPO, status: createStatus } = useCreatePurchaseOrder();
  const { mutateAsync: updatePO, status: updateStatus } = useUpdatePurchaseOrder();

  const isSubmitting = createStatus === 'pending' || updateStatus === 'pending';

  const form = useForm<CreatePurchaseOrderInput>({
    resolver: zodResolver(createPurchaseOrderSchema) as Resolver<CreatePurchaseOrderInput>,
    defaultValues: {
      supplierId: '',
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
    if (po) {
      form.reset({
        supplierId: po.supplierId,
        lines: po.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRateAtOrder: l.taxRateAtOrder,
          taxAmount: l.taxAmount,
        })),
      });
    }
  }, [po, form]);

  const onSubmit = async (data: CreatePurchaseOrderInput) => {
    const toastId = toast.loading(
      isEditing ? 'Updating purchase order...' : 'Creating purchase order...',
    );
    try {
      if (isEditing && id) {
        await updatePO({ id, data });
        toast.success('Purchase order updated successfully', { id: toastId });
        navigate(getPath(`/purchase-orders/${id}`));
      } else {
        const result = await createPO(data);
        toast.success('Purchase order created successfully', { id: toastId });
        navigate(getPath(`/purchase-orders/${result.id}`));
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
      navigate(getPath(isEditing ? `/purchase-orders/${id}` : '/purchase-orders'));
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
          <ShoppingCart className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Failed to load purchase order</h2>
          <Button variant="outline" onClick={() => navigate(getPath('/purchase-orders'))}>
            Back to List
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isEditing ? `Edit PO ${po?.documentNumber}` : 'New Purchase Order'}
        description={
          isEditing
            ? 'Modify existing procurement details.'
            : 'Fill out the details to create a new procurement commitment.'
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

      <PurchaseOrderForm form={form} onSubmit={onSubmit} formId={FORM_ID} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() =>
          navigate(getPath(isEditing ? `/purchase-orders/${id}` : '/purchase-orders'))
        }
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them and leave this page?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </PageContainer>
  );
}
