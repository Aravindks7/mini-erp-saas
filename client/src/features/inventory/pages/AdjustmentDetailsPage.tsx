import { useParams } from 'react-router-dom';
import { ClipboardList, Box, MapPin } from 'lucide-react';

import { useInventoryAdjustment } from '../hooks/inventory.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

const adjustmentStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export function AdjustmentDetailsPage() {
  const { id } = useParams();
  const { data: adjustment, isLoading, isError } = useInventoryAdjustment(id);

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
        backButton={{ href: '/adjustments', label: 'Back to Adjustments' }}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={adjustment.status} statusMap={adjustmentStatusMap} />
        </div>
      </PageHeader>

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
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                  Reason
                </label>
                <p className="text-sm font-medium">{adjustment.reason}</p>
              </div>
              <Separator />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                  Total Items
                </label>
                <p className="text-sm font-medium">{adjustment.lines.length}</p>
              </div>
            </CardContent>
          </Card>

          <AuditInfo createdAt={adjustment.createdAt} updatedAt={adjustment.updatedAt} />
        </div>
      </div>
    </PageContainer>
  );
}
