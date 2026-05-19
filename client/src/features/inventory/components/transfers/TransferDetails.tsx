import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ActivityTimeline, type ActivityTimelineItem } from '@/components/shared/ActivityTimeline';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { formatDate } from '@shared/utils/date';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InventoryTransferResponse } from '../../api/inventory.api';
import type { ActivityLogResponse } from '@shared/contracts/activity-logs.contract';
import { ArrowRight, Package, Warehouse } from 'lucide-react';
interface TransferDetailsProps {
  transfer: InventoryTransferResponse;
  activityItems: ActivityLogResponse[];
}

export function TransferDetails({ transfer, activityItems }: TransferDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>General Information</CardTitle>
              <StatusBadge value={transfer.status} entityType="inventory_transfer" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Reference</p>
                <p>{transfer.reference || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Transfer Date</p>
                <p>{formatDate(transfer.transferDate)}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-8">
              <div className="flex-1 p-4 bg-muted rounded-lg space-y-2 text-center">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                  <Warehouse className="h-4 w-4" />
                  From Warehouse
                </div>
                <p className="font-semibold">{transfer.fromWarehouse.name}</p>
                <p className="text-xs text-muted-foreground">{transfer.fromWarehouse.code}</p>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />

              <div className="flex-1 p-4 bg-muted rounded-lg space-y-2 text-center">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                  <Warehouse className="h-4 w-4" />
                  To Warehouse
                </div>
                <p className="font-semibold">{transfer.toWarehouse.name}</p>
                <p className="text-xs text-muted-foreground">{transfer.toWarehouse.code}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Info</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditInfo createdAt={transfer.createdAt} updatedAt={transfer.updatedAt} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>Transfer Lines</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfer.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.product.name}</TableCell>
                  <TableCell>{line.product.sku}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold px-1">Activity History</h3>
        <ActivityTimeline items={activityItems as ActivityTimelineItem[]} />
      </div>
    </div>
  );
}
