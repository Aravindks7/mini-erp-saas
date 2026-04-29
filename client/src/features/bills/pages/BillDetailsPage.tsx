import { useParams, useNavigate } from 'react-router-dom';
import { FileEdit, AlertCircle } from 'lucide-react';

import { useBill } from '../hooks/bills.hooks';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTenantPath } from '@/hooks/useTenantPath';
import { formatDate } from '@shared/utils/date';

export default function BillDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();

  const { data: bill, isLoading, isError } = useBill(id);

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
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Failed to load bill details</h2>
          <Button variant="outline" onClick={() => navigate(getPath('/bills'))}>
            Back to List
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Bill: ${bill.referenceNumber}`}
        description="View bill details."
        backButton={{ onClick: () => navigate(getPath('/bills')) }}
        actions={[
          {
            label: 'Edit',
            variant: 'outline',
            onClick: () => navigate(getPath(`/bills/${id}/edit`)),
            icon: <FileEdit className="h-4 w-4" />,
            disabled: bill.status === 'paid' || bill.status === 'void',
          },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Bill Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Status</span>
              <span className="uppercase">{bill.status}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Reference #</span>
              <span>{bill.referenceNumber}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Supplier</span>
              <span>{bill.supplier?.name || bill.supplierId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Issue Date</span>
              <span>{formatDate(bill.issueDate)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Due Date</span>
              <span>{formatDate(bill.dueDate)}</span>
            </div>
            {bill.notes && (
              <div className="pt-2">
                <span className="text-muted-foreground font-medium block mb-1">Notes</span>
                <p className="text-sm bg-muted/50 p-2 rounded">{bill.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            {bill.lines && bill.lines.length > 0 ? (
              <div className="space-y-4">
                {bill.lines.map((line) => (
                  <div key={line.id} className="flex flex-col border p-3 rounded text-sm gap-1">
                    <div className="flex justify-between font-medium">
                      <span>Product: {line.product?.name || line.productId}</span>
                      <span>Total: ${line.lineTotal}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Qty: {line.quantity}</span>
                      <span>Price: ${line.unitPrice}</span>
                      <span>
                        Tax: ${line.taxAmount} ({line.taxRateAtOrder}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground italic">No line items.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
