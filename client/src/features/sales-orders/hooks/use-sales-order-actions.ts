import { useNavigate } from 'react-router-dom';
import { useUpdateSalesOrderStatus } from './sales-orders.hooks';
import { useEntityActions } from '@/hooks/use-entity-actions';
import { APP_PATHS } from '@/lib/paths';
import { useCreateInvoiceFromSO } from '@/features/invoices/hooks/invoices.hooks';

/**
 * Feature-specific Headless Actions for Sales Orders.
 * Composes shared useEntityActions with SO-specific mutations.
 */
export function useSalesOrderActions(id: string) {
  const navigate = useNavigate();
  const { handleBack, handleEdit, notifySuccess, notifyError, getPath } = useEntityActions({
    listHref: APP_PATHS.sales.orders.list(),
    editHref: (id) => APP_PATHS.sales.orders.edit(id),
  });

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateSalesOrderStatus();
  const { mutate: generateInvoice, isPending: isGeneratingInvoice } = useCreateInvoiceFromSO();

  const onApprove = () => {
    updateStatus(
      { id, status: 'approved', action: 'STATUS_CHANGED', reason: 'Order approved' },
      {
        onSuccess: () => notifySuccess('Sales order approved successfully'),
        onError: (err) => notifyError(err, 'Failed to approve order'),
      },
    );
  };

  const onGenerateInvoice = () => {
    generateInvoice(id, {
      onSuccess: (invoice) => {
        notifySuccess(`Invoice ${invoice.documentNumber} generated successfully`);
        navigate(getPath(APP_PATHS.sales.invoices.detail(invoice.id)));
      },
      onError: (err) => notifyError(err, 'Failed to generate invoice'),
    });
  };

  return {
    handleBack,
    handleEdit,
    onApprove,
    onGenerateInvoice,
    isPending: isUpdatingStatus || isGeneratingInvoice,
    isUpdatingStatus,
    isGeneratingInvoice,
  };
}
