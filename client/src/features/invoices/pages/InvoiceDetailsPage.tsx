import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, AlertCircle, Receipt, User, Calendar, Clock } from 'lucide-react';

import { useInvoice, useUpdateInvoiceStatus } from '../hooks/invoices.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { invoiceStatusMap } from '../components/columns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@shared/utils/date';
import { toast } from 'sonner';

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: invoice, isLoading, isError } = useInvoice(id);
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateInvoiceStatus();

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !invoice) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Invoice Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The invoice you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath('/invoices'))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Invoices List
          </button>
        </div>
      </PageContainer>
    );
  }

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const handleStatusChange = (status: 'open' | 'paid' | 'void') => {
    updateStatus(
      { id: invoice.id, data: { status } },
      {
        onSuccess: () => {
          toast.success(`Invoice status updated to ${status}`);
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to update status');
        },
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={invoice.documentNumber}
        description={`Invoice for ${invoice.customer.companyName}.`}
        backButton={{ href: getPath('/invoices'), label: 'Back to List' }}
        actions={[
          {
            label: 'Mark as Paid',
            onClick: () => handleStatusChange('paid'),
            variant: 'default',
            hidden: invoice.status === 'paid' || invoice.status === 'void',
            isLoading: isUpdatingStatus,
          },
          {
            label: 'Send to Customer',
            onClick: () => handleStatusChange('open'),
            variant: 'outline',
            hidden: invoice.status !== 'draft',
            isLoading: isUpdatingStatus,
          },
        ]}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={invoice.status} statusMap={invoiceStatusMap} />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:shadow-sm">
            Line Items ({invoice.lines?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-muted-foreground/20 overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Billing Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Customer
                    </label>
                    <p className="text-base font-semibold">{invoice.customer.companyName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Related Sales Order
                    </label>
                    {invoice.salesOrder ? (
                      <button
                        onClick={() => navigate(getPath(`/sales-orders/${invoice.salesOrderId}`))}
                        className="text-base font-mono bg-primary/5 text-primary hover:bg-primary/10 w-fit px-2 py-0.5 rounded border border-primary/20 transition-colors"
                      >
                        {invoice.salesOrder.documentNumber}
                      </button>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">None</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5 block">
                        Issue Date
                      </label>
                      <p className="text-sm font-medium">{formatDate(invoice.issueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5 block">
                        Due Date
                      </label>
                      <p className="text-sm font-medium">{formatDate(invoice.dueDate)}</p>
                    </div>
                  </div>
                </div>
                {invoice.notes && (
                  <div className="mt-8 pt-6 border-t">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                      Notes
                    </label>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      "{invoice.notes}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/20 overflow-hidden shadow-sm h-fit">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Invoice Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-dashed">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge value={invoice.status} statusMap={invoiceStatusMap} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {currencyFormatter.format(
                        Number(invoice.totalAmount) - Number(invoice.taxAmount),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{currencyFormatter.format(Number(invoice.taxAmount))}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-xl text-primary">
                    <span>Total</span>
                    <span>{currencyFormatter.format(Number(invoice.totalAmount))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <AuditInfo createdAt={invoice.createdAt} updatedAt={invoice.updatedAt} />
        </TabsContent>

        <TabsContent value="items" className="mt-6 animate-in slide-in-from-left-2 duration-300">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Invoice Items</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px] pl-6 font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="text-right font-semibold">Quantity</TableHead>
                    <TableHead className="text-right font-semibold">Unit Price</TableHead>
                    <TableHead className="text-right font-semibold">Tax</TableHead>
                    <TableHead className="text-right pr-6 font-semibold">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lines.map((line) => (
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
                        {currencyFormatter.format(Number(line.lineTotal))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
