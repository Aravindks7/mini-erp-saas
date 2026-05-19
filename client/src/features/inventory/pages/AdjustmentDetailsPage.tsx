import * as React from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardList, Box, MapPin, CheckCircle, XCircle } from 'lucide-react';

import {
  useInventoryAdjustment,
  useApproveAdjustment,
  useCancelAdjustment,
} from '../hooks/inventory.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { DetailView } from '@/components/shared/DetailView';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { APP_PATHS } from '@/lib/paths';

export default function AdjustmentDetailsPage() {
  const { id } = useParams();
  const { data: adjustment, isLoading, isError } = useInventoryAdjustment(id);
  const { mutate: approve, isPending: isApproving } = useApproveAdjustment();
  const { mutate: cancel, isPending: isCancelling } = useCancelAdjustment();

  const [showApproveDialog, setShowApproveDialog] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !adjustment) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-2xl font-bold">Adjustment Not Found</h2>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={adjustment.reference || 'Adjustment Details'}
        description={`Stock correction recorded on ${new Date(adjustment.adjustmentDate).toLocaleDateString()}`}
        backButton={{ href: APP_PATHS.inventory.adjustments.list(), label: 'Back to Adjustments' }}
      >
        <div className="flex items-center gap-3">
          <div className="hidden sm:block border-l pl-4">
            <StatusBadge value={adjustment.status} entityType="inventory_adjustment" />
          </div>
          {adjustment.status === 'draft' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setShowCancelDialog(true)}
                disabled={isApproving || isCancelling}
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={() => setShowApproveDialog(true)}
                disabled={isApproving || isCancelling}
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </PageHeader>

      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={() => {
          if (id) approve(id);
        }}
        title="Approve Inventory Adjustment"
        description="This will commit the stock changes to the inventory levels and create audit logs. This action cannot be undone."
        confirmLabel="Approve & Commit"
        isLoading={isApproving}
      />

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={() => {
          if (id) cancel(id);
        }}
        title="Cancel Adjustment"
        description="Are you sure you want to cancel this adjustment? This will void the request and no stock changes will be made."
        confirmLabel="Yes, Cancel"
        variant="destructive"
        isLoading={isCancelling}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-muted-foreground/20">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Adjustment Lines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Product</TableHead>
                    <TableHead>Warehouse / Bin</TableHead>
                    <TableHead className="text-right pr-6">Quantity Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustment.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="pl-6">
                        <div className="flex flex-col">
                          <span className="font-medium">{line.product.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {line.product.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {line.warehouse.name}
                          </div>
                          {line.bin && (
                            <span className="text-xs text-muted-foreground ml-4">
                              Bin: {line.bin.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <span
                          className={
                            Number(line.quantityChange) > 0
                              ? 'text-success font-bold'
                              : 'text-destructive font-bold'
                          }
                        >
                          {Number(line.quantityChange) > 0
                            ? `+${line.quantityChange}`
                            : line.quantityChange}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-muted-foreground/20">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <DetailView
                columns={1}
                sections={[
                  {
                    items: [
                      {
                        label: 'Reason',
                        value: adjustment.reason,
                      },
                      {
                        label: 'Total Items',
                        value: adjustment.lines.length,
                      },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>

          <AuditInfo createdAt={adjustment.createdAt} updatedAt={adjustment.updatedAt} />
        </div>
      </div>
    </PageContainer>
  );
}
