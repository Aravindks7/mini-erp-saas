import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  FileEdit,
  AlertCircle,
  Truck,
  User,
  ReceiptText,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSalesOrder } from '../hooks/sales-orders.hooks';
import { useShipments } from '@/features/shipments/hooks/shipments.hooks';
import { useCreateInvoiceFromSO } from '@/features/invoices/hooks/invoices.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DocumentSummary } from '@/components/shared/domain/DocumentSummary';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { salesOrderStatusMap } from '../components/columns';
import { FulfillSalesOrderSheet } from '../components/FulfillSalesOrderSheet';
import { DetailView } from '@/components/shared/DetailView';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import React from 'react';

export default function SalesOrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: so, isLoading, isError } = useSalesOrder(id);
  const { mutate: generateInvoice, isPending: isGeneratingInvoice } = useCreateInvoiceFromSO();

  const [isFulfillSheetOpen, setIsFulfillSheetOpen] = React.useState(false);

  const handleGenerateInvoice = () => {
    if (!so) return;
    generateInvoice(so.id, {
      onSuccess: (invoice) => {
        toast.success(`Invoice ${invoice.documentNumber} generated successfully`);
        navigate(getPath(`/invoices/${invoice.id}`));
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to generate invoice');
      },
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !so) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Sales Order Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The sales order you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath('/sales-orders'))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Sales List
          </button>
        </div>
      </PageContainer>
    );
  }

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const canShip = so.status === 'approved' || so.status === 'partially_shipped';
  const canEdit = so.status === 'draft';

  return (
    <PageContainer>
      <PageHeader
        title={so.documentNumber}
        description={`Sales document for ${so.customer.companyName}.`}
        backButton={{ onClick: () => navigate(getPath('/sales-orders')), label: 'Back to List' }}
        actions={[
          {
            label: 'Generate Invoice',
            onClick: handleGenerateInvoice,
            icon: <ReceiptText className="h-4 w-4" />,
            variant: 'outline',
            isLoading: isGeneratingInvoice,
            hidden: so.status === 'draft' || so.status === 'cancelled',
          },
          {
            label: 'Ship Items',
            onClick: () => setIsFulfillSheetOpen(true),
            icon: <Truck className="h-4 w-4" />,
            variant: 'outline',
            hidden: !canShip,
          },
          {
            label: 'Edit Order',
            onClick: () => navigate(getPath(`/sales-orders/${so.id}/edit`)),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'default',
            hidden: !canEdit,
          },
        ]}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={so.status} statusMap={salesOrderStatusMap} />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:shadow-sm">
            Line Items ({so.lines?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="shipments" className="data-[state=active]:shadow-sm">
            Shipment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-muted-foreground/20 overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Customer Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <DetailView
                  columns={2}
                  sections={[
                    {
                      items: [
                        {
                          label: 'Customer Name',
                          value: so.customer.companyName,
                        },
                        {
                          label: 'Document Number',
                          value: so.documentNumber,
                          valueClassName: 'font-mono bg-muted/50 w-fit px-2 py-0.5 rounded border',
                        },
                      ],
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <DocumentSummary
              title="Order Summary"
              status={so.status}
              statusMap={salesOrderStatusMap}
              lines={[
                {
                  label: 'Subtotal',
                  value: currencyFormatter.format(
                    so.lines.reduce((acc, l) => acc + Number(l.quantity) * Number(l.unitPrice), 0),
                  ),
                  isSubtotal: true,
                },
                {
                  label: 'Total Tax',
                  value: currencyFormatter.format(
                    so.lines.reduce((acc, l) => acc + Number(l.taxAmount), 0),
                  ),
                },
                {
                  label: 'Order Total',
                  value: currencyFormatter.format(Number(so.totalAmount)),
                  isTotal: true,
                },
              ]}
            />
          </div>

          <AuditInfo createdAt={so.createdAt} updatedAt={so.updatedAt} />
        </TabsContent>

        <TabsContent value="items" className="mt-6 animate-in slide-in-from-left-2 duration-300">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Order Items</CardTitle>
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
                  {so.lines.map((line) => {
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
                        so.lines.reduce(
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
                        so.lines.reduce((acc, l) => acc + Number(l.taxAmount), 0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-lg text-primary">
                    <span>Order Total</span>
                    <span>{currencyFormatter.format(Number(so.totalAmount))}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="shipments"
          className="mt-6 space-y-6 animate-in slide-in-from-right-2 duration-300"
        >
          <ShipmentsHistory soId={so.id} />
        </TabsContent>
      </Tabs>

      <FulfillSalesOrderSheet
        isOpen={isFulfillSheetOpen}
        onClose={() => setIsFulfillSheetOpen(false)}
        so={so}
      />
    </PageContainer>
  );
}

function ShipmentsHistory({ soId }: { soId: string }) {
  const { data: allShipments, isLoading } = useShipments();
  const shipments = React.useMemo(
    () => allShipments?.filter((s) => s.salesOrderId === soId) || [],
    [allShipments, soId],
  );

  if (isLoading) return <SkeletonLoader variant="list" rows={3} />;

  if (shipments.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <Package className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            No physical shipments recorded for this order yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map((shipment) => (
        <Card key={shipment.id} className="overflow-hidden border-muted-foreground/20">
          <CardHeader className="bg-muted/30 py-3 border-b">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <span className="font-mono font-semibold">{shipment.shipmentNumber}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Shipped: {new Date(shipment.shipmentDate).toLocaleDateString()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shipment.lines.map((line) => (
                <div key={line.id} className="text-sm">
                  <p className="text-muted-foreground text-xs uppercase tracking-tighter">
                    {line.product?.name || 'Unknown Product'}
                  </p>
                  <p className="font-medium">Qty: {line.quantityShipped}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
