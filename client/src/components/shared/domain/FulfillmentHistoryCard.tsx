import { Package, Truck, Receipt, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { APP_PATHS } from '@/lib/paths';

export interface FulfillmentRecord {
  id: string;
  number: string;
  date: string | Date;
  status: string;
  lines: {
    id: string;
    productName: string;
    sku: string;
    quantity: number | string;
  }[];
}

interface FulfillmentHistoryCardProps {
  records: FulfillmentRecord[];
  type: 'shipment' | 'receipt';
  emptyMessage?: string;
}

/**
 * Reusable Fulfillment History Card component (Shipments or Receipts).
 * Implements Rule 7.6 (Domain-Specific Shared Abstractions) with Enterprise ERP styling.
 * Follows the pattern of BillingHistoryCard.
 */
export function FulfillmentHistoryCard({
  records,
  type,
  emptyMessage,
}: FulfillmentHistoryCardProps) {
  const Icon = type === 'shipment' ? Truck : Receipt;
  const title = type === 'shipment' ? 'Fulfillment & Shipments' : 'Receiving & Receipts';

  if (records.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-muted/10 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <Package className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {emptyMessage || `No physical ${type}s recorded yet.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 py-3 border-b">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/10 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/40">
                <th className="px-4 py-2 font-bold">
                  {type === 'shipment' ? 'Shipment Ref' : 'Receipt Ref'}
                </th>
                <th className="px-4 py-2 font-bold">Status</th>
                <th className="px-4 py-2 font-bold">Items</th>
                <th className="px-4 py-2 font-bold text-right">Total Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {records.map((record) => {
                const detailPath =
                  type === 'shipment'
                    ? APP_PATHS.sales.shipments.detail(record.id)
                    : APP_PATHS.purchasing.receipts.detail(record.id);

                const totalQty = record.lines.reduce((acc, line) => acc + Number(line.quantity), 0);

                return (
                  <tr key={record.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link
                          to={detailPath}
                          className="text-sm font-bold text-foreground hover:text-primary hover:underline transition-colors"
                        >
                          {record.number}
                        </Link>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={record.status} entityType={type} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {record.lines.slice(0, 2).map((line) => (
                          <span
                            key={line.id}
                            className="text-[10px] text-muted-foreground truncate max-w-[150px]"
                          >
                            {line.productName} ({line.quantity})
                          </span>
                        ))}
                        {record.lines.length > 2 && (
                          <span className="text-[9px] text-primary font-medium">
                            + {record.lines.length - 2} more items
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                      {totalQty}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
