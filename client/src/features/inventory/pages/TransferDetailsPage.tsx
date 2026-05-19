import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useInventoryTransfer, useUpdateTransferStatus } from '../hooks/inventory.hooks';
import { useEntityActivity } from '@/features/activity/hooks/activity.hooks';
import { PageHeader, type PageHeaderAction } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { TransferDetails } from '../components/transfers/TransferDetails';
import { Button } from '@/components/ui/button';
import { APP_PATHS } from '@/lib/paths';

export default function TransferDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: transfer, isLoading, isError } = useInventoryTransfer(id);
  const { data: activity } = useEntityActivity('inventory_transfer', id);
  const updateStatus = useUpdateTransferStatus();

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !transfer) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold">Transfer Not Found</h2>
          <Button
            variant="link"
            onClick={() => navigate(getPath(APP_PATHS.inventory.transfers.list()))}
            className="mt-4"
          >
            Return to Transfers
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleStatusUpdate = async (status: 'shipped' | 'received' | 'cancelled') => {
    await updateStatus.mutateAsync({ id: transfer.id, status });
  };

  return (
    <PageContainer>
      <PageHeader
        title={transfer.reference || `Transfer ${transfer.id.slice(0, 8)}`}
        description={`Status: ${transfer.status.toUpperCase()}`}
        backButton={{ href: APP_PATHS.inventory.transfers.list(), label: 'Back to Transfers' }}
        actions={
          [
            transfer.status === 'draft' && {
              label: 'Mark Shipped',
              onClick: () => handleStatusUpdate('shipped'),
              disabled: updateStatus.isPending,
            },
            transfer.status === 'shipped' && {
              label: 'Mark Received',
              onClick: () => handleStatusUpdate('received'),
              disabled: updateStatus.isPending,
            },
            (transfer.status === 'draft' || transfer.status === 'shipped') && {
              label: 'Cancel',
              variant: 'outline',
              onClick: () => handleStatusUpdate('cancelled'),
              disabled: updateStatus.isPending,
            },
          ].filter(Boolean) as PageHeaderAction[]
        }
      />

      <div className="mt-6">
        <TransferDetails transfer={transfer} activityItems={activity || []} />
      </div>
    </PageContainer>
  );
}
