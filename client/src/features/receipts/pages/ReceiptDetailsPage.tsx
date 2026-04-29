import { useParams } from 'react-router-dom';
import { Truck, Package, AlertCircle } from 'lucide-react';

import { useReceipt } from '../hooks/receipts.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { formatDate } from '@shared/utils/date';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const receiptStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  received: { label: 'Received', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export default function ReceiptDetailsPage() {
  const { id } = useParams();
  const { getPath } = useTenantPath();
  const { data: receipt, isLoading, isError } = useReceipt(id);

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
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={receipt.receiptNumber}
        description={`Inbound shipment received on ${formatDate(receipt.receivedDate)}.`}
        backButton={{ href: getPath('/receipts'), label: 'Back to Receipts' }}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={receipt.status} statusMap={receiptStatusMap} />
        </div>
      </PageHeader>

      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 py-3 bg-muted/30">
              <Truck className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">General Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <dl className="grid grid-cols-2 gap-y-4 text-sm">
                <dt className="text-muted-foreground">Receipt Number</dt>
                <dd className="font-medium">{receipt.receiptNumber}</dd>

                <dt className="text-muted-foreground">Received Date</dt>
                <dd className="font-medium">{formatDate(receipt.receivedDate)}</dd>

                <dt className="text-muted-foreground">Reference</dt>
                <dd className="font-medium">{receipt.reference || '-'}</dd>

                <dt className="text-muted-foreground">Purchase Order</dt>
                <dd className="font-medium">{receipt.purchaseOrder?.documentNumber || '-'}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 py-3 bg-muted/30">
              <AlertCircle className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Audit Metadata</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <AuditInfo createdAt={receipt.createdAt} updatedAt={receipt.updatedAt} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 py-3 bg-muted/30">
            <Package className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Received Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Bin</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{line.product?.name}</span>
                        <span className="text-xs text-muted-foreground">{line.product?.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>{line.warehouse?.name}</TableCell>
                    <TableCell>{line.bin?.name || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {line.quantityReceived}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
