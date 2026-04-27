import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, FileEdit, AlertCircle, Package, Receipt, Truck } from 'lucide-react';
import * as React from 'react';

import { usePurchaseOrder } from '../hooks/purchase-orders.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { purchaseOrderStatusMap } from '../components/columns';
import { ReceivePurchaseOrderSheet } from '../components/ReceivePurchaseOrderSheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PurchaseOrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: po, isLoading, isError } = usePurchaseOrder(id);

  const [isReceiveSheetOpen, setIsReceiveSheetOpen] = React.useState(false);

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
            onClick={() => navigate(getPath('/purchase-orders'))}
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

  const canReceive = po.status === 'draft' || po.status === 'sent';

  return (
    <PageContainer>
      <PageHeader
        title={po.documentNumber}
        description={`Procurement document for ${po.supplier.name}.`}
        backButton={{ href: getPath('/purchase-orders'), label: 'Back to List' }}
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
            onClick: () => navigate(getPath(`/purchase-orders/${po.id}/edit`)),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'default',
            hidden: !canReceive,
          },
        ]}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={po.status} statusMap={purchaseOrderStatusMap} />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:shadow-sm">
            Line Items ({po.lines?.length || 0})
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Supplier Name
                    </label>
                    <p className="text-base font-semibold">{po.supplier.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Document Number
                    </label>
                    <p className="text-base font-mono bg-muted/50 w-fit px-2 py-0.5 rounded border">
                      {po.documentNumber}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-dashed">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge value={po.status} statusMap={purchaseOrderStatusMap} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-xl font-bold text-primary">
                    {currencyFormatter.format(Number(po.totalAmount))}
                  </span>
                </div>
              </CardContent>
            </Card>
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
      </Tabs>

      <ReceivePurchaseOrderSheet
        isOpen={isReceiveSheetOpen}
        onClose={() => setIsReceiveSheetOpen(false)}
        po={po}
      />
    </PageContainer>
  );
}
