import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  AlertCircle,
  User,
  Calendar,
  Clock,
  Ban,
  Send,
  FileEdit,
  DollarSign,
} from 'lucide-react';
import * as React from 'react';

import { useInvoice, useUpdateInvoiceStatus } from '../hooks/invoices.hooks';
import { useEntityActivity } from '@/features/activity/hooks/activity.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DocumentSummary } from '@/components/shared/domain/DocumentSummary';
import { DetailView } from '@/components/shared/DetailView';
import { ActivityTimeline } from '@/components/shared/ActivityTimeline';
import { StatusText } from '@/components/shared/domain/StatusText';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';

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
import { AddPaymentSheet } from '../components/AddPaymentSheet';
import { PaymentHistoryTab } from '../components/PaymentHistoryTab';

import { useCurrency } from '@/features/currencies/hooks/use-currency';

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { format: formatCurrency } = useCurrency();
  const { data: invoice, isLoading, isError } = useInvoice(id);
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateInvoiceStatus();

  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = React.useState(false);
  const { data: activityData, isLoading: isLoadingActivity } = useEntityActivity('invoice', id);

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
            onClick={() => navigate(getPath(APP_PATHS.sales.invoices.list()))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Invoices List
          </button>
        </div>
      </PageContainer>
    );
  }

  const totalPaid = Number(invoice.totalAmount) - Number(invoice.balanceDue ?? invoice.totalAmount);
  const balanceDue = Number(invoice.balanceDue ?? invoice.totalAmount);

  const handleStatusChange = (status: 'open' | 'paid' | 'void') => {
    updateStatus(
      {
        id: invoice.id,
        data: {
          status,
          action: `STATUS_UPDATE_${status.toUpperCase()}`,
          reason: `Manual status update to ${status} via Invoice Details page`,
        },
      },
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

  const isDraft = invoice.status === 'draft';
  const isOpen = invoice.status === 'open' || invoice.status === 'partially_paid';

  return (
    <PageContainer>
      <PageHeader
        title={invoice.documentNumber}
        description={`Invoice for ${invoice.customer.companyName}.`}
        backButton={{ href: APP_PATHS.sales.invoices.list(), label: 'Back to List' }}
        actions={[
          {
            label: 'Record Payment',
            icon: <DollarSign className="h-4 w-4" />,
            onClick: () => setIsPaymentSheetOpen(true),
            variant: 'default',
            hidden: !isOpen,
          },
          {
            label: 'Send to Customer',
            onClick: () => handleStatusChange('open'),
            icon: <Send className="h-4 w-4" />,
            variant: 'outline',
            hidden: !isDraft,
            isLoading: isUpdatingStatus,
          },
          {
            label: 'Edit Invoice',
            onClick: () => navigate(getPath(APP_PATHS.sales.invoices.edit(invoice.id))),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'outline',
            hidden: !isDraft,
          },
          {
            label: 'Void Invoice',
            onClick: () => handleStatusChange('void'),
            icon: <Ban className="h-4 w-4" />,
            variant: 'destructive',
            hidden: !isOpen,
            isLoading: isUpdatingStatus,
          },
        ]}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={invoice.status} entityType="invoice" />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[700px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:shadow-sm">
            Line Items ({invoice.lines?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:shadow-sm">
            Payments
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
                  <User className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Billing Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <DetailView
                  columns={2}
                  sections={[
                    {
                      items: [
                        {
                          label: 'Customer',
                          value: invoice.customer?.companyName,
                        },
                        {
                          label: 'Related Sales Order',
                          value: invoice.salesOrder ? (
                            <button
                              onClick={() =>
                                navigate(
                                  getPath(APP_PATHS.sales.orders.detail(invoice.salesOrderId!)),
                                )
                              }
                              className="text-primary hover:underline"
                            >
                              {invoice.salesOrder.documentNumber}
                            </button>
                          ) : null,
                          valueClassName: invoice.salesOrder
                            ? 'font-mono bg-primary/5 px-2 py-0.5 rounded border border-primary/20 transition-colors w-fit'
                            : undefined,
                        },
                        {
                          label: 'Issue Date',
                          icon: Calendar,
                          value: formatDate(invoice.issueDate),
                        },
                        {
                          label: 'Due Date',
                          icon: Clock,
                          value: (
                            <StatusText status={invoice.status} date={invoice.dueDate}>
                              {formatDate(invoice.dueDate)}
                            </StatusText>
                          ),
                        },
                        {
                          label: 'Notes',
                          value: invoice.notes,
                          fullWidth: true,
                          valueClassName:
                            'italic font-normal text-muted-foreground leading-relaxed',
                        },
                      ],
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <DocumentSummary
              title="Invoice Summary"
              status={invoice.status}
              entityType="invoice"
              lines={[
                {
                  label: 'Subtotal',
                  value: formatCurrency(Number(invoice.totalAmount) - Number(invoice.taxAmount)),
                  isSubtotal: true,
                },
                {
                  label: 'Tax',
                  value: formatCurrency(Number(invoice.taxAmount)),
                },
                {
                  label: 'Total',
                  value: formatCurrency(Number(invoice.totalAmount)),
                  isTotal: true,
                },
                {
                  label: 'Paid to Date',
                  value: formatCurrency(totalPaid),
                },
                {
                  label: 'Balance Due',
                  value: formatCurrency(balanceDue),
                  isTotal: true,
                },
              ]}
            />
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
                        {formatCurrency(Number(line.unitPrice))}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(Number(line.taxAmount))}
                        <span className="text-[10px] ml-1">({line.taxRateAtOrder}%)</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold pr-6 text-primary">
                        {formatCurrency(Number(line.lineTotal))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentHistoryTab invoice={invoice} />
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
                emptyMessage="No activity recorded for this invoice yet."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddPaymentSheet
        invoice={invoice}
        isOpen={isPaymentSheetOpen}
        onClose={() => setIsPaymentSheetOpen(false)}
      />
    </PageContainer>
  );
}
