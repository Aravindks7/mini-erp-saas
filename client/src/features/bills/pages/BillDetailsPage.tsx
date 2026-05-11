import { useParams, useNavigate } from 'react-router-dom';
import {
  FileEdit,
  AlertCircle,
  User,
  Calendar,
  Clock,
  ShoppingCart,
  Ban,
  Send,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

import { useBill, useUpdateBillStatus } from '../hooks/bills.hooks';
import { useEntityActivity } from '@/features/activity/hooks/activity.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
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
import { formatDate } from '@shared/utils/date';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const billStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  open: { label: 'Open', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  void: { label: 'Void', tone: 'danger' },
};

import { useCurrency } from '@/features/currencies/hooks/use-currency';

export default function BillDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { format: formatCurrency } = useCurrency();
  const { data: bill, isLoading, isError } = useBill(id);
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateBillStatus();
  const { data: activityData, isLoading: isLoadingActivity } = useEntityActivity('bill', id);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !bill) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Bill Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The bill you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath(APP_PATHS.purchasing.bills.list()))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Bills List
          </button>
        </div>
      </PageContainer>
    );
  }

  const handleStatusChange = (status: 'open' | 'paid' | 'void') => {
    updateStatus(
      { id: bill.id, data: { status } },
      {
        onSuccess: () => {
          toast.success(`Bill status updated to ${status}`);
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
        title={`Bill: ${bill.referenceNumber}`}
        description={`Procurement bill from ${bill.supplier?.name || 'Supplier'}.`}
        backButton={{ href: APP_PATHS.purchasing.bills.list(), label: 'Back to List' }}
        actions={[
          {
            label: 'Mark as Paid',
            onClick: () => handleStatusChange('paid'),
            icon: <DollarSign className="h-4 w-4" />,
            variant: 'default',
            hidden: bill.status !== 'open',
            isLoading: isUpdatingStatus,
          },
          {
            label: 'Approve Bill',
            onClick: () => handleStatusChange('open'),
            icon: <Send className="h-4 w-4" />,
            variant: 'outline',
            hidden: bill.status !== 'draft',
            isLoading: isUpdatingStatus,
          },
          {
            label: 'Edit Bill',
            onClick: () => navigate(getPath(APP_PATHS.purchasing.bills.edit(bill.id))),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'outline',
            hidden: bill.status !== 'draft',
          },
          {
            label: 'Void Bill',
            onClick: () => handleStatusChange('void'),
            icon: <Ban className="h-4 w-4" />,
            variant: 'destructive',
            hidden: bill.status === 'paid' || bill.status === 'void' || bill.status === 'draft',
            isLoading: isUpdatingStatus,
          },
        ]}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={bill.status} statusMap={billStatusMap} />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:shadow-sm">
            Line Items ({bill.lines?.length || 0})
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
                          label: 'Supplier',
                          value: bill.supplier?.name,
                        },
                        {
                          label: 'Reference Number',
                          value: bill.referenceNumber,
                          valueClassName: 'font-mono bg-muted/50 w-fit px-2 py-0.5 rounded border',
                        },
                        {
                          label: 'Issue Date',
                          icon: Calendar,
                          value: formatDate(bill.issueDate),
                        },
                        {
                          label: 'Due Date',
                          icon: Clock,
                          value: (
                            <StatusText status={bill.status} date={bill.dueDate}>
                              {formatDate(bill.dueDate)}
                            </StatusText>
                          ),
                        },
                        {
                          label: 'Notes',
                          value: bill.notes,
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
              title="Bill Summary"
              status={bill.status}
              statusMap={billStatusMap}
              lines={[
                {
                  label: 'Subtotal',
                  value: formatCurrency(Number(bill.totalAmount) - Number(bill.taxAmount)),
                  isSubtotal: true,
                },
                {
                  label: 'Tax',
                  value: formatCurrency(Number(bill.taxAmount)),
                },
                {
                  label: 'Total',
                  value: formatCurrency(Number(bill.totalAmount)),
                  isTotal: true,
                },
              ]}
            />
          </div>

          <AuditInfo createdAt={bill.createdAt} updatedAt={bill.updatedAt} />
        </TabsContent>

        <TabsContent value="items" className="mt-6 animate-in slide-in-from-left-2 duration-300">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Bill Items</CardTitle>
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
                  {bill.lines?.map((line) => (
                    <TableRow key={line.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs pl-6">
                        {line.product?.id.split('-')[0] || '—'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {line.product?.name || 'Unknown Product'}
                      </TableCell>
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

        <TabsContent value="activity" className="mt-6 animate-in fade-in-50 duration-500">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardContent className="p-6">
              <ActivityTimeline
                items={
                  (activityData ??
                    []) as import('@/components/shared/ActivityTimeline').ActivityTimelineItem[]
                }
                isLoading={isLoadingActivity}
                emptyMessage="No activity recorded for this bill yet."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
