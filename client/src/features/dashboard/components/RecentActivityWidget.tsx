import { History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import type { RecentActivity } from '@shared/contracts/dashboard.contract';

interface RecentActivityWidgetProps {
  activity: RecentActivity[];
}

const ORDER_STATUS_MAP: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'info' },
  shipped: { label: 'Shipped', tone: 'success' },
  fulfilled: { label: 'Fulfilled', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  pending: { label: 'Pending', tone: 'warning' },
};

/**
 * Widget displaying chronological business events.
 * Axiom: Provides situational awareness across domain silos.
 */
export function RecentActivityWidget({ activity }: RecentActivityWidgetProps) {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        <History className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No recent activity found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.type === 'sales_order' ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="capitalize text-xs font-medium">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.documentNumber}</TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {item.customerOrSupplierName}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={item.status} statusMap={ORDER_STATUS_MAP} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {currencyFormatter.format(Number(item.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
