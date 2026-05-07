import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, FileEdit, AlertCircle, Package, Receipt, Truck } from 'lucide-react';
import * as React from 'react';

import { usePurchaseOrder } from '../hooks/purchase-orders.hooks';
import { useReceipts } from '@/features/receipts/hooks/receipts.hooks';
import { useEntityActivity } from '@/features/activity/hooks/activity.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DocumentSummary } from '@/components/shared/domain/DocumentSummary';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { purchaseOrderStatusMap } from '../components/columns';
import { APP_PATHS } from '@/lib/paths';
import { ReceivePurchaseOrderSheet } from '../components/ReceivePurchaseOrderSheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DetailView } from '@/components/shared/DetailView';
import { ActivityTimeline } from '@/components/shared/ActivityTimeline';

export default function PurchaseOrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: po, isLoading, isError } = usePurchaseOrder(id);

  const [isReceiveSheetOpen, setIsReceiveSheetOpen] = React.useState(false);
  const { data: activityData, isLoading: isLoadingActivity } = useEntityActivity(
    'purchase_order',
    id,
  );

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !po) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Purchase Order Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The purchase order you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath(APP_PATHS.purchasing.orders.list()))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Procurement List
          </button>
        </div>
      </PageContainer>
    );
  }

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const canReceive =
    po.status === 'draft' || po.status === 'sent' || po.status === 'partially_received';
  const canEdit = po.status === 'draft';

  return (
    <PageContainer>
      <PageHeader
        title={po.documentNumber}
        description={`Procurement document for ${po.supplier.name}.`}
        backButton={{
          onClick: () => navigate(getPath(APP_PATHS.purchasing.orders.list())),
          label: 'Back to List',
        }}
        actions={[
          {
            label: 'Receive Order',
            onClick: () => setIsReceiveSheetOpen(true),
            icon: <Package className="h-4 w-4" />,
            variant: 'outline',
            hidden: !canReceive,
          },
          {
            label: 'Edit Order',
            onClick: () => navigate(getPath(APP_PATHS.purchasing.orders.edit(po.id))),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'default',
            hidden: !canEdit,
          },
        ]}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={po.status} statusMap={purchaseOrderStatusMap} />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[700px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:shadow-sm">
            Line Items ({po.lines?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="receipts" className="data-[state=active]:shadow-sm">
            Receipts History
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:shadow-sm">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-muted-foreground/20 overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Supplier Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <DetailView
                  columns={2}
                  sections={[
                    {
                      items: [
                        {
                          label: 'Supplier Name',
                          value: po.supplier.name,
                        },
                        {
                          label: 'Document Number',
                          value: po.documentNumber,
                          valueClassName: 'font-mono bg-muted/50 w-fit px-2 py-0.5 rounded border',
                        },
                      ],
                    },
                  ]}
                />
              </CardContent>{' '}
            </Card>

            <DocumentSummary
              title="Order Summary"
              status={po.status}
              statusMap={purchaseOrderStatusMap}
              lines={[
                {
                  label: 'Subtotal',
                  value: currencyFormatter.format(
                    po.lines.reduce((acc, l) => acc + Number(l.quantity) * Number(l.unitPrice), 0),
                  ),
                  isSubtotal: true,
                },
                {
                  label: 'Total Tax',
                  value: currencyFormatter.format(
                    po.lines.reduce((acc, l) => acc + Number(l.taxAmount), 0),
                  ),
                },
                {
                  label: 'Order Total',
                  value: currencyFormatter.format(Number(po.totalAmount)),
                  isTotal: true,
                },
              ]}
            />
          </div>

          <AuditInfo createdAt={po.createdAt} updatedAt={po.updatedAt} />
        </TabsContent>

        <TabsContent value="items" className="mt-6 animate-in slide-in-from-left-2 duration-300">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Items to Purchase</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px] pl-6 font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="text-right font-semibold">Quantity</TableHead>
                    <TableHead className="text-right font-semibold">Unit Price</TableHead>
                    <TableHead className="text-right font-semibold">Tax</TableHead>
                    <TableHead className="text-right pr-6 font-semibold">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.lines.map((line) => {
                    const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
                    const lineTotal = lineSubtotal + Number(line.taxAmount);
                    return (
                      <TableRow key={line.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs pl-6">{line.product.sku}</TableCell>
                        <TableCell className="font-medium">{line.product.name}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">
                          {currencyFormatter.format(Number(line.unitPrice))}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {currencyFormatter.format(Number(line.taxAmount))}
                          <span className="text-[10px] ml-1">({line.taxRateAtOrder}%)</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold pr-6 text-primary">
                          {currencyFormatter.format(lineTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="bg-muted/20 p-6 flex justify-end">
                <div className="w-[250px] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {currencyFormatter.format(
                        po.lines.reduce(
                          (acc, l) => acc + Number(l.quantity) * Number(l.unitPrice),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tax</span>
                    <span>
                      {currencyFormatter.format(
                        po.lines.reduce((acc, l) => acc + Number(l.taxAmount), 0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-lg text-primary">
                    <span>Order Total</span>
                    <span>{currencyFormatter.format(Number(po.totalAmount))}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="receipts"
          className="mt-6 space-y-6 animate-in slide-in-from-right-2 duration-300"
        >
          <ReceiptsHistory poId={po.id} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6 animate-in fade-in-50 duration-500">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardContent className="p-6">
              <ActivityTimeline
                items={
                  (activityData ??
                    []) as import('@/components/shared/ActivityTimeline').ActivityTimelineItem[]
                }
                isLoading={isLoadingActivity}
                emptyMessage="No activity recorded for this purchase order yet."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReceivePurchaseOrderSheet
        isOpen={isReceiveSheetOpen}
        onClose={() => setIsReceiveSheetOpen(false)}
        po={po}
      />
    </PageContainer>
  );
}

function ReceiptsHistory({ poId }: { poId: string }) {
  const { data: allReceipts, isLoading } = useReceipts();
  const receipts = React.useMemo(
    () => allReceipts?.filter((r) => r.purchaseOrderId === poId) || [],
    [allReceipts, poId],
  );

  if (isLoading) return <SkeletonLoader variant="list" rows={3} />;

  if (receipts.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <Package className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No physical receipts recorded for this order yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {receipts.map((receipt) => (
        <Card key={receipt.id} className="overflow-hidden border-muted-foreground/20">
          <CardHeader className="bg-muted/30 py-3 border-b">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <span className="font-mono font-semibold">{receipt.receiptNumber}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Received: {new Date(receipt.receivedDate).toLocaleDateString()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {receipt.lines.map((line) => (
                <div key={line.id} className="text-sm">
                  <p className="text-muted-foreground text-xs uppercase tracking-tighter">
                    {line.product?.name || 'Unknown Product'}
                  </p>
                  <p className="font-medium">Qty: {line.quantityReceived}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
