import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Building, FileText, Info } from 'lucide-react';

import { formatDate } from '@shared/utils/date';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { ErrorState } from '@/components/shared/ErrorState';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { DetailView } from '@/components/shared/DetailView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayment } from '../hooks/payments.hooks';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';

const paymentStatusMap: StatusMap<string> = {
  pending: { label: 'Pending', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

const paymentTypeMap: StatusMap<string> = {
  inbound: { label: 'Inbound', tone: 'success' },
  outbound: { label: 'Outbound', tone: 'neutral' },
};

import { useCurrency } from '@/features/currencies/hooks/use-currency';

export default function PaymentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { format: formatCurrency } = useCurrency();
  const { data: payment, isLoading, isError, refetch } = usePayment(id);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={4} />
      </PageContainer>
    );
  }

  if (isError || !payment) {
    return (
      <PageContainer>
        <ErrorState
          title="Failed to load payment"
          description="We couldn't retrieve the details for this payment record."
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const amount = formatCurrency(Number(payment.amount));

  return (
    <PageContainer>
      <PageHeader
        title={`Payment: ${payment.referenceNumber || 'Details'}`}
        description={`Transaction recorded on ${formatDate(payment.createdAt)}`}
        backButton={{
          onClick: () => navigate(getPath(APP_PATHS.finance.payments.list())),
          label: 'Back to List',
        }}
      >
        <div className="hidden sm:block ml-4 border-l pl-4 gap-2">
          <StatusBadge value={payment.status} statusMap={paymentStatusMap} />
          <StatusBadge value={payment.paymentType} statusMap={paymentTypeMap} />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="associations" className="data-[state=active]:shadow-sm">
            Associations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Transaction Summary</CardTitle>
                </div>
                <div className="text-2xl font-bold text-primary">{amount}</div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <DetailView
                columns={2}
                sections={[
                  {
                    items: [
                      {
                        label: 'Payment Date',
                        value: formatDate(payment.paymentDate),
                      },
                      {
                        label: 'Payment Method',
                        value: payment.paymentMethod.replace('_', ' ').toUpperCase(),
                      },
                      {
                        label: 'Type',
                        value: (
                          <StatusBadge value={payment.paymentType} statusMap={paymentTypeMap} />
                        ),
                      },
                      {
                        label: 'Status',
                        value: <StatusBadge value={payment.status} statusMap={paymentStatusMap} />,
                      },
                      {
                        label: 'Reference Number',
                        value: payment.referenceNumber,
                      },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 text-muted-foreground whitespace-pre-wrap">
              {payment.notes || 'No additional notes recorded for this transaction.'}
            </CardContent>
          </Card>

          <AuditInfo createdAt={payment.createdAt} updatedAt={payment.updatedAt} />
        </TabsContent>

        <TabsContent
          value="associations"
          className="mt-6 space-y-6 animate-in slide-in-from-right-2 duration-300"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Entity Association</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <DetailView
                  columns={1}
                  sections={[
                    {
                      items: [
                        {
                          label: 'Customer',
                          value: payment.customer?.companyName,
                        },
                        {
                          label: 'Supplier',
                          value: payment.supplier?.companyName,
                        },
                      ],
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Document Link</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <DetailView
                  columns={1}
                  sections={[
                    {
                      items: [
                        {
                          label: 'Invoice',
                          value: payment.invoice?.documentNumber,
                        },
                        {
                          label: 'Bill',
                          value: payment.bill?.documentNumber,
                        },
                      ],
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
