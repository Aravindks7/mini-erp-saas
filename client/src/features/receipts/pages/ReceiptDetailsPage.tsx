import { useParams, useNavigate } from 'react-router-dom';
import {
  Truck,
  Package,
  AlertCircle,
  FileText,
  Ban,
  FileEdit,
  PackageSearch,
  Receipt,
} from 'lucide-react';
import { useReceipt } from '../hooks/receipts.hooks';
import { useCreateBillFromReceipt } from '@/features/bills/hooks/bills.hooks';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailView } from '@/components/shared/DetailView';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';
import { formatDate } from '@shared/utils/date';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ReceiptDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: receipt, isLoading, isError } = useReceipt(id);
  const { mutate: generateBill, isPending: isGeneratingBill } = useCreateBillFromReceipt();

  const handleGenerateBill = () => {
    if (!receipt) return;
    generateBill(receipt.id, {
      onSuccess: (bill) => {
        toast.success(`Bill ${bill.referenceNumber} generated successfully`);
        navigate(getPath(APP_PATHS.purchasing.bills.detail(bill.id)));
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to generate bill');
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

  if (isError || !receipt) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Receipt Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The receipt record you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath(APP_PATHS.purchasing.receipts.list()))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Receipts List
          </button>
        </div>
      </PageContainer>
    );
  }

  const isDraft = receipt.status === 'draft';
  const isReceived = receipt.status === 'received';

  const actions = [];

  if (isDraft) {
    actions.push(
      {
        label: 'Mark as Received',
        onClick: () => {}, // TODO
        icon: <PackageSearch className="h-4 w-4" />,
      },
      {
        label: 'Edit',
        onClick: () => navigate(getPath(APP_PATHS.purchasing.receipts.edit(receipt.id))),
        icon: <FileEdit className="h-4 w-4" />,
      },
    );
  }

  if (isReceived) {
    actions.push(
      {
        label: 'Generate Bill',
        onClick: handleGenerateBill,
        icon: <Receipt className="h-4 w-4" />,
        variant: 'default' as const,
        isLoading: isGeneratingBill,
      },
      {
        label: 'Cancel Receipt',
        onClick: () => {}, // TODO
        icon: <Ban className="h-4 w-4" />,
        variant: 'destructive' as const,
      },
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={receipt.receiptNumber}
        description={`Inbound shipment received on ${formatDate(receipt.receivedDate)}.`}
        backButton={{
          onClick: () => navigate(getPath(APP_PATHS.purchasing.receipts.list())),
          label: 'Back to Receipts',
        }}
        actions={actions}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={receipt.status as string} entityType="receipt" />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:shadow-sm">
            Received Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">General Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <DetailView
                columns={2}
                sections={[
                  {
                    items: [
                      {
                        label: 'Receipt Number',
                        value: receipt.receiptNumber,
                        valueClassName: 'font-mono bg-muted/50 px-2 py-0.5 rounded border w-fit',
                      },
                      {
                        label: 'Received Date',
                        value: formatDate(receipt.receivedDate),
                      },
                      {
                        label: 'Reference / Packing Slip',
                        value: receipt.reference,
                      },
                      {
                        label: 'Purchase Order',
                        value: receipt.purchaseOrder?.documentNumber,
                        icon: FileText,
                      },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>

          <AuditInfo createdAt={receipt.createdAt} updatedAt={receipt.updatedAt} />
        </TabsContent>

        <TabsContent value="items" className="mt-6 animate-in slide-in-from-left-2 duration-300">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Fulfillment Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="pl-6">Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Bin</TableHead>
                    <TableHead className="text-right pr-6">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.lines.map((line) => (
                    <TableRow key={line.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex flex-col">
                          <span className="font-medium">{line.product?.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {line.product?.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{line.warehouse?.name}</TableCell>
                      <TableCell>{line.bin?.name || '-'}</TableCell>
                      <TableCell className="text-right pr-6 font-semibold text-primary">
                        {line.quantityReceived}
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
