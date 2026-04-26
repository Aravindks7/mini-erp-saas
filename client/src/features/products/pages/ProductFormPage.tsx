import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useProduct, useCreateProduct, useUpdateProduct } from '../hooks/products.hooks';
import { ProductForm } from '../components/ProductForm';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';

import type { CreateProductInput } from '@shared/contracts/products.contract';
import { createProductSchema } from '@shared/contracts/products.contract';

const FORM_ID = 'product-form';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isEditing = !!id;
  const { data: product, isLoading, isError } = useProduct(id);
  const { mutateAsync: createProduct, status: createStatus } = useCreateProduct();
  const { mutateAsync: updateProduct, status: updateStatus } = useUpdateProduct();

  const isSubmitting = createStatus === 'pending' || updateStatus === 'pending';

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema) as Resolver<CreateProductInput>,
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      basePrice: '0',
      baseUomId: '',
      taxId: null,
      status: 'active',
    },
  });

  // Reset form when product data is loaded
  useEffect(() => {
    if (product) {
      form.reset({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        basePrice: product.basePrice,
        baseUomId: product.baseUomId,
        taxId: product.taxId || null,
        status: product.status as CreateProductInput['status'],
      });
    }
  }, [product, form]);

  const onSubmit = async (data: CreateProductInput) => {
    const toastId = toast.loading(isEditing ? 'Updating product...' : 'Creating product...');
    try {
      if (isEditing && id) {
        await updateProduct({ id, data });
        toast.success(`Product ${data.name} updated successfully`, { id: toastId });
        navigate(getPath(`/products/${id}`));
      } else {
        const result = await createProduct(data);
        toast.success(`Product ${data.name} created successfully`, { id: toastId });
        navigate(getPath(`/products/${result.id}`));
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
      navigate(getPath(isEditing ? `/products/${id}` : '/products'));
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
          <h2 className="text-xl font-bold">Failed to load product</h2>
          <Button variant="outline" onClick={() => navigate(getPath('/products'))}>
            Back to List
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isEditing ? `Edit ${product?.name || 'Product'}` : 'New Product'}
        description={
          isEditing
            ? 'Modify existing product information and manage settings.'
            : 'Add a new product to your inventory.'
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
            label: isSubmitting ? 'Saving...' : 'Save Product',
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

      <ProductForm form={form} onSubmit={onSubmit} formId={FORM_ID} isEdit={isEditing} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate(getPath(isEditing ? `/products/${id}` : '/products'))}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them and leave this page?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="destructive"
      />
    </PageContainer>
  );
}
