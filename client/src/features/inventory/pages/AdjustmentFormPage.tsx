import { useForm, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';

import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { useTenantPath } from '@/hooks/useTenantPath';
import {
  createInventoryAdjustmentSchema,
  type CreateInventoryAdjustmentInput,
} from '@mini-erp/shared';
import { APP_PATHS } from '@/lib/paths';

import { AdjustmentForm } from '../components/adjustments/AdjustmentForm';
import { useCreateAdjustment } from '../hooks/inventory.hooks';

export default function AdjustmentFormPage() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const createMutation = useCreateAdjustment();

  const form = useForm<CreateInventoryAdjustmentInput>({
    resolver: zodResolver(
      createInventoryAdjustmentSchema,
    ) as Resolver<CreateInventoryAdjustmentInput>,
    defaultValues: {
      reason: '',
      reference: '',
      adjustmentDate: new Date().toISOString(),
      lines: [
        {
          productId: '',
          warehouseId: '',
          quantityVariance: 1,
        },
      ],
    },
  });

  const onSubmit = async (data: CreateInventoryAdjustmentInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Inventory adjustment recorded successfully');
      navigate(getPath(APP_PATHS.inventory.adjustments.list()));
    } catch (error) {
      toast.error('Failed to record adjustment. Please check your data.');
      console.error('Adjustment error:', error);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="New Inventory Adjustment"
        description="Record a manual stock correction or cycle count."
        backButton={{ href: APP_PATHS.inventory.index(), label: 'Back to Levels' }}
        actions={[
          {
            label: createMutation.isPending ? 'Processing...' : 'Post Adjustment',
            type: 'submit',
            form: 'adjustment-form',
            disabled: createMutation.isPending,
          },
        ]}
      >
        <Button variant="outline" onClick={() => navigate(getPath(APP_PATHS.inventory.index()))}>
          Cancel
        </Button>
      </PageHeader>

      <AdjustmentForm form={form} onSubmit={onSubmit} formId="adjustment-form" />
    </PageContainer>
  );
}
