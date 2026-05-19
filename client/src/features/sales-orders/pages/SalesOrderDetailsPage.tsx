import { useParams, useNavigate } from 'react-router-dom';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';
import { Truck, ReceiptText, CheckCircle, FileEdit, Mail, Printer, XCircle } from 'lucide-react';
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { useSalesOrder, useSalesOrdersQuery } from '../hooks/sales-orders.hooks';
import { useSalesOrderActions } from '../hooks/use-sales-order-actions';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { FulfillSalesOrderSheet } from '../components/FulfillSalesOrderSheet';
import { EntityDetailsProvider } from '@/components/shared/EntityDetails/EntityDetailsProvider';
import { PageContainer } from '@/components/shared/PageContainer';

import { SalesOrderHeader } from '../components/SalesOrderHeader';
import { SalesOrderItemsCard } from '../components/SalesOrderItemsCard';
import { SalesOrderSummaryCard } from '../components/SalesOrderSummaryCard';
import { SalesOrderSidebar } from '../components/SalesOrderSidebar';
import { FulfillmentHistoryCard } from '@/components/shared/domain/FulfillmentHistoryCard';
import { BillingHistoryCard } from '../components/BillingHistoryCard';

export default function SalesOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: so, isLoading, isError } = useSalesOrder(id);
  const { data: orders } = useSalesOrdersQuery();

  const currentIndex = orders?.findIndex((o) => o.id === id) ?? -1;
  const prevOrderId = currentIndex > 0 ? orders?.[currentIndex - 1]?.id : null;
  const nextOrderId =
    currentIndex !== -1 && currentIndex < (orders?.length ?? 0) - 1
      ? orders?.[currentIndex + 1]?.id
      : null;

  const navigation = {
    onPrevious: () => prevOrderId && navigate(getPath(APP_PATHS.sales.orders.detail(prevOrderId))),
    onNext: () => nextOrderId && navigate(getPath(APP_PATHS.sales.orders.detail(nextOrderId))),
    isPreviousDisabled: !prevOrderId,
    isNextDisabled: !nextOrderId,
  };
  const { handleEdit, onApprove, onGenerateInvoice, isUpdatingStatus, isGeneratingInvoice } =
    useSalesOrderActions(id || '');

  const [isFulfillSheetOpen, setIsFulfillSheetOpen] = React.useState(false);

  const canShip = so?.status === 'approved' || so?.status === 'partially_shipped';
  const canEdit = so?.status === 'draft';
  const isCancelled = so?.status === 'cancelled';

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="details" />
      </PageContainer>
    );
  }

  if (isError || !so) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h2 className="text-2xl font-bold">Sales Order Not Found</h2>
          <p className="text-muted-foreground">The requested order could not be loaded.</p>
        </div>
      </PageContainer>
    );
  }

  const subtotal = so.lines.reduce((acc, l) => acc + Number(l.quantity) * Number(l.unitPrice), 0);
  const taxAmount = so.lines.reduce((acc, l) => acc + Number(l.taxAmount), 0);

  return (
    <PageContainer>
      <EntityDetailsProvider data={so} id={id || ''} entityType="sales_order">
        <SalesOrderHeader
          orderNumber={so.documentNumber}
          status={so.status}
          createdAt={so.createdAt}
          onEdit={() => handleEdit(so.id)}
          primaryActionCount={2}
          navigation={navigation}
          actions={[
            {
              label: 'Approve Order',
              onClick: onApprove,
              icon: <CheckCircle className="h-4 w-4" />,
              variant: 'default',
              isLoading: isUpdatingStatus,
              hidden: so.status !== 'draft',
            },
            {
              label: 'Ship Items',
              onClick: () => setIsFulfillSheetOpen(true),
              icon: <Truck className="h-4 w-4" />,
              variant: 'default',
              hidden: !canShip,
            },
            {
              label: 'Edit Order',
              onClick: () => handleEdit(so.id),
              icon: <FileEdit className="h-4 w-4" />,
              variant: 'outline',
              hidden: !canEdit,
            },
            {
              label: 'Generate Invoice',
              onClick: onGenerateInvoice,
              icon: <ReceiptText className="h-4 w-4" />,
              variant: 'outline',
              isLoading: isGeneratingInvoice,
              hidden: so.status === 'draft' || so.status === 'cancelled',
            },
            {
              label: 'Send Email',
              onClick: () => {},
              icon: <Mail className="h-4 w-4" />,
              variant: 'outline',
            },
            {
              label: 'Print PDF',
              onClick: () => {},
              icon: <Printer className="h-4 w-4" />,
              variant: 'outline',
            },
            {
              label: 'Cancel Order',
              onClick: () => {},
              icon: <XCircle className="h-4 w-4" />,
              variant: 'destructive',
              hidden:
                so.status === 'cancelled' || so.status === 'closed' || so.status === 'shipped',
            },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">
            {isCancelled && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Order Cancelled</AlertTitle>
                <AlertDescription>
                  This sales order was cancelled. All inventory allocations have been released.
                </AlertDescription>
              </Alert>
            )}

            <SalesOrderItemsCard lines={so.lines} />

            <SalesOrderSummaryCard
              subtotal={subtotal}
              taxAmount={taxAmount}
              totalAmount={Number(so.totalAmount)}
              itemCount={so.lines.length}
            />

            <FulfillmentHistoryCard
              type="shipment"
              records={(so.shipments || []).map((s) => ({
                id: s.id,
                number: s.shipmentNumber,
                date: s.shipmentDate,
                status: s.status,
                lines: s.lines.map((l) => ({
                  id: l.id,
                  productName: l.product.name,
                  sku: l.product.sku,
                  quantity: l.quantityShipped,
                })),
              }))}
            />

            <BillingHistoryCard invoices={so.invoices || []} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <SalesOrderSidebar order={so} />
          </div>
        </div>

        <FulfillSalesOrderSheet
          isOpen={isFulfillSheetOpen}
          onClose={() => setIsFulfillSheetOpen(false)}
          so={so}
        />
      </EntityDetailsProvider>
    </PageContainer>
  );
}
