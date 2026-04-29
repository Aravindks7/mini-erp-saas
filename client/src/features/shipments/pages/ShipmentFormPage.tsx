import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, X, Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { useTenantPath } from '@/hooks/useTenantPath';
import { toast } from 'sonner';

import type { CreateShipmentInput } from '@shared/contracts/shipments.contract';
import { createShipmentSchema } from '@shared/contracts/shipments.contract';
import { useCreateShipment } from '../hooks/shipments.hooks';
import { ShipmentForm } from '../components/ShipmentForm';

const FORM_ID = 'shipment-form';

export default function ShipmentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const salesOrderIdFromUrl = searchParams.get('salesOrderId') || '';
  const { getPath } = useTenantPath();
  const { mutateAsync: createShipment, isPending } = useCreateShipment();

  const form = useForm<CreateShipmentInput>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      salesOrderId: salesOrderIdFromUrl,
      reference: '',
      shipmentDate: new Date().toISOString().split('T')[0],
      lines: [],
    },
  });

  const onSubmit = async (data: CreateShipmentInput) => {
    const toastId = toast.loading('Recording shipment...');
    try {
      const result = await createShipment(data);
      toast.success('Shipment created successfully', {
        id: toastId,
        description: `Shipment ${result.shipmentNumber} has been recorded.`,
      });
      navigate(getPath(`/shipments/${result.id}`));
    } catch (error) {
      console.error('Shipment creation error:', error);
      toast.error('Failed to create shipment', {
        id: toastId,
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    }
  };

  const handleCancel = () => {
    navigate(getPath('/shipments'));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Shipment"
        description="Fulfill a sales order by recording a new outbound shipment."
        backButton={{ onClick: handleCancel }}
        actions={[
          {
            label: 'Cancel',
            variant: 'outline',
            onClick: handleCancel,
            icon: <X className="h-4 w-4" />,
            disabled: isPending,
          },
          {
            label: isPending ? 'Saving...' : 'Save Shipment',
            variant: 'default',
            type: 'submit',
            form: FORM_ID,
            icon: isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            ),
            disabled: isPending,
            className: 'min-w-[140px] shadow-lg shadow-primary/20',
          },
        ]}
      />

      <ShipmentForm form={form} onSubmit={onSubmit} formId={FORM_ID} />
    </PageContainer>
  );
}
