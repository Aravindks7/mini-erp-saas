import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';

import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ReceiptForm } from '../components/ReceiptForm';
import { useCreateReceipt } from '../hooks/receipts.hooks';
import { useTenantPath } from '@/hooks/useTenantPath';
import type { CreateReceiptInput } from '@shared/contracts/receipts.contract';
import { createReceiptSchema } from '@shared/contracts/receipts.contract';

export default function ReceiptFormPage() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { mutateAsync: createReceipt, isPending } = useCreateReceipt();

  const form = useForm<CreateReceiptInput>({
    resolver: zodResolver(createReceiptSchema),
    defaultValues: {
      reference: '',
      lines: [
        {
          productId: '',
          warehouseId: '',
          binId: '',
          quantityReceived: '1',
        },
      ],
    },
  });

  const onSubmit = async (data: CreateReceiptInput) => {
    try {
      await createReceipt(data);
      navigate(getPath('/receipts'));
    } catch (error) {
      console.error('Failed to submit receipt:', error);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Receive Goods"
        description="Record a new inbound shipment to update inventory stock levels."
        backButton={{ href: getPath('/receipts'), label: 'Back to Receipts' }}
        actions={[
          {
            label: isPending ? 'Creating...' : 'Finalize Receipt',
            onClick: form.handleSubmit(onSubmit),
            icon: <Save className="h-4 w-4" />,
            disabled: isPending,
          },
        ]}
      />
      <div className="mt-8">
        <ReceiptForm form={form} onSubmit={onSubmit} formId="receipt-form" />
      </div>
    </PageContainer>
  );
}
