import { useForm, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';
import { createInventoryTransferSchema, type CreateInventoryTransferInput } from '@mini-erp/shared';

import { TransferForm } from '../components/transfers/TransferForm';
import { useCreateTransfer } from '../hooks/inventory.hooks';

export default function TransferFormPage() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const createMutation = useCreateTransfer();

  const form = useForm<CreateInventoryTransferInput>({
    resolver: zodResolver(createInventoryTransferSchema) as Resolver<CreateInventoryTransferInput>,
    defaultValues: {
      fromWarehouseId: '',
      toWarehouseId: '',
      reference: '',
      lines: [
        {
          productId: '',
          quantity: 1,
        },
      ],
    },
  });

  const onSubmit = async (data: CreateInventoryTransferInput) => {
    const toastId = toast.loading('Creating transfer...');
    try {
      await createMutation.mutateAsync(data);
      toast.success('Transfer created successfully', { id: toastId });
      navigate(getPath(APP_PATHS.inventory.transfers.list()));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      toast.error(message, { id: toastId });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="New Stock Transfer"
        description="Move inventory between warehouses."
        backButton={{ href: APP_PATHS.inventory.transfers.list(), label: 'Back to Transfers' }}
        actions={[
          {
            label: createMutation.isPending ? 'Processing...' : 'Create Transfer',
            type: 'submit',
            form: 'transfer-form',
            disabled: createMutation.isPending,
          },
        ]}
      >
        <Button
          variant="outline"
          onClick={() => navigate(getPath(APP_PATHS.inventory.transfers.list()))}
        >
          Cancel
        </Button>
      </PageHeader>

      <TransferForm form={form} onSubmit={onSubmit} formId="transfer-form" />
    </PageContainer>
  );
}
